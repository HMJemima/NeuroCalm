import os
import uuid
from datetime import datetime, timezone

from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.config import get_settings
from app.models.analysis import Analysis
from app.models.user import User
from app.utils.eeg_processor import predict_stress, validate_file

settings = get_settings()


async def save_upload(file_content: bytes, filename: str) -> str:
    """Save uploaded file to disk and return the file path."""
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    ext = os.path.splitext(filename)[1]
    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_name)
    with open(file_path, "wb") as f:
        f.write(file_content)
    return file_path


async def run_analysis(db: AsyncSession, user: User, filename: str, file_path: str) -> Analysis:
    """Run fNIRS/EEG analysis on the uploaded file and persist the result."""
    if not validate_file(filename):
        raise ValueError("Unsupported file format. Use .csv, .nir, .oxy, .mat, or .edf")

    result = predict_stress(file_path)

    analysis = Analysis(
        user_id=user.id,
        filename=filename,
        file_path=file_path,
        stress_score=result["stress_score"],
        confidence=result["confidence"],
        stress_probability=result["stress_probability"],
        features_count=result["features_count"],
        band_powers=result["band_powers"],
        workload_class=result["workload_class"],
        class_probabilities=result["class_probabilities"],
    )
    db.add(analysis)
    await db.commit()
    await db.refresh(analysis)
    return analysis


async def get_analysis_by_id(db: AsyncSession, analysis_id: str, user: User) -> Analysis | None:
    query = (
        select(Analysis)
        .options(joinedload(Analysis.user))
        .where(Analysis.id == analysis_id)
    )
    # Non-admin users can only access their own analyses
    if user.role != "admin":
        query = query.where(Analysis.user_id == user.id)

    result = await db.execute(query)
    return result.scalar_one_or_none()


async def delete_analysis(db: AsyncSession, analysis_id: str, user: User) -> bool:
    analysis = await get_analysis_by_id(db, analysis_id, user)
    if analysis is None:
        return False

    # Remove the file from disk
    if os.path.exists(analysis.file_path):
        os.remove(analysis.file_path)

    await db.delete(analysis)
    await db.commit()
    return True


async def get_history(
    db: AsyncSession, user: User, page: int = 1, page_size: int = 10
) -> tuple[list[Analysis], int]:
    """Get paginated analysis history for a user (or all for admin)."""
    base_query = select(Analysis).options(joinedload(Analysis.user))

    if user.role != "admin":
        base_query = base_query.where(Analysis.user_id == user.id)

    # Count total
    count_query = select(func.count(Analysis.id))
    if user.role != "admin":
        count_query = count_query.where(Analysis.user_id == user.id)
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Fetch page
    query = (
        base_query
        .order_by(desc(Analysis.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    result = await db.execute(query)
    items = list(result.scalars().all())

    return items, total


async def get_user_stats(db: AsyncSession, user: User) -> dict:
    """Get aggregated stats for a user."""
    total_result = await db.execute(
        select(func.count(Analysis.id)).where(Analysis.user_id == user.id)
    )
    total = total_result.scalar() or 0

    avg_result = await db.execute(
        select(func.avg(Analysis.stress_score)).where(Analysis.user_id == user.id)
    )
    avg_score = avg_result.scalar() or 0.0

    last_result = await db.execute(
        select(Analysis.created_at)
        .where(Analysis.user_id == user.id)
        .order_by(desc(Analysis.created_at))
        .limit(1)
    )
    last_at = last_result.scalar_one_or_none()

    # Simple trend based on last 5 vs previous 5
    recent = await db.execute(
        select(Analysis.stress_score)
        .where(Analysis.user_id == user.id)
        .order_by(desc(Analysis.created_at))
        .limit(10)
    )
    scores = [row[0] for row in recent.all()]
    if len(scores) >= 6:
        recent_avg = sum(scores[:5]) / 5
        older_avg = sum(scores[5:10]) / len(scores[5:10])
        trend = "improving" if recent_avg < older_avg else "increasing"
    else:
        trend = "stable"

    return {
        "total_analyses": total,
        "avg_stress_score": round(float(avg_score), 1),
        "last_analysis_at": last_at,
        "trend": trend,
    }
