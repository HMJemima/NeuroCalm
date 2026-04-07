import json
import os
import pickle
from datetime import datetime, timedelta, timezone
from pathlib import Path

from sqlalchemy import select, func, desc, and_, cast, Date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.config import get_settings
from app.models.user import User
from app.models.analysis import Analysis
from app.models.system_setting import SystemSettings
from app.utils.confidence import get_display_confidence
from app.utils.security import hash_password

_settings = get_settings()


def _format_percent(value, digits: int = 2) -> str | None:
    if value is None:
        return None

    if isinstance(value, (int, float)):
        if value <= 1:
            value *= 100
        return f"{value:.{digits}f}%"

    return str(value)


def _normalize_subject_metric(value) -> str | None:
    if value is None:
        return None
    if isinstance(value, str):
        return value
    return _format_percent(value)


def _discover_results_artifact() -> Path | None:
    candidate_dirs = []

    if _settings.MODEL_METADATA_PATH:
        candidate_dirs.append(Path(_settings.MODEL_METADATA_PATH).resolve().parent)

    if _settings.MODEL_PATH:
        candidate_dirs.append(Path(_settings.MODEL_PATH).resolve().parent)

    seen = set()
    for directory in candidate_dirs:
        if not directory.exists():
            continue

        directory_key = str(directory)
        if directory_key in seen:
            continue
        seen.add(directory_key)

        explicit = directory / "results_30sec_150ts.pkl"
        if explicit.exists():
            return explicit

        matches = sorted(directory.glob("results*.pkl"))
        if matches:
            return matches[0]

    return None


def _load_results_artifact() -> dict:
    artifact_path = _discover_results_artifact()
    if artifact_path is None or not artifact_path.exists():
        return {}

    try:
        with artifact_path.open("rb") as handle:
            return pickle.load(handle)
    except Exception:
        return {}


async def get_system_stats(db: AsyncSession) -> dict:
    user_count = await db.execute(select(func.count(User.id)))
    analysis_count = await db.execute(select(func.count(Analysis.id)))

    # Read real accuracy from model metadata if available
    model_info = get_model_info()
    accuracy = model_info.get("accuracy", "N/A")

    return {
        "total_users": f"{user_count.scalar() or 0:,}",
        "total_analyses": f"{analysis_count.scalar() or 0:,}",
        "avg_processing_time": "12.4s",
        "model_accuracy": accuracy,
    }


async def get_all_users(
    db: AsyncSession, page: int = 1, page_size: int = 20
) -> tuple[list[dict], int]:
    # Count total
    total_result = await db.execute(select(func.count(User.id)))
    total = total_result.scalar() or 0

    # Fetch users with analysis count
    query = (
        select(
            User,
            func.count(Analysis.id).label("analyses_count"),
        )
        .outerjoin(Analysis, Analysis.user_id == User.id)
        .group_by(User.id)
        .order_by(desc(User.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    result = await db.execute(query)
    rows = result.all()

    users = []
    for row in rows:
        user = row[0]
        count = row[1]
        users.append({
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "is_active": user.is_active,
            "created_at": user.created_at,
            "analyses_count": count,
        })

    return users, total


async def create_user(db: AsyncSession, data: dict) -> dict:
    result = await db.execute(select(User).where(User.email == data["email"]))
    existing = result.scalar_one_or_none()
    if existing is not None:
        raise ValueError("Email already registered")

    user = User(
        email=data["email"],
        full_name=data["full_name"],
        password_hash=hash_password(data["password"]),
        role=data.get("role") or "user",
        is_active=data.get("is_active", True),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "is_active": user.is_active,
        "created_at": user.created_at,
        "analyses_count": 0,
    }


async def update_user(
    db: AsyncSession, user_id: str, data: dict
) -> dict | None:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        return None

    for key, value in data.items():
        if value is not None and hasattr(user, key):
            setattr(user, key, value)

    await db.commit()
    await db.refresh(user)

    # Get analysis count
    count_result = await db.execute(
        select(func.count(Analysis.id)).where(Analysis.user_id == user.id)
    )

    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "is_active": user.is_active,
        "created_at": user.created_at,
        "analyses_count": count_result.scalar() or 0,
    }


async def delete_user(db: AsyncSession, user_id: str) -> bool:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        return False

    user.is_active = False
    await db.commit()
    return True


def get_model_info() -> dict:
    """Read model metadata from a JSON file if available, otherwise return defaults."""
    meta_path = _settings.MODEL_METADATA_PATH
    if meta_path and os.path.exists(meta_path):
        try:
            with open(meta_path) as f:
                return json.load(f)
        except Exception:
            pass

    # Defaults matching the notebook models
    return {
        "model_type": _settings.MODEL_TYPE,
        "version": "v1.0.0",
        "accuracy": "—" if not _settings.MODEL_PATH else "See metadata",
        "features": "1,200 (8 fNIRS channels x 150 timesteps)",
        "training_data": "Tufts fNIRS2MW — 10 subjects, LOSO CV",
        "last_updated": "2026-03-20",
    }


def get_model_info() -> dict:
    """Read deploy metadata and the saved evaluation artifact when available."""
    metadata = {}
    meta_path = _settings.MODEL_METADATA_PATH
    if meta_path and os.path.exists(meta_path):
        try:
            with open(meta_path) as handle:
                metadata = json.load(handle)
        except Exception:
            metadata = {}

    results_artifact = _load_results_artifact()
    config = results_artifact.get("config", {}) if isinstance(results_artifact, dict) else {}
    results = results_artifact.get("results", {}) if isinstance(results_artifact, dict) else {}
    feature_cols = metadata.get("feature_cols") or config.get("feature_cols") or []
    timesteps = metadata.get("timesteps") or config.get("timesteps")
    n_channels = metadata.get("n_channels") or config.get("n_channels") or (len(feature_cols) or None)
    n_classes = metadata.get("n_classes") or config.get("n_classes")
    accuracy = metadata.get("accuracy") or _format_percent(results.get("overall_accuracy"))
    f1_score = metadata.get("f1_score") or _format_percent(results.get("overall_f1"))
    kappa = metadata.get("kappa")
    if isinstance(kappa, (int, float)):
        kappa = f"{kappa:.4f}"

    last_updated = metadata.get("last_updated") or results_artifact.get("timestamp")
    if not last_updated and _settings.MODEL_PATH and os.path.exists(_settings.MODEL_PATH):
        last_updated = datetime.fromtimestamp(
            os.path.getmtime(_settings.MODEL_PATH),
            tz=timezone.utc,
        ).strftime("%Y-%m-%d %H:%M:%S UTC")

    metadata_subject_results = metadata.get("evaluation_subjects") or []
    subject_results = []
    if metadata_subject_results:
        for index, subject_result in enumerate(metadata_subject_results[:12], start=1):
            subject_label = subject_result.get("subject") or f"Subject {index}"
            subject_results.append({
                "subject": str(subject_label),
                "accuracy": _normalize_subject_metric(subject_result.get("accuracy")),
                "f1": _normalize_subject_metric(subject_result.get("f1")),
            })
    else:
        for subject_result in results.get("subject_results", [])[:12]:
            subject_results.append({
                "subject": f"Subject {subject_result.get('subject')}",
                "accuracy": _format_percent(subject_result.get("accuracy")),
                "f1": _format_percent(subject_result.get("f1")),
            })

    if metadata or results_artifact:
        return {
            "model_type": metadata.get("model_type") or results_artifact.get("experiment") or _settings.MODEL_TYPE,
            "version": metadata.get("version") or results_artifact.get("version") or "v1.0.0",
            "accuracy": accuracy or ("See metadata" if _settings.MODEL_PATH else "N/A"),
            "features": metadata.get("features") or (f"{n_channels} channels x {timesteps} timesteps" if n_channels and timesteps else "Unknown"),
            "training_data": metadata.get("training_data") or "Saved SALIENT evaluation artifact",
            "last_updated": str(last_updated or "Unknown"),
            "f1_score": f1_score,
            "kappa": kappa,
            "timesteps": timesteps,
            "n_channels": n_channels,
            "n_classes": n_classes,
            "feature_cols": feature_cols,
            "evaluation_timestamp": str(metadata.get("evaluation_timestamp") or results_artifact.get("timestamp") or ""),
            "evaluation_subjects": subject_results,
        }

    return {
        "model_type": _settings.MODEL_TYPE,
        "version": "v1.0.0",
        "accuracy": "N/A" if not _settings.MODEL_PATH else "See metadata",
        "features": "1,200 (8 fNIRS channels x 150 timesteps)",
        "training_data": "Tufts fNIRS2MW LOSO CV",
        "last_updated": "2026-03-20",
        "f1_score": None,
        "kappa": None,
        "timesteps": None,
        "n_channels": None,
        "n_classes": None,
        "feature_cols": [],
        "evaluation_timestamp": None,
        "evaluation_subjects": [],
    }


# --- Admin Analyses ---

async def get_all_analyses(
    db: AsyncSession, page: int = 1, page_size: int = 20, search: str = ""
) -> tuple[list[dict], int]:
    base = select(Analysis).options(joinedload(Analysis.user))

    if search:
        pattern = f"%{search}%"
        base = base.where(
            Analysis.filename.ilike(pattern)
            | Analysis.user.has(User.full_name.ilike(pattern))
            | Analysis.user.has(User.email.ilike(pattern))
        )

    # Count total
    count_q = select(func.count(Analysis.id))
    if search:
        pattern = f"%{search}%"
        count_q = count_q.where(
            Analysis.filename.ilike(pattern)
            | Analysis.user_id.in_(
                select(User.id).where(
                    User.full_name.ilike(pattern) | User.email.ilike(pattern)
                )
            )
        )
    total_result = await db.execute(count_q)
    total = total_result.scalar() or 0

    # Fetch page
    query = (
        base.order_by(desc(Analysis.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    result = await db.execute(query)
    rows = result.scalars().all()

    def workload_label(workload_class):
        labels = ["Very Relaxed", "Relaxed", "Moderate", "Stressed"]
        if workload_class is None:
            return "Unknown"
        try:
            return labels[int(workload_class)]
        except (ValueError, IndexError):
            return "Unknown"

    items = []
    for a in rows:
        items.append({
            "id": a.id,
            "user": a.user.full_name,
            "file": a.filename,
            "result": workload_label(a.workload_class),
            "confidence": f"{get_display_confidence(a.confidence, stress_score=a.stress_score, workload_class=a.workload_class, features_count=a.features_count)}%",
            "date": a.created_at.strftime("%Y-%m-%d"),
            "status": "completed",
        })

    return items, total


# --- Analytics ---

async def get_analytics(db: AsyncSession) -> dict:
    now = datetime.now(timezone.utc)

    # Daily analyses for the past 7 days
    day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    daily = []
    for i in range(6, -1, -1):
        day = now - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)

        count_result = await db.execute(
            select(func.count(Analysis.id)).where(
                and_(
                    Analysis.created_at >= day_start,
                    Analysis.created_at < day_end,
                )
            )
        )
        count = count_result.scalar() or 0
        daily.append({
            "name": day_names[day.weekday()],
            "analyses": count,
        })

    # Stress score distribution
    ranges = [
        ("0-20", 0, 20),
        ("21-40", 21, 40),
        ("41-60", 41, 60),
        ("61-80", 61, 80),
        ("81-100", 81, 100),
    ]
    distribution = []
    for label, low, high in ranges:
        count_result = await db.execute(
            select(func.count(Analysis.id)).where(
                and_(
                    Analysis.stress_score >= low,
                    Analysis.stress_score <= high,
                )
            )
        )
        distribution.append({
            "range": label,
            "count": count_result.scalar() or 0,
        })

    # Week total
    week_start = now - timedelta(days=7)
    week_result = await db.execute(
        select(func.count(Analysis.id)).where(Analysis.created_at >= week_start)
    )
    total_this_week = week_result.scalar() or 0

    # Month total
    month_start = now - timedelta(days=30)
    month_result = await db.execute(
        select(func.count(Analysis.id)).where(Analysis.created_at >= month_start)
    )
    total_this_month = month_result.scalar() or 0

    # Average stress score
    avg_result = await db.execute(select(func.avg(Analysis.stress_score)))
    avg_stress = avg_result.scalar() or 0.0

    return {
        "daily": daily,
        "distribution": distribution,
        "total_this_week": total_this_week,
        "total_this_month": total_this_month,
        "avg_stress_score": round(float(avg_stress), 1),
    }


# --- System Settings ---

async def get_system_settings(db: AsyncSession) -> SystemSettings:
    result = await db.execute(select(SystemSettings).limit(1))
    settings = result.scalar_one_or_none()

    if settings is None:
        # Create default settings on first access
        settings = SystemSettings(
            maintenance_mode=False,
            allow_registration=True,
            max_upload_size_mb=50,
            rate_limit_per_minute=60,
            storage_backend="local",
            auto_delete_days=90,
        )
        db.add(settings)
        await db.commit()
        await db.refresh(settings)

    return settings


async def update_system_settings(db: AsyncSession, data: dict) -> SystemSettings:
    settings = await get_system_settings(db)

    for key, value in data.items():
        if value is not None and hasattr(settings, key):
            setattr(settings, key, value)

    await db.commit()
    await db.refresh(settings)
    return settings
