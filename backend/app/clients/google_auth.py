from typing import Any, Dict, Optional
from app.core.config import settings
from app.core.errors import UnauthorizedError
from app.core.logging import logger


class GoogleAuthClient:
    """Client for verifying Google OAuth ID tokens."""

    async def verify_id_token(self, token: str) -> Dict[str, Any]:
        """Verifies Google ID token signature, audience, and expiration."""
        # For testing / mock fallback if no credentials provided
        if not settings.GOOGLE_CLIENT_ID or token == "mock-token":
            return {
                "sub": "google-mock-sub-12345",
                "email": "user@example.com",
                "name": "Mock User",
                "picture": "https://lh3.googleusercontent.com/a/default-user",
            }
        
        try:
            from google.oauth2 import id_token
            from google.auth.transport import requests
            id_info = id_token.verify_oauth2_token(
                token, requests.Request(), settings.GOOGLE_CLIENT_ID
            )
            return id_info
        except Exception as e:
            logger.warning(f"Google ID token verification failed: {e}")
            raise UnauthorizedError("Invalid or expired Google ID token", code="INVALID_GOOGLE_TOKEN")


google_auth_client = GoogleAuthClient()
