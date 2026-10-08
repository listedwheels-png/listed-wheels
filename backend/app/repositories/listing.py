import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy import func, select, update, delete, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models.listing import Listing, ListingMedia, PromoVideo
from app.db.models.engagement import ContactEvent
from app.repositories.base import BaseRepository


class ListingRepository(BaseRepository[Listing]):
    """Repository handling database operations for listings, media, promo videos, and contact events."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Listing, session)

    async def get_by_id(self, id: uuid.UUID, load_relations: bool = True) -> Optional[Listing]:
        """Loads listing with media and promo video relations."""
        stmt = select(Listing).where(Listing.id == id)
        if load_relations:
            stmt = stmt.options(
                selectinload(Listing.media),
                selectinload(Listing.promo_video)
            )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_active_by_reg_no_hash(self, reg_no_hash: str) -> Optional[Listing]:
        """Checks for active or pending listing with the given registration number hash."""
        if not reg_no_hash:
            return None
        stmt = select(Listing).where(
            Listing.reg_no_hash == reg_no_hash,
            Listing.status.in_(["live", "pending_verification"])
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def search_listings(
        self,
        category: Optional[str] = None,
        city: Optional[str] = None,
        state_id: Optional[uuid.UUID] = None,
        city_id: Optional[uuid.UUID] = None,
        min_price_paise: Optional[int] = None,
        max_price_paise: Optional[int] = None,
        min_year: Optional[int] = None,
        max_year: Optional[int] = None,
        fuel_type: Optional[str] = None,
        transmission: Optional[str] = None,
        make: Optional[str] = None,
        query: Optional[str] = None,
        status: str = "live",
        sort_by: str = "latest",
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[Listing], int]:
        """
        Executes indexed parameterized search queries with filtering, sorting, and pagination.
        """
        conditions = []

        if status:
            conditions.append(Listing.status == status)

        if category and category.lower() != "all":
            conditions.append(Listing.category == category.lower())

        if city and city.lower() != "all":
            conditions.append(func.lower(Listing.city) == city.lower())

        if state_id:
            conditions.append(Listing.state_id == state_id)

        if city_id:
            conditions.append(Listing.city_id == city_id)

        if min_price_paise is not None:
            conditions.append(Listing.price_paise >= min_price_paise)

        if max_price_paise is not None:
            conditions.append(Listing.price_paise <= max_price_paise)

        if min_year is not None:
            conditions.append(Listing.year >= min_year)

        if max_year is not None:
            conditions.append(Listing.year <= max_year)

        if fuel_type:
            conditions.append(func.lower(Listing.fuel_type) == fuel_type.lower())

        if transmission:
            conditions.append(func.lower(Listing.transmission) == transmission.lower())

        if make:
            conditions.append(func.lower(Listing.make) == make.lower())

        if query:
            search_pattern = f"%{query.lower().strip()}%"
            conditions.append(
                or_(
                    func.lower(Listing.title).like(search_pattern),
                    func.lower(Listing.make).like(search_pattern),
                    func.lower(Listing.model).like(search_pattern),
                )
            )

        # Count Query
        count_stmt = select(func.count(Listing.id))
        if conditions:
            count_stmt = count_stmt.where(and_(*conditions))
        total_result = await self.session.execute(count_stmt)
        total_count = total_result.scalar() or 0

        # Items Query
        items_stmt = select(Listing).options(selectinload(Listing.media))
        if conditions:
            items_stmt = items_stmt.where(and_(*conditions))

        # Sorting
        if sort_by == "price_asc":
            items_stmt = items_stmt.order_by(Listing.price_paise.asc())
        elif sort_by == "price_desc":
            items_stmt = items_stmt.order_by(Listing.price_paise.desc())
        elif sort_by == "mileage_asc":
            items_stmt = items_stmt.order_by(Listing.mileage_km.asc().nullslast())
        elif sort_by == "year_desc":
            items_stmt = items_stmt.order_by(Listing.year.desc())
        else:
            # Default latest
            items_stmt = items_stmt.order_by(Listing.created_at.desc())

        # Pagination
        offset = (page - 1) * page_size
        items_stmt = items_stmt.offset(offset).limit(page_size)

        result = await self.session.execute(items_stmt)
        items = list(result.scalars().all())

        return items, total_count

    async def get_seller_listings(
        self, seller_id: uuid.UUID, status: Optional[str] = None
    ) -> List[Listing]:
        """Fetches all listings belonging to a specific seller."""
        stmt = (
            select(Listing)
            .where(Listing.seller_id == seller_id)
            .options(selectinload(Listing.media))
            .order_by(Listing.created_at.desc())
        )
        if status:
            stmt = stmt.where(Listing.status == status)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def add_media(
        self, listing_id: uuid.UUID, storage_key: str, kind: str = "photo", position: int = 0
    ) -> ListingMedia:
        media = ListingMedia(
            listing_id=listing_id,
            storage_key=storage_key,
            kind=kind,
            position=position,
        )
        self.session.add(media)
        await self.session.flush()
        await self.session.refresh(media)
        return media

    async def delete_media(self, photo_id: uuid.UUID) -> bool:
        stmt = delete(ListingMedia).where(ListingMedia.id == photo_id)
        result = await self.session.execute(stmt)
        return result.rowcount > 0

    async def record_contact_event(self, listing_id: uuid.UUID, buyer_id: uuid.UUID) -> ContactEvent:
        event = ContactEvent(listing_id=listing_id, buyer_id=buyer_id)
        self.session.add(event)
        await self.session.flush()
        return event
