import uuid
from typing import List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import NotFoundError
from app.db.models.listing import Listing
from app.db.models.user import User
from app.repositories.engagement import FavoriteRepository
from app.repositories.listing import ListingRepository
from app.schemas.engagement import FavoriteToggleResponse


class FavoriteService:
    """Service managing user favorites/bookmarks."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.favorite_repo = FavoriteRepository(session)
        self.listing_repo = ListingRepository(session)

    async def toggle_favorite(self, listing_id: uuid.UUID, user: User) -> FavoriteToggleResponse:
        """Toggles a listing favorite on or off for the current user."""
        listing = await self.listing_repo.get_by_id(listing_id)
        if not listing:
            raise NotFoundError("Listing not found.", code="LISTING_NOT_FOUND")

        existing = await self.favorite_repo.get_favorite(user.id, listing_id)
        if existing:
            await self.favorite_repo.remove_favorite(user.id, listing_id)
            await self.session.commit()
            return FavoriteToggleResponse(
                listing_id=listing_id,
                is_favorite=False,
                message="Listing removed from favorites.",
            )
        else:
            await self.favorite_repo.add_favorite(user.id, listing_id)
            await self.session.commit()
            return FavoriteToggleResponse(
                listing_id=listing_id,
                is_favorite=True,
                message="Listing added to favorites.",
            )

    async def is_favorite(self, listing_id: uuid.UUID, user: User) -> bool:
        fav = await self.favorite_repo.get_favorite(user.id, listing_id)
        return fav is not None

    async def get_user_favorites(
        self, user: User, page: int = 1, page_size: int = 20
    ) -> Tuple[List[Listing], int]:
        offset = (page - 1) * page_size
        return await self.favorite_repo.get_user_favorite_listings(
            user_id=user.id, limit=page_size, offset=offset
        )
