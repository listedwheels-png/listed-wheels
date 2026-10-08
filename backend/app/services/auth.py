import uuid
from datetime import datetime, timezone
from typing import Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession

from app.clients.google_auth import google_auth_client
from app.core.config import settings
from app.core.errors import ForbiddenError, NotFoundError, UnauthorizedError
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.db.models.user import User
from app.repositories.user import UserRepository


class AuthService:
    """Service implementing Google OAuth authentication, JWT token lifecycle, and role verification."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.user_repo = UserRepository(session)

    async def authenticate_google(
        self,
        id_token: str,
        accept_tos: bool = False,
        tos_version: str = "1.0",
    ) -> Tuple[str, str, User]:
        """Verifies Google ID token, provisions or retrieves user, and generates access/refresh tokens."""
        # 1. Verify token signature and claims with Google
        token_info = await google_auth_client.verify_id_token(id_token)
        google_sub = token_info.get("sub")
        email = token_info.get("email")
        name = token_info.get("name") or (email.split("@")[0] if email else "User")

        if not email or not google_sub:
            raise UnauthorizedError("Google ID token missing essential identity claims", code="INVALID_GOOGLE_CLAIMS")

        # 2. Check if user already exists
        user = await self.user_repo.get_by_google_sub(google_sub)
        if not user:
            user = await self.user_repo.get_by_email(email)
            if user:
                # Link existing email account with Google Sub
                user = await self.user_repo.link_google_sub(user.id, google_sub)

        # 3. Create user if new
        if not user:
            tos_time = datetime.now(timezone.utc) if accept_tos else None
            tos_ver = tos_version if accept_tos else None
            user = await self.user_repo.create_user(
                email=email,
                name=name,
                google_sub=google_sub,
                role="buyer",
                status="active",
                tos_version=tos_ver,
                tos_accepted_at=tos_time,
            )

        # 4. Check account status
        if user.status == "banned":
            raise ForbiddenError("This account has been banned from ListedWheels", code="USER_BANNED")
        if user.status == "suspended":
            raise ForbiddenError("This account has been suspended pending review", code="USER_SUSPENDED")

        # 5. Generate JWT tokens
        access_token = create_access_token(subject=str(user.id))
        refresh_token = create_refresh_token(subject=str(user.id))

        await self.session.commit()
        return access_token, refresh_token, user

    async def refresh_access_token(self, refresh_token: str) -> Tuple[str, User]:
        """Validates refresh token and issues a new 15-minute access token."""
        if not refresh_token:
            raise UnauthorizedError("Missing refresh token", code="REFRESH_TOKEN_REQUIRED")

        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise UnauthorizedError("Invalid token type for refresh", code="INVALID_TOKEN_TYPE")

        user_id_str = payload.get("sub")
        if not user_id_str:
            raise UnauthorizedError("Invalid token subject", code="INVALID_SUB")

        try:
            user_id = uuid.UUID(user_id_str)
        except ValueError:
            raise UnauthorizedError("Malformed user identifier in token", code="MALFORMED_SUB")

        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise UnauthorizedError("User no longer exists", code="USER_NOT_FOUND")

        if user.status != "active":
            raise ForbiddenError(f"Account is {user.status}", code=f"USER_{user.status.upper()}")

        new_access_token = create_access_token(subject=str(user.id))
        return new_access_token, user

    async def accept_tos(self, user_id: uuid.UUID, tos_version: str = "1.0") -> User:
        """Records user Terms of Service consent with timestamp."""
        user = await self.user_repo.update_tos_consent(user_id, tos_version)
        if not user:
            raise NotFoundError("User not found", code="USER_NOT_FOUND")
        await self.session.commit()
        return user
