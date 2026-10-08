import uuid
from typing import Any
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.db.models.user import User
from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.engagement import FavoriteToggleResponse
from app.schemas.listing import ListingResponse
from app.services.favorite import FavoriteService

router = APIRouter()


@router.get(
    "",
    response_model=PaginatedResponse[ListingResponse],
    summary="Get listings favorited by current user",
)
async def get_my_favorites(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    service = FavoriteService(db)
    items, total = await service.get_user_favorites(current_user, page=page, page_size=page_size)
    pages = (total + page_size - 1) // page_size if total > 0 else 0
    return PaginatedResponse(
        items=[ListingResponse.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


@router.post(
    "/{listing_id}",
    response_model=FavoriteToggleResponse,
    summary="Toggle favorite on/off for a listing",
)
async def toggle_favorite(
    listing_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    service = FavoriteService(db)
    return await service.toggle_favorite(listing_id, current_user)


@router.get(
    "/{listing_id}/status",
    summary="Check if a listing is in current user's favorites",
)
async def check_favorite_status(
    listing_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    service = FavoriteService(db)
    is_fav = await service.is_favorite(listing_id, current_user)
    return {"listing_id": listing_id, "is_favorite": is_fav}
