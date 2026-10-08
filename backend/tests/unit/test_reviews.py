import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch
import pytest

from app.core.errors import BadRequestError, ConflictError, ForbiddenError, NotFoundError
from app.db.models.engagement import Review
from app.db.models.user import User
from app.schemas.engagement import ReviewCreate
from app.services.review import ReviewService


@pytest.fixture
def buyer_user():
    return User(
        id=uuid.uuid4(),
        email="buyer@example.com",
        name="Buyer Bob",
        role="buyer",
        status="active",
    )


@pytest.fixture
def seller_user():
    return User(
        id=uuid.uuid4(),
        email="seller@example.com",
        name="Seller Sam",
        role="seller",
        status="active",
    )


@pytest.mark.asyncio
async def test_review_submission_fails_without_contact_event(buyer_user, seller_user):
    """Rule: Reviews are ONLY permitted after buyer initiates contact with seller via WhatsApp."""
    mock_session = AsyncMock()
    service = ReviewService(mock_session)

    service.user_repo = AsyncMock()
    service.user_repo.get_by_id = AsyncMock(return_value=seller_user)

    service.review_repo = AsyncMock()
    # Simulate NO contact event
    service.review_repo.has_contact_event = AsyncMock(return_value=False)

    review_in = ReviewCreate(
        seller_id=seller_user.id,
        rating=5,
        text="Great vehicle and smooth communication!",
    )

    with pytest.raises(ForbiddenError) as exc_info:
        await service.submit_review(buyer_user, review_in)

    assert exc_info.value.code == "CONTACT_REQUIRED_FOR_REVIEW"


@pytest.mark.asyncio
async def test_review_submission_fails_for_self_review(buyer_user):
    """Rule: Sellers/buyers cannot review themselves."""
    mock_session = AsyncMock()
    service = ReviewService(mock_session)

    review_in = ReviewCreate(
        seller_id=buyer_user.id,  # Same as buyer
        rating=5,
        text="I am the best seller ever!",
    )

    with pytest.raises(BadRequestError) as exc_info:
        await service.submit_review(buyer_user, review_in)

    assert exc_info.value.code == "SELF_REVIEW_NOT_ALLOWED"


@pytest.mark.asyncio
async def test_review_submission_fails_for_duplicate_review(buyer_user, seller_user):
    """Rule: 1 review per buyer per seller."""
    mock_session = AsyncMock()
    service = ReviewService(mock_session)

    service.user_repo = AsyncMock()
    service.user_repo.get_by_id = AsyncMock(return_value=seller_user)

    service.review_repo = AsyncMock()
    service.review_repo.has_contact_event = AsyncMock(return_value=True)
    # Simulate existing review found
    service.review_repo.get_by_seller_and_buyer = AsyncMock(return_value=Review(id=uuid.uuid4()))

    review_in = ReviewCreate(
        seller_id=seller_user.id,
        rating=4,
        text="Good car overall.",
    )

    with pytest.raises(ConflictError) as exc_info:
        await service.submit_review(buyer_user, review_in)

    assert exc_info.value.code == "REVIEW_ALREADY_EXISTS"


@pytest.mark.asyncio
async def test_review_submission_success(buyer_user, seller_user):
    """Verified contact event allows review submission."""
    mock_session = AsyncMock()
    service = ReviewService(mock_session)

    service.user_repo = AsyncMock()
    service.user_repo.get_by_id = AsyncMock(return_value=seller_user)

    service.review_repo = AsyncMock()
    service.review_repo.has_contact_event = AsyncMock(return_value=True)
    service.review_repo.get_by_seller_and_buyer = AsyncMock(return_value=None)
    
    mock_created = Review(
        id=uuid.uuid4(),
        seller_id=seller_user.id,
        buyer_id=buyer_user.id,
        rating=5,
        text="Genuine seller, car condition matched description perfectly.",
        status="visible",
        created_at=datetime.now(timezone.utc),
    )
    service.review_repo.create_review = AsyncMock(return_value=mock_created)

    review_in = ReviewCreate(
        seller_id=seller_user.id,
        rating=5,
        text="Genuine seller, car condition matched description perfectly.",
    )

    result = await service.submit_review(buyer_user, review_in)
    assert result.rating == 5
    assert result.text == review_in.text
    assert result.status == "visible"
