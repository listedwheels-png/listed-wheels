import uuid
from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock, patch
import pytest

from app.core.errors import BadRequestError, NotFoundError
from app.db.models.listing import Listing
from app.db.models.user import User, VerificationDocument
from app.services.admin import AdminService


@pytest.fixture
def admin_user():
    return User(
        id=uuid.uuid4(),
        email="admin@listedwheels.com",
        name="Admin Moderator",
        role="admin",
        status="active",
        tos_version="1.0",
        tos_accepted_at=datetime.now(timezone.utc),
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


@pytest.fixture
def pending_listing():
    return Listing(
        id=uuid.uuid4(),
        seller_id=uuid.uuid4(),
        category="cars",
        title="2021 Maruti Swift",
        make="Maruti",
        model="Swift",
        year=2021,
        price_paise=55000000,
        city="Chennai",
        status="pending_verification",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


@pytest.mark.asyncio
async def test_admin_approve_listing_sets_365_days_and_logs(admin_user, pending_listing):
    mock_session = AsyncMock()

    with patch("app.services.admin.ListingRepository") as MockListingRepo, \
         patch("app.services.admin.AdminRepository") as MockAdminRepo:
        
        mock_listing_repo = MockListingRepo.return_value
        mock_listing_repo.get_by_id = AsyncMock(return_value=pending_listing)

        mock_admin_repo = MockAdminRepo.return_value
        mock_admin_repo.log_action = AsyncMock()

        service = AdminService(mock_session)
        service.listing_repo = mock_listing_repo
        service.admin_repo = mock_admin_repo

        approved = await service.approve_listing(pending_listing.id, admin_user)

        assert approved.status == "live"
        assert approved.expires_at is not None
        # Verify 365 days expiry
        diff_days = (approved.expires_at - datetime.now(timezone.utc)).days
        assert diff_days in (364, 365)

        # Verify audit log was recorded
        mock_admin_repo.log_action.assert_called_once()
        assert mock_admin_repo.log_action.call_args[1]["action"] == "APPROVE_LISTING"


@pytest.mark.asyncio
async def test_admin_reject_listing_requires_reason(admin_user, pending_listing):
    mock_session = AsyncMock()

    with patch("app.services.admin.ListingRepository") as MockListingRepo:
        mock_listing_repo = MockListingRepo.return_value
        mock_listing_repo.get_by_id = AsyncMock(return_value=pending_listing)

        service = AdminService(mock_session)
        service.listing_repo = mock_listing_repo

        # Empty reason rejected
        with pytest.raises(BadRequestError) as exc_info:
            await service.reject_listing(pending_listing.id, "", admin_user)

        assert exc_info.value.code == "REASON_REQUIRED"


@pytest.mark.asyncio
async def test_admin_ban_user_records_hashes(admin_user):
    mock_session = AsyncMock()
    user_to_ban = User(
        id=uuid.uuid4(),
        email="fraud@example.com",
        name="Fraudulent Seller",
        role="seller",
        status="active",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )

    sample_listing = Listing(
        id=uuid.uuid4(),
        seller_id=user_to_ban.id,
        category="cars",
        title="Fake Car",
        make="Honda",
        model="City",
        year=2022,
        price_paise=10000000,
        city="Chennai",
        reg_no_hash="mock_reg_hash_123",
        status="live",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )

    with patch("app.services.admin.UserRepository") as MockUserRepo, \
         patch("app.services.admin.ListingRepository") as MockListingRepo, \
         patch("app.services.admin.AdminRepository") as MockAdminRepo:

        mock_user_repo = MockUserRepo.return_value
        mock_user_repo.get_by_id = AsyncMock(return_value=user_to_ban)

        mock_listing_repo = MockListingRepo.return_value
        mock_listing_repo.get_seller_listings = AsyncMock(return_value=[sample_listing])

        mock_admin_repo = MockAdminRepo.return_value
        mock_admin_repo.record_ban = AsyncMock()
        mock_admin_repo.log_action = AsyncMock()

        service = AdminService(mock_session)
        service.user_repo = mock_user_repo
        service.listing_repo = mock_listing_repo
        service.admin_repo = mock_admin_repo

        banned_user = await service.ban_user(user_to_ban.id, "Fake vehicle documents detected", admin_user)
        assert banned_user.status == "banned"

        mock_admin_repo.record_ban.assert_called_once()
        assert mock_admin_repo.record_ban.call_args[1]["reg_no_hash"] == "mock_reg_hash_123"
        mock_admin_repo.log_action.assert_called_once()
