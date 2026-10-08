from typing import Any, Optional
from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.core.config import settings
from app.db.models.user import User
from app.schemas.auth import (
    AcceptTOSRequest,
    AuthTokenResponse,
    GoogleAuthRequest,
    RefreshTokenRequest,
)
from app.schemas.common import MessageResponse
from app.schemas.user import UserResponse
from app.services.auth import AuthService

router = APIRouter()

REFRESH_COOKIE_NAME = "lw_refresh_token"
COOKIE_MAX_AGE = settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60  # in seconds


@router.post(
    "/google",
    response_model=AuthTokenResponse,
    summary="Sign in with Google OAuth ID token",
    description="Verifies Google ID token, provisions or retrieves the user, and sets a 30-day HttpOnly refresh cookie.",
)
async def login_google(
    req: GoogleAuthRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> Any:
    auth_service = AuthService(db)
    access_token, refresh_token, user = await auth_service.authenticate_google(
        id_token=req.id_token,
        accept_tos=req.accept_tos,
        tos_version=req.tos_version or "1.0",
    )

    # Set HttpOnly, Secure, SameSite refresh cookie
    is_prod = settings.ENVIRONMENT == "production"
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=refresh_token,
        httponly=True,
        secure=is_prod,
        samesite="lax",
        max_age=COOKIE_MAX_AGE,
        path="/api/v1/auth",
    )

    return AuthTokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(user),
    )


@router.post(
    "/refresh",
    response_model=AuthTokenResponse,
    summary="Refresh access token using HttpOnly cookie",
    description="Exchanges a valid refresh token cookie for a new 15-minute access token.",
)
async def refresh_token(
    request: Request,
    req_body: Optional[RefreshTokenRequest] = None,
    lw_refresh_token: Optional[str] = Cookie(None),
    db: AsyncSession = Depends(get_db),
) -> Any:
    # Read from cookie first, then fallback to request body
    token = lw_refresh_token or (req_body.refresh_token if req_body else None)
    
    auth_service = AuthService(db)
    new_access_token, user = await auth_service.refresh_access_token(token)

    return AuthTokenResponse(
        access_token=new_access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(user),
    )


@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="Sign out and clear session cookie",
)
async def logout(response: Response) -> Any:
    response.delete_cookie(
        key=REFRESH_COOKIE_NAME,
        path="/api/v1/auth",
    )
    return MessageResponse(message="Successfully logged out.")


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get authenticated user profile",
)
async def get_me(current_user: User = Depends(get_current_user)) -> Any:
    return UserResponse.model_validate(current_user)


@router.post(
    "/tos",
    response_model=UserResponse,
    summary="Record Terms of Service consent",
)
async def accept_tos(
    req: AcceptTOSRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    auth_service = AuthService(db)
    updated_user = await auth_service.accept_tos(current_user.id, req.tos_version)
    return UserResponse.model_validate(updated_user)


@router.delete(
    "/me",
    response_model=MessageResponse,
    summary="Request account and data deletion (DPDP compliance)",
)
async def delete_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    auth_service = AuthService(db)
    await auth_service.user_repo.update_status(current_user.id, "suspended")
    await db.commit()
    return MessageResponse(message="Account data deletion request registered under DPDP Act.")
