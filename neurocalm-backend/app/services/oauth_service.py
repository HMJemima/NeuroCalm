from __future__ import annotations

import asyncio
import secrets
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

import requests
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.user import User
from app.utils.security import hash_password

settings = get_settings()


class OAuthFlowError(Exception):
    pass


@dataclass(frozen=True)
class OAuthProviderConfig:
    name: str
    client_id: str
    client_secret: str
    authorize_url: str
    token_url: str
    scopes: list[str]
    userinfo_url: str
    emails_url: str | None = None
    extra_authorize_params: dict[str, str] = field(default_factory=dict)
    extra_token_params: dict[str, str] = field(default_factory=dict)
    default_headers: dict[str, str] = field(default_factory=dict)


def _oauth_state_token(provider: str) -> str:
    payload = {
        "type": "oauth_state",
        "provider": provider,
        "nonce": secrets.token_urlsafe(8),
        "exp": datetime.now(timezone.utc) + timedelta(minutes=10),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def _validate_oauth_state(provider: str, state: str) -> None:
    try:
        payload = jwt.decode(state, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError as exc:
        raise OAuthFlowError("OAuth session expired. Please try again.") from exc

    if payload.get("type") != "oauth_state" or payload.get("provider") != provider:
        raise OAuthFlowError("OAuth session is invalid. Please try again.")


def _provider_config(provider: str) -> OAuthProviderConfig:
    provider = provider.lower()

    if provider == "google":
        config = OAuthProviderConfig(
            name="Google",
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
            authorize_url="https://accounts.google.com/o/oauth2/v2/auth",
            token_url="https://oauth2.googleapis.com/token",
            userinfo_url="https://openidconnect.googleapis.com/v1/userinfo",
            scopes=["openid", "email", "profile"],
            extra_authorize_params={"access_type": "online", "prompt": "select_account"},
        )
    elif provider == "github":
        config = OAuthProviderConfig(
            name="GitHub",
            client_id=settings.GITHUB_CLIENT_ID,
            client_secret=settings.GITHUB_CLIENT_SECRET,
            authorize_url="https://github.com/login/oauth/authorize",
            token_url="https://github.com/login/oauth/access_token",
            userinfo_url="https://api.github.com/user",
            emails_url="https://api.github.com/user/emails",
            scopes=["read:user", "user:email"],
            default_headers={
                "Accept": "application/json",
                "User-Agent": "NeuroCalm",
            },
        )
    elif provider == "microsoft":
        tenant = settings.MICROSOFT_TENANT_ID or "common"
        config = OAuthProviderConfig(
            name="Microsoft",
            client_id=settings.MICROSOFT_CLIENT_ID,
            client_secret=settings.MICROSOFT_CLIENT_SECRET,
            authorize_url=f"https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize",
            token_url=f"https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token",
            userinfo_url="https://graph.microsoft.com/v1.0/me",
            scopes=["openid", "profile", "email", "User.Read"],
            extra_authorize_params={"prompt": "select_account"},
        )
    else:
        raise OAuthFlowError(f"Unsupported OAuth provider: {provider}")

    if not config.client_id or not config.client_secret:
        raise OAuthFlowError(f"{config.name} login is not configured yet.")

    return config


def build_oauth_authorize_url(provider: str, redirect_uri: str) -> str:
    config = _provider_config(provider)
    params = {
        "client_id": config.client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": " ".join(config.scopes),
        "state": _oauth_state_token(provider.lower()),
    }
    params.update(config.extra_authorize_params)
    return f"{config.authorize_url}?{urlencode(params)}"


def build_frontend_oauth_redirect(
    *,
    access_token: str | None = None,
    refresh_token: str | None = None,
    error: str | None = None,
) -> str:
    base_url = settings.frontend_oauth_callback_url

    if error:
        return f"{base_url}?{urlencode({'error': error})}"

    fragment = urlencode({
        "access_token": access_token or "",
        "refresh_token": refresh_token or "",
        "token_type": "bearer",
    })
    return f"{base_url}#{fragment}"


def _request_json(
    method: str,
    url: str,
    *,
    headers: dict[str, str] | None = None,
    data: dict | None = None,
) -> dict | list:
    response = requests.request(
        method,
        url,
        headers=headers,
        data=data,
        timeout=20,
    )
    response.raise_for_status()
    return response.json()


async def _request_json_async(
    method: str,
    url: str,
    *,
    headers: dict[str, str] | None = None,
    data: dict | None = None,
) -> dict | list:
    try:
        return await asyncio.to_thread(
            _request_json,
            method,
            url,
            headers=headers,
            data=data,
        )
    except requests.RequestException as exc:
        raise OAuthFlowError("Could not complete provider authentication. Please try again.") from exc


async def _exchange_code_for_token(provider: str, code: str, redirect_uri: str) -> str:
    config = _provider_config(provider)
    headers = dict(config.default_headers)
    token_data = {
        "client_id": config.client_id,
        "client_secret": config.client_secret,
        "code": code,
        "redirect_uri": redirect_uri,
    }
    token_data.update(config.extra_token_params)

    if provider != "github":
        token_data["grant_type"] = "authorization_code"
        headers.setdefault("Accept", "application/json")

    token_response = await _request_json_async(
        "POST",
        config.token_url,
        headers=headers,
        data=token_data,
    )

    access_token = token_response.get("access_token")
    if not access_token:
        raise OAuthFlowError("Provider did not return an access token.")

    return access_token


async def _fetch_provider_profile(provider: str, access_token: str) -> dict:
    config = _provider_config(provider)
    headers = {
        **config.default_headers,
        "Authorization": f"Bearer {access_token}",
    }

    if provider == "google":
        profile = await _request_json_async("GET", config.userinfo_url, headers=headers)
        email = profile.get("email")
        if not email or not profile.get("email_verified"):
            raise OAuthFlowError("Google did not return a verified email address.")

        return {
            "email": email.lower(),
            "full_name": profile.get("name") or email.split("@")[0],
        }

    if provider == "github":
        profile = await _request_json_async("GET", config.userinfo_url, headers=headers)
        email = profile.get("email")

        if not email and config.emails_url:
            email_entries = await _request_json_async("GET", config.emails_url, headers=headers)
            verified_entries = [item for item in email_entries if item.get("verified")]
            primary_verified = next((item for item in verified_entries if item.get("primary")), None)
            selected_email = primary_verified or (verified_entries[0] if verified_entries else None)
            email = selected_email.get("email") if selected_email else None

        if not email:
            raise OAuthFlowError("GitHub did not return a usable email address.")

        return {
            "email": email.lower(),
            "full_name": profile.get("name") or profile.get("login") or email.split("@")[0],
        }

    if provider == "microsoft":
        profile = await _request_json_async("GET", config.userinfo_url, headers=headers)
        email = profile.get("mail") or profile.get("userPrincipalName")
        if not email:
            raise OAuthFlowError("Microsoft did not return a usable email address.")

        return {
            "email": email.lower(),
            "full_name": profile.get("displayName") or email.split("@")[0],
        }

    raise OAuthFlowError(f"Unsupported OAuth provider: {provider}")


async def get_or_create_oauth_user(db: AsyncSession, provider: str, code: str, state: str, redirect_uri: str) -> User:
    provider = provider.lower()
    _validate_oauth_state(provider, state)

    access_token = await _exchange_code_for_token(provider, code, redirect_uri)
    profile = await _fetch_provider_profile(provider, access_token)

    result = await db.execute(select(User).where(User.email == profile["email"]))
    user = result.scalar_one_or_none()

    if user is not None:
        if not user.is_active:
            raise OAuthFlowError("This account is inactive. Please contact support.")

        if profile["full_name"] and user.full_name != profile["full_name"]:
            user.full_name = profile["full_name"]
            await db.commit()
            await db.refresh(user)

        return user

    user = User(
        email=profile["email"],
        full_name=profile["full_name"],
        password_hash=hash_password(secrets.token_urlsafe(24)),
        role="user",
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user
