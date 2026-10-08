import uuid
from typing import Any, Dict, Optional
from fastapi import Depends, Header, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ForbiddenError, UnauthorizedError
from app.core.security import decode_token
from app.db.models.user import User
from app.db.session import get_db
from app.repositories.user import UserRepository

security_scheme = HTTPBearer(auto_error=False)


async def get_current_user_id(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
) -> uuid.UUID:
    """Extracts and validates the JWT payload from Authorization Bearer header, returning user UUID."""
    if not credentials or not credentials.credentials:
        raise UnauthorizedError("Authentication token is required", code="AUTH_REQUIRED")
    
    payload = decode_token(credentials.credentials)
    if payload.get("type") != "access":
        raise UnauthorizedError("Invalid token type. Expected access token.", code="INVALID_TOKEN_TYPE")
    
    user_id_str = payload.get("sub")
    if not user_id_str:
        raise UnauthorizedError("Missing user identifier in token", code="INVALID_SUB")
    
    try:
        return uuid.UUID(user_id_str)
    except ValueError:
        raise UnauthorizedError("Malformed user identifier in token", code="MALFORMED_SUB")


async def get_current_user(
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Dependency that resolves and validates the active User record from the database."""
    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(user_id)
    if not user:
        raise UnauthorizedError("User account not found", code="USER_NOT_FOUND")
    
    if user.status == "banned":
        raise ForbiddenError("This account has been banned from ListedWheels", code="USER_BANNED")
    if user.status == "suspended":
        raise ForbiddenError("This account has been suspended", code="USER_SUSPENDED")
    
    return user


async def require_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """Dependency enforcing that the calling user has the 'admin' role."""
    if current_user.role != "admin":
        raise ForbiddenError("Administrator access required for this operation", code="ADMIN_REQUIRED")
    return current_user


async def require_tos_accepted(
    current_user: User = Depends(get_current_user),
) -> User:
    """Dependency enforcing that the user has accepted Terms of Service."""
    if not current_user.tos_accepted_at:
        raise ForbiddenError("You must accept the Terms of Service before proceeding", code="TOS_REQUIRED")
    return current_user
