"""
Seed only the demo admin and demo user accounts.

Run:
    python seed.py

Creates or updates:
  - Demo Admin: admin@neurocalm.com / admin123
  - Demo User: user@neurocalm.com / user123
  - 10 total seeded analyses across those two accounts
  - Scenario-style results covering very calm, calm, moderate, and stressed states
"""

import asyncio
import random
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, select

from app.database import Base, async_session, engine
from app.models.analysis import Analysis
from app.models.user import User
from app.utils.security import hash_password

DEMO_ADMIN_EMAIL = "admin@neurocalm.com"
DEMO_USER_EMAIL = "user@neurocalm.com"
SEEDED_FILE_PREFIX = "uploads/seed_"
LEGACY_SEEDED_EMAILS = [
    "admin@neurocalm.com",
    "user@neurocalm.com",
    "demoadmin@gmail.com",
    "demouser@gmail.com",
    "hmJemima@gmail.com",
    "sazid@gmail.com",
    "emily@research.edu",
    "mross@clinic.com",
    "alex.k@lab.org",
]


def make_band_powers(stress_score: float) -> dict:
    s = stress_score / 100.0
    delta = 35 - 15 * s
    theta = 18 + 8 * s
    alpha = 25 - 14 * s
    beta = 8 + 14 * s
    gamma = 5 + 10 * s
    total = delta + theta + alpha + beta + gamma
    return {
        "delta": round(delta / total * 100, 1),
        "theta": round(theta / total * 100, 1),
        "alpha": round(alpha / total * 100, 1),
        "beta": round(beta / total * 100, 1),
        "gamma": round(gamma / total * 100, 1),
    }


def make_workload(stress_score: float) -> tuple[int, list[float]]:
    if stress_score <= 25:
        workload_class = 0
    elif stress_score <= 50:
        workload_class = 1
    elif stress_score <= 75:
        workload_class = 2
    else:
        workload_class = 3

    probabilities = [0.0] * 4
    probabilities[workload_class] = round(0.58 + random.uniform(0, 0.12), 4)
    remaining = round(1.0 - probabilities[workload_class], 4)

    for index in range(4):
        if index != workload_class:
            probabilities[index] = round(remaining / 3, 4)

    return workload_class, probabilities


async def upsert_user(db, *, email: str, full_name: str, password: str, role: str, created_at: datetime) -> User:
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if user is None:
        user = User(email=email)
        db.add(user)

    user.full_name = full_name
    user.password_hash = hash_password(password)
    user.role = role
    user.is_active = True
    user.created_at = created_at
    return user


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as db:
        legacy_user_ids = select(User.id).where(User.email.in_(LEGACY_SEEDED_EMAILS))
        await db.execute(delete(Analysis).where(Analysis.user_id.in_(legacy_user_ids)))
        await db.execute(delete(User).where(User.email.in_(LEGACY_SEEDED_EMAILS)))

        admin = await upsert_user(
            db,
            email=DEMO_ADMIN_EMAIL,
            full_name="Demo Admin",
            password="admin123",
            role="admin",
            created_at=datetime(2025, 6, 15, 10, 0, 0, tzinfo=timezone.utc),
        )
        user = await upsert_user(
            db,
            email=DEMO_USER_EMAIL,
            full_name="Demo User",
            password="user123",
            role="user",
            created_at=datetime(2025, 9, 20, 14, 30, 0, tzinfo=timezone.utc),
        )
        await db.flush()

        demo_user_ids = [admin.id, user.id]
        await db.execute(
            delete(Analysis).where(
                Analysis.user_id.in_(demo_user_ids),
                Analysis.file_path.like(f"{SEEDED_FILE_PREFIX}%"),
            )
        )

        now = datetime.now(timezone.utc)
        sample_analyses = [
            (admin, "admin_without_meditation_stressed.oxy", 84, 93.4, 2),
            (admin, "admin_after_guided_meditation_very_calm.nir", 16, 96.2, 24),
            (admin, "admin_box_breathing_calm.csv", 31, 94.1, 72),
            (admin, "admin_pre_meeting_moderate_load.oxy", 58, 92.7, 120),
            (admin, "admin_evening_recovery_calm.nir", 27, 95.4, 192),
            (user, "user_without_meditation_stressed.oxy", 81, 92.5, 1),
            (user, "user_after_meditation_very_calm.nir", 14, 96.6, 24),
            (user, "user_focus_task_moderate.csv", 63, 91.6, 48),
            (user, "user_deep_breathing_calm.oxy", 34, 94.8, 72),
            (user, "user_sleep_recovery_very_calm.csv", 18, 95.9, 120),
        ]

        for account, filename, score, confidence, hours_ago in sample_analyses:
            workload_class, probabilities = make_workload(score)
            db.add(
                Analysis(
                    user_id=account.id,
                    filename=filename,
                    file_path=f"{SEEDED_FILE_PREFIX}{filename}",
                    stress_score=score,
                    confidence=confidence,
                    stress_probability=score if score > 50 else 100 - score,
                    features_count=1200,
                    band_powers=make_band_powers(score),
                    workload_class=workload_class,
                    class_probabilities=probabilities,
                    created_at=now - timedelta(hours=hours_ago),
                )
            )

        await db.commit()

    print("Database seeded successfully.")
    print("Demo accounts:")
    print(f"  Admin: {DEMO_ADMIN_EMAIL} / admin123")
    print(f"  User:  {DEMO_USER_EMAIL} / user123")
    print("Seeded analyses: 10 total")


if __name__ == "__main__":
    asyncio.run(seed())
