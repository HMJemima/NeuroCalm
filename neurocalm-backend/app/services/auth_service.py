import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.password_reset import PasswordResetToken
from app.utils.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token


async def register_user(db: AsyncSession, email: str, full_name: str, password: str) -> User:
    # Check if email is already taken
    result = await db.execute(select(User).where(User.email == email))
    existing = result.scalar_one_or_none()
    if existing:
        raise ValueError("Email already registered")

    user = User(
        email=email,
        full_name=full_name,
        password_hash=hash_password(password),
        role="user",
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def authenticate_user(db: AsyncSession, email: str, password: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user is None or not verify_password(password, user.password_hash):
        return None
    if not user.is_active:
        return None
    return user


def generate_tokens(user: User, auth_provider: str = "local") -> dict:
    access_token = create_access_token(user.id, user.role, auth_provider)
    refresh_token = create_refresh_token(user.id, user.role, auth_provider)
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


async def refresh_access_token(db: AsyncSession, refresh_token: str) -> dict | None:
    payload = decode_token(refresh_token)
    if payload is None or payload.get("type") != "refresh":
        return None

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None or not user.is_active:
        return None

    auth_provider = payload.get("auth_provider") or getattr(user, "auth_provider", "local")
    return generate_tokens(user, auth_provider)


async def create_password_reset(db: AsyncSession, email: str) -> str | None:
    """Generate a password reset token for the user. Returns the plain token."""
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user is None or not user.is_active:
        # Don't reveal whether the email exists
        return None

    token = secrets.token_urlsafe(32)
    token_hash = hash_password(token)

    reset = PasswordResetToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
    )
    db.add(reset)
    await db.commit()

    # In production, send an email with the token. For now, return it in the response.
    return token


async def reset_password(db: AsyncSession, token: str, new_password: str) -> bool:
    """Validate the reset token and update the user's password."""
    # Find all unexpired, unused tokens and check the hash
    result = await db.execute(
        select(PasswordResetToken).where(
            PasswordResetToken.used == False,
            PasswordResetToken.expires_at > datetime.now(timezone.utc),
        )
    )
    reset_tokens = result.scalars().all()

    matched = None
    for rt in reset_tokens:
        if verify_password(token, rt.token_hash):
            matched = rt
            break

    if matched is None:
        return False

    # Update user password
    user_result = await db.execute(select(User).where(User.id == matched.user_id))
    user = user_result.scalar_one_or_none()
    if user is None:
        return False

    user.password_hash = hash_password(new_password)
    matched.used = True
    await db.commit()
    return True
