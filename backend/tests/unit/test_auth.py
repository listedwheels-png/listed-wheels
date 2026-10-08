import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch
import pytest
from fastapi.testclient import TestClient

from app.core.errors import ForbiddenError, UnauthorizedError
from app.core.security import create_access_token, create_refresh_token
from app.db.models.user import User
from app.main import app
from app.services.auth import AuthService

client = TestClient(app)


@pytest.fixture
def sample_user():
    return User(
        id=uuid.uuid4(),
        email="testuser@example.com",
        name="Test User",
        google_sub="google-sub-98765",
        role="buyer",
        status="active",
        tos_version=None,
        tos_accepted_at=None,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


@pytest.fixture
def admin_user():
    return User(
        id=uuid.uuid4(),
        email="admin@listedwheels.com",
        name="Admin User",
        google_sub="google-sub-admin-1",
        role="admin",
        status="active",
        tos_version="1.0",
        tos_accepted_at=datetime.now(timezone.utc),
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


@pytest.mark.asyncio
async def test_auth_service_google_login_new_user(sample_user):
    mock_session = AsyncMock()

    with patch("app.services.auth.google_auth_client.verify_id_token") as mock_verify:
        mock_verify.return_value = {
            "sub": "google-sub-98765",
            "email": "testuser@example.com",
            "name": "Test User",
        }

        with patch("app.services.auth.UserRepository") as MockRepo:
            mock_repo_inst = MockRepo.return_value
            mock_repo_inst.get_by_google_sub = AsyncMock(return_value=None)
            mock_repo_inst.get_by_email = AsyncMock(return_value=None)
            mock_repo_inst.create_user = AsyncMock(return_value=sample_user)

            service = AuthService(mock_session)
            access_token, refresh_token, user = await service.authenticate_google(
                id_token="valid-google-id-token",
                accept_tos=True,
                tos_version="1.0",
            )

            assert access_token is not None
            assert refresh_token is not None
            assert user.email == "testuser@example.com"
            assert user.role == "buyer"


@pytest.mark.asyncio
async def test_auth_service_banned_user_raises_forbidden(sample_user):
    mock_session = AsyncMock()
    sample_user.status = "banned"

    with patch("app.services.auth.google_auth_client.verify_id_token") as mock_verify:
        mock_verify.return_value = {
            "sub": "google-sub-98765",
            "email": "testuser@example.com",
            "name": "Test User",
        }

        with patch("app.services.auth.UserRepository") as MockRepo:
            mock_repo_inst = MockRepo.return_value
            mock_repo_inst.get_by_google_sub = AsyncMock(return_value=sample_user)

            service = AuthService(mock_session)
            with pytest.raises(ForbiddenError) as exc_info:
                await service.authenticate_google(id_token="valid-token")

            assert exc_info.value.code == "USER_BANNED"


@pytest.mark.asyncio
async def test_auth_service_refresh_token_success(sample_user):
    mock_session = AsyncMock()
    refresh_token = create_refresh_token(subject=str(sample_user.id))

    with patch("app.services.auth.UserRepository") as MockRepo:
        mock_repo_inst = MockRepo.return_value
        mock_repo_inst.get_by_id = AsyncMock(return_value=sample_user)

        service = AuthService(mock_session)
        new_access_token, user = await service.refresh_access_token(refresh_token)

        assert new_access_token is not None
        assert user.id == sample_user.id


def test_auth_me_endpoint_unauthorized_without_token():
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
    assert response.json()["code"] == "AUTH_REQUIRED"


def test_admin_route_forbidden_for_regular_buyer(sample_user):
    access_token = create_access_token(subject=str(sample_user.id))

    with patch("app.api.deps.UserRepository") as MockRepo:
        mock_repo_inst = MockRepo.return_value
        mock_repo_inst.get_by_id = AsyncMock(return_value=sample_user)

        headers = {"Authorization": f"Bearer {access_token}"}
        response = client.post(
            "/api/v1/plans",
            headers=headers,
            json={"category": "cars", "base_fee_paise": 199900},
        )
        assert response.status_code == 403
        assert response.json()["code"] == "ADMIN_REQUIRED"
