import uuid
from typing import List, Optional, Tuple
from sqlalchemy import and_, delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from app.db.models.engagement import ContactEvent, Report, Review
from app.db.models.listing import Favorite, Listing
from app.db.models.user import User, SellerProfile
from app.repositories.base import BaseRepository


class ReviewRepository(BaseRepository[Review]):
    """Repository executing queries for seller reviews and buyer eligibility."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Review, session)

    async def has_contact_event(self, buyer_id: uuid.UUID, seller_id: uuid.UUID) -> bool:
        """Checks if a contact event exists between the buyer and any listing of the seller."""
        stmt = (
            select(func.count(ContactEvent.id))
            .select_from(ContactEvent)
            .join(Listing, ContactEvent.listing_id == Listing.id)
            .where(
                and_(
                    ContactEvent.buyer_id == buyer_id,
                    Listing.seller_id == seller_id,
                )
            )
        )
        result = await self.session.execute(stmt)
        count = result.scalar() or 0
        return count > 0

    async def get_by_seller_and_buyer(
        self, seller_id: uuid.UUID, buyer_id: uuid.UUID
    ) -> Optional[Review]:
        stmt = select(Review).where(
            and_(Review.seller_id == seller_id, Review.buyer_id == buyer_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create_review(
        self, seller_id: uuid.UUID, buyer_id: uuid.UUID, rating: int, text: str
    ) -> Review:
        review = Review(
            seller_id=seller_id,
            buyer_id=buyer_id,
            rating=rating,
            text=text.strip(),
            status="visible",
        )
        return await self.create(review)

    async def get_seller_reviews(
        self, seller_id: uuid.UUID, status: str = "visible", limit: int = 50, offset: int = 0
    ) -> Tuple[List[Review], int, float]:
        """Returns reviews, total count, and average rating for a seller."""
        # Total count and avg
        stats_stmt = (
            select(func.count(Review.id), func.avg(Review.rating))
            .where(and_(Review.seller_id == seller_id, Review.status == status))
        )
        stats_result = await self.session.execute(stats_stmt)
        row = stats_result.one()
        total_count = row[0] or 0
        avg_rating = float(row[1]) if row[1] is not None else 0.0

        # Reviews query
        stmt = (
            select(Review)
            .where(and_(Review.seller_id == seller_id, Review.status == status))
            .order_by(Review.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        reviews = list(result.scalars().all())

        return reviews, total_count, round(avg_rating, 2)

    async def get_buyer_reviews(self, buyer_id: uuid.UUID) -> List[Review]:
        stmt = (
            select(Review)
            .where(Review.buyer_id == buyer_id)
            .order_by(Review.created_at.desc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def delete_review(self, review_id: uuid.UUID) -> bool:
        stmt = delete(Review).where(Review.id == review_id)
        result = await self.session.execute(stmt)
        return result.rowcount > 0

    async def update_status(self, review_id: uuid.UUID, status: str) -> Optional[Review]:
        stmt = (
            update(Review)
            .where(Review.id == review_id)
            .values(status=status)
            .returning(Review)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()


class ReportRepository(BaseRepository[Report]):
    """Repository executing queries for user reporting and safety moderation."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Report, session)

    async def create_report(
        self, listing_id: uuid.UUID, reporter_id: uuid.UUID, reason: str
    ) -> Report:
        report = Report(
            listing_id=listing_id,
            reporter_id=reporter_id,
            reason=reason.strip(),
            status="pending",
        )
        return await self.create(report)

    async def count_reports_for_listing(self, listing_id: uuid.UUID) -> int:
        stmt = select(func.count(Report.id)).where(Report.listing_id == listing_id)
        result = await self.session.execute(stmt)
        return result.scalar() or 0

    async def list_reports(
        self, status: Optional[str] = None, limit: int = 50, offset: int = 0
    ) -> Tuple[List[Report], int]:
        count_stmt = select(func.count(Report.id))
        if status:
            count_stmt = count_stmt.where(Report.status == status)
        total_count = (await self.session.execute(count_stmt)).scalar() or 0

        stmt = select(Report).order_by(Report.created_at.desc()).offset(offset).limit(limit)
        if status:
            stmt = stmt.where(Report.status == status)

        result = await self.session.execute(stmt)
        reports = list(result.scalars().all())
        return reports, total_count

    async def update_status(self, report_id: uuid.UUID, status: str) -> Optional[Report]:
        stmt = (
            update(Report)
            .where(Report.id == report_id)
            .values(status=status)
            .returning(Report)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()


class FavoriteRepository(BaseRepository[Favorite]):
    """Repository executing queries for saved/favorited listings."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Favorite, session)

    async def get_favorite(self, user_id: uuid.UUID, listing_id: uuid.UUID) -> Optional[Favorite]:
        stmt = select(Favorite).where(
            and_(Favorite.user_id == user_id, Favorite.listing_id == listing_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def add_favorite(self, user_id: uuid.UUID, listing_id: uuid.UUID) -> Favorite:
        existing = await self.get_favorite(user_id, listing_id)
        if existing:
            return existing
        favorite = Favorite(user_id=user_id, listing_id=listing_id)
        return await self.create(favorite)

    async def remove_favorite(self, user_id: uuid.UUID, listing_id: uuid.UUID) -> bool:
        stmt = delete(Favorite).where(
            and_(Favorite.user_id == user_id, Favorite.listing_id == listing_id)
        )
        result = await self.session.execute(stmt)
        return result.rowcount > 0

    async def get_user_favorite_listings(
        self, user_id: uuid.UUID, limit: int = 50, offset: int = 0
    ) -> Tuple[List[Listing], int]:
        count_stmt = (
            select(func.count(Favorite.id))
            .where(Favorite.user_id == user_id)
        )
        total_count = (await self.session.execute(count_stmt)).scalar() or 0

        stmt = (
            select(Listing)
            .join(Favorite, Favorite.listing_id == Listing.id)
            .where(Favorite.user_id == user_id)
            .options(selectinload(Listing.media))
            .order_by(Favorite.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        listings = list(result.scalars().all())
        return listings, total_count
