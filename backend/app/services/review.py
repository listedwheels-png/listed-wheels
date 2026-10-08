import uuid
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import BadRequestError, ConflictError, ForbiddenError, NotFoundError
from app.db.models.engagement import Review
from app.db.models.user import User
from app.repositories.engagement import ReviewRepository
from app.repositories.user import UserRepository
from app.schemas.engagement import ReviewCreate, ReviewResponse, SellerReviewSummary


class ReviewService:
    """Service enforcing business rules around reviews, WhatsApp contact verification, and 1-review-per-buyer constraints."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.review_repo = ReviewRepository(session)
        self.user_repo = UserRepository(session)

    async def submit_review(self, buyer_user: User, review_in: ReviewCreate) -> Review:
        """
        Creates a seller review after validating:
        1. Buyer is not reviewing themselves.
        2. Seller exists.
        3. Buyer has initiated at least one WhatsApp contact event with seller.
        4. Buyer has not already reviewed this seller (1 review per buyer per seller).
        """
        if review_in.seller_id == buyer_user.id:
            raise BadRequestError("You cannot review yourself.", code="SELF_REVIEW_NOT_ALLOWED")

        seller = await self.user_repo.get_by_id(review_in.seller_id)
        if not seller:
            raise NotFoundError("Seller not found.", code="SELLER_NOT_FOUND")

        # Contact event verification rule
        has_contact = await self.review_repo.has_contact_event(buyer_user.id, review_in.seller_id)
        if not has_contact:
            raise ForbiddenError(
                "Reviews are only permitted after initiating contact with the seller via WhatsApp.",
                code="CONTACT_REQUIRED_FOR_REVIEW",
            )

        # Unique review rule
        existing = await self.review_repo.get_by_seller_and_buyer(review_in.seller_id, buyer_user.id)
        if existing:
            raise ConflictError(
                "You have already submitted a review for this seller.",
                code="REVIEW_ALREADY_EXISTS",
            )

        review = await self.review_repo.create_review(
            seller_id=review_in.seller_id,
            buyer_id=buyer_user.id,
            rating=review_in.rating,
            text=review_in.text,
        )
        await self.session.commit()
        return review

    async def get_seller_reviews(
        self, seller_id: uuid.UUID, page: int = 1, page_size: int = 20
    ) -> SellerReviewSummary:
        """Returns reviews and aggregate rating score for a seller."""
        offset = (page - 1) * page_size
        reviews, total_count, avg_rating = await self.review_repo.get_seller_reviews(
            seller_id=seller_id, status="visible", limit=page_size, offset=offset
        )

        review_responses: List[ReviewResponse] = []
        for r in reviews:
            buyer = await self.user_repo.get_by_id(r.buyer_id)
            review_responses.append(
                ReviewResponse(
                    id=r.id,
                    seller_id=r.seller_id,
                    buyer_id=r.buyer_id,
                    buyer_name=buyer.name if buyer else "Buyer",
                    rating=r.rating,
                    text=r.text,
                    status=r.status,
                    created_at=r.created_at,
                )
            )

        return SellerReviewSummary(
            seller_id=seller_id,
            average_rating=avg_rating,
            total_reviews=total_count,
            reviews=review_responses,
        )

    async def delete_review(self, review_id: uuid.UUID, current_user: User) -> bool:
        """Deletes a review if the caller is the author or an admin."""
        review = await self.review_repo.get_by_id(review_id)
        if not review:
            raise NotFoundError("Review not found.", code="REVIEW_NOT_FOUND")

        if review.buyer_id != current_user.id and current_user.role != "admin":
            raise ForbiddenError(
                "You do not have permission to delete this review.",
                code="FORBIDDEN_REVIEW_DELETE",
            )

        deleted = await self.review_repo.delete_review(review_id)
        await self.session.commit()
        return deleted
