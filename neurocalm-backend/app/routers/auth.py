from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.auth import RegisterRequest, LoginResponse, RefreshRequest, ForgotPasswordRequest, ResetPasswordRequest
from app.schemas.user import UserOut
from app.services.auth_service import (
    register_user,
    authenticate_user,
    generate_tokens,
    refresh_access_token,
    create_password_reset,
    reset_password,
)
from app.services.oauth_service import (
    OAuthFlowError,
    build_frontend_oauth_redirect,
    build_oauth_authorize_url,
    get_or_create_oauth_user,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    try:
        user = await register_user(db, data.email, data.full_name, data.password)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    return user


@router.post("/login", response_model=LoginResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    user = await authenticate_user(db, form_data.username, form_data.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    tokens = generate_tokens(user, "local")
    return tokens


@router.get("/oauth/{provider}/start")
async def oauth_start(provider: str, request: Request):
    callback_url = str(request.url_for("oauth_callback", provider=provider))

    try:
        authorize_url = build_oauth_authorize_url(provider, callback_url)
    except OAuthFlowError as exc:
        return RedirectResponse(build_frontend_oauth_redirect(error=str(exc)))

    return RedirectResponse(authorize_url)


@router.get("/oauth/{provider}/callback", name="oauth_callback")
async def oauth_callback(
    provider: str,
    request: Request,
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    error_description: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    if error:
        message = error_description or error.replace("_", " ")
        return RedirectResponse(build_frontend_oauth_redirect(error=message))

    if not code or not state:
        return RedirectResponse(
            build_frontend_oauth_redirect(error="OAuth login was cancelled or incomplete.")
        )

    callback_url = str(request.url_for("oauth_callback", provider=provider))

    try:
        user = await get_or_create_oauth_user(db, provider, code, state, callback_url)
        tokens = generate_tokens(user, provider.lower())
    except OAuthFlowError as exc:
        return RedirectResponse(build_frontend_oauth_redirect(error=str(exc)))

    return RedirectResponse(
        build_frontend_oauth_redirect(
            access_token=tokens["access_token"],
            refresh_token=tokens["refresh_token"],
        )
    )


@router.post("/refresh", response_model=LoginResponse)
async def refresh(data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    tokens = await refresh_access_token(db, data.refresh_token)
    if tokens is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )
    return tokens


@router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    token = await create_password_reset(db, data.email)
    # Always return success to prevent email enumeration
    response = {"message": "If the email exists, a password reset link has been sent."}
    if token is not None:
        # In production, send this via email instead of returning it
        response["reset_token"] = token
    return response


@router.post("/reset-password")
async def reset_password_endpoint(data: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    success = await reset_password(db, data.token, data.new_password)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )
    return {"message": "Password has been reset successfully."}
