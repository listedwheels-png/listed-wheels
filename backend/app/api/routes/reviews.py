import uuid
from typing import Any
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.db.models.user import User
from app.schemas.common import MessageResponse
from app.schemas.engagement import ReviewCreate, ReviewResponse, SellerReviewSummary
from app.services.review import ReviewService

router = APIRouter()


@router.post(
    "",
    response_model=ReviewResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit seller review (requires prior WhatsApp contact)",
)
async def submit_review(
    review_in: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    service = ReviewService(db)
    review = await service.submit_review(current_user, review_in)
    return ReviewResponse(
        id=review.id,
        seller_id=review.seller_id,
        buyer_id=review.buyer_id,
        buyer_name=current_user.name,
        rating=review.rating,
        text=review.text,
        status=review.status,
        created_at=review.created_at,
    )


@router.get(
    "/seller/{seller_id}",
    response_model=SellerReviewSummary,
    summary="Get reviews and rating summary for a seller",
)
async def get_seller_reviews(
    seller_id: uuid.UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> Any:
    service = ReviewService(db)
    return await service.get_seller_reviews(seller_id, page=page, page_size=page_size)


@router.delete(
    "/{review_id}",
    response_model=MessageResponse,
    summary="Delete or remove a review",
)
async def delete_review(
    review_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    service = ReviewService(db)
    await service.delete_review(review_id, current_user)
    return MessageResponse(message="Review deleted successfully.")
