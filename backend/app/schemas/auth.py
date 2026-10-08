from typing import Optional
from pydantic import BaseModel, Field
from app.schemas.user import UserResponse


class GoogleAuthRequest(BaseModel):
    id_token: str = Field(description="Google OAuth ID token obtained from Google Sign-In")
    accept_tos: bool = Field(default=False, description="Whether the user agreed to Terms of Service on sign in")
    tos_version: Optional[str] = Field(default="1.0", description="Terms of Service version")


class RefreshTokenRequest(BaseModel):
    refresh_token: Optional[str] = Field(default=None, description="Optional refresh token if not in HttpOnly cookie")


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 900  # 15 minutes in seconds
    user: UserResponse


class AcceptTOSRequest(BaseModel):
    tos_version: str = Field(default="1.0", description="Terms of Service version accepted")
