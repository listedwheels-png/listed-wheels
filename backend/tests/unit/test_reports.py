import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock
import pytest

from app.core.errors import NotFoundError
from app.db.models.engagement import Report
from app.db.models.listing import Listing
from app.db.models.user import User
from app.services.report import ReportService


@pytest.fixture
def reporter_user():
    return User(
        id=uuid.uuid4(),
        email="reporter@example.com",
        name="Concerned Buyer",
        role="buyer",
        status="active",
    )


@pytest.fixture
def admin_user():
    return User(
        id=uuid.uuid4(),
        email="admin@listedwheels.com",
        name="Admin Moderator",
        role="admin",
        status="active",
    )


@pytest.mark.asyncio
async def test_report_listing_success_and_autoflag_threshold(reporter_user):
    """3+ reports on an active listing flags it for priority moderation."""
    mock_session = AsyncMock()
    service = ReportService(mock_session)

    listing_id = uuid.uuid4()
    mock_listing = Listing(
        id=listing_id,
        seller_id=uuid.uuid4(),
        category="cars",
        title="Suspicious Swift",
        price_paise=50000000,
        status="active",
    )

    service.listing_repo = AsyncMock()
    service.listing_repo.get_by_id = AsyncMock(return_value=mock_listing)

    service.report_repo = AsyncMock()
    mock_report = Report(
        id=uuid.uuid4(),
        listing_id=listing_id,
        reporter_id=reporter_user.id,
        reason="Suspected odometer rollback",
        status="pending",
        created_at=datetime.now(timezone.utc),
    )
    service.report_repo.create_report = AsyncMock(return_value=mock_report)
    # Simulate this is the 3rd report
    service.report_repo.count_reports_for_listing = AsyncMock(return_value=3)

    result = await service.create_report(listing_id, "Suspected odometer rollback", reporter_user)
    assert result.reason == "Suspected odometer rollback"
    # Auto-flag status triggered
    assert mock_listing.status == "flagged"


@pytest.mark.asyncio
async def test_report_nonexistent_listing_raises_not_found(reporter_user):
    mock_session = AsyncMock()
    service = ReportService(mock_session)

    service.listing_repo = AsyncMock()
    service.listing_repo.get_by_id = AsyncMock(return_value=None)

    with pytest.raises(NotFoundError) as exc_info:
        await service.create_report(uuid.uuid4(), "Fake listing", reporter_user)

    assert exc_info.value.code == "LISTING_NOT_FOUND"
