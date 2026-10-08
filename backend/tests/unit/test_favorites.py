import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock
import pytest

from app.db.models.listing import Favorite, Listing
from app.db.models.user import User
from app.services.favorite import FavoriteService


@pytest.fixture
def user():
    return User(
        id=uuid.uuid4(),
        email="buyer@example.com",
        name="Buyer",
        role="buyer",
        status="active",
    )


@pytest.mark.asyncio
async def test_toggle_favorite_add_and_remove(user):
    mock_session = AsyncMock()
    service = FavoriteService(mock_session)

    listing_id = uuid.uuid4()
    mock_listing = Listing(id=listing_id, title="Honda City")
    service.listing_repo = AsyncMock()
    service.listing_repo.get_by_id = AsyncMock(return_value=mock_listing)

    service.favorite_repo = AsyncMock()
    
    # 1. First toggle: Not yet favorite -> Added
    service.favorite_repo.get_favorite = AsyncMock(return_value=None)
    mock_fav = Favorite(id=uuid.uuid4(), user_id=user.id, listing_id=listing_id)
    service.favorite_repo.add_favorite = AsyncMock(return_value=mock_fav)

    resp1 = await service.toggle_favorite(listing_id, user)
    assert resp1.is_favorite is True
    assert "added" in resp1.message.lower()

    # 2. Second toggle: Already favorite -> Removed
    service.favorite_repo.get_favorite = AsyncMock(return_value=mock_fav)
    service.favorite_repo.remove_favorite = AsyncMock(return_value=True)

    resp2 = await service.toggle_favorite(listing_id, user)
    assert resp2.is_favorite is False
    assert "removed" in resp2.message.lower()
