import uuid
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import NotFoundError
from app.db.models.user import SellerProfile, User
from app.repositories.engagement import ReviewRepository
from app.repositories.listing import ListingRepository
from app.repositories.user import UserRepository
from app.schemas.user import (
    PublicSellerProfileResponse,
    SellerProfileCreateOrUpdate,
    SellerProfileResponse,
    UserResponse,
)


class UserService:
    """Service managing user profiles, dealer shop information, and public seller trust metrics."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.user_repo = UserRepository(session)
        self.listing_repo = ListingRepository(session)
        self.review_repo = ReviewRepository(session)

    async def get_public_profile(self, user_id: uuid.UUID) -> PublicSellerProfileResponse:
        """Calculates public seller profile metrics including verification, ratings, and active inventory count."""
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found.", code="USER_NOT_FOUND")

        profile = await self.user_repo.get_seller_profile(user_id)
        seller_type = profile.type if profile else "individual"
        shop_name = profile.shop_name if profile else None
        whatsapp = profile.whatsapp if profile else None
        maps_link = profile.maps_link if profile else None
        is_verified = bool(profile and profile.verified_at is not None)

        # Active listings count
        seller_listings = await self.listing_repo.get_seller_listings(user_id, status="active")
        active_count = len(seller_listings)

        # Review stats
        _, total_reviews, avg_rating = await self.review_repo.get_seller_reviews(user_id)

        return PublicSellerProfileResponse(
            id=user.id,
            name=user.name,
            role=user.role,
            seller_type=seller_type,
            shop_name=shop_name,
            whatsapp=whatsapp,
            maps_link=maps_link,
            is_verified=is_verified,
            average_rating=avg_rating,
            total_reviews=total_reviews,
            active_listings_count=active_count,
            created_at=user.created_at,
        )

    async def update_seller_profile(
        self, user: User, profile_in: SellerProfileCreateOrUpdate
    ) -> SellerProfileResponse:
        """Upserts seller/dealer business profile details."""
        profile = await self.user_repo.upsert_seller_profile(
            user_id=user.id,
            type=profile_in.type,
            shop_name=profile_in.shop_name,
            gst_no=profile_in.gst_no,
            maps_link=profile_in.maps_link,
            whatsapp=profile_in.whatsapp,
            state_id=profile_in.state_id,
            city_id=profile_in.city_id,
        )
        await self.session.commit()
        return SellerProfileResponse.model_validate(profile)
