import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock
import pytest

from app.db.models.listing import Listing
from app.db.models.user import SellerProfile, User
from app.schemas.user import SellerProfileCreateOrUpdate
from app.services.user import UserService


@pytest.fixture
def dealer_user():
    return User(
        id=uuid.uuid4(),
        email="dealer@example.com",
        name="Apex Motors",
        role="dealer",
        status="active",
        created_at=datetime.now(timezone.utc),
    )


@pytest.mark.asyncio
async def test_get_public_profile_with_verification_and_ratings(dealer_user):
    mock_session = AsyncMock()
    service = UserService(mock_session)

    service.user_repo = AsyncMock()
    service.user_repo.get_by_id = AsyncMock(return_value=dealer_user)

    mock_profile = SellerProfile(
        id=uuid.uuid4(),
        user_id=dealer_user.id,
        type="dealer",
        shop_name="Apex Motors Chennai",
        whatsapp="+919876543210",
        maps_link="https://maps.google.com/?q=ApexMotors",
        verified_at=datetime.now(timezone.utc),
    )
    service.user_repo.get_seller_profile = AsyncMock(return_value=mock_profile)

    service.listing_repo = AsyncMock()
    # 3 active cars in stock
    service.listing_repo.get_seller_listings = AsyncMock(return_value=[
        Listing(id=uuid.uuid4()), Listing(id=uuid.uuid4()), Listing(id=uuid.uuid4())
    ])

    service.review_repo = AsyncMock()
    # Reviews: 12 reviews with 4.85 average rating
    service.review_repo.get_seller_reviews = AsyncMock(return_value=([], 12, 4.85))

    profile = await service.get_public_profile(dealer_user.id)
    assert profile.name == "Apex Motors"
    assert profile.shop_name == "Apex Motors Chennai"
    assert profile.seller_type == "dealer"
    assert profile.is_verified is True
    assert profile.active_listings_count == 3
    assert profile.average_rating == 4.85
    assert profile.total_reviews == 12


@pytest.mark.asyncio
async def test_upsert_seller_profile(dealer_user):
    mock_session = AsyncMock()
    service = UserService(mock_session)

    service.user_repo = AsyncMock()
    mock_profile = SellerProfile(
        id=uuid.uuid4(),
        user_id=dealer_user.id,
        type="individual",
        whatsapp="+919876543210",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    service.user_repo.upsert_seller_profile = AsyncMock(return_value=mock_profile)

    profile_in = SellerProfileCreateOrUpdate(
        type="individual",
        whatsapp="+919876543210",
    )
    res = await service.update_seller_profile(dealer_user, profile_in)
    assert res.type == "individual"
    assert res.whatsapp == "+919876543210"
