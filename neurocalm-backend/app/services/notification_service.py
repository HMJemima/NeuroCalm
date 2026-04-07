from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification_preference import NotificationPreference


async def get_preferences(db: AsyncSession, user_id: str) -> NotificationPreference:
    result = await db.execute(
        select(NotificationPreference).where(NotificationPreference.user_id == user_id)
    )
    pref = result.scalar_one_or_none()

    if pref is None:
        # Create default preferences on first access
        pref = NotificationPreference(
            user_id=user_id,
            email_notifications=True,
            analysis_complete=True,
            weekly_summary=True,
        )
        db.add(pref)
        await db.commit()
        await db.refresh(pref)

    return pref


async def update_preferences(db: AsyncSession, user_id: str, data: dict) -> NotificationPreference:
    pref = await get_preferences(db, user_id)

    for key, value in data.items():
        if value is not None and hasattr(pref, key):
            setattr(pref, key, value)

    await db.commit()
    await db.refresh(pref)
    return pref
