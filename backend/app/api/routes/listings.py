import uuid
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.db.models.user import User
from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.listing import (
    ListingContactResponse,
    ListingCreate,
    ListingResponse,
    ListingUpdate,
)
from app.services.listing import ListingService

router = APIRouter()


@router.get(
    "",
    response_model=PaginatedResponse[ListingResponse],
    summary="Search live listings with filters, sorting, and pagination",
)
async def search_listings(
    category: Optional[str] = Query(None, description="Vehicle category: cars, bikes, cycles, other, all"),
    city: Optional[str] = Query(None, description="City filter: e.g. Chennai, Bangalore, Mumbai"),
    min_price: Optional[int] = Query(None, description="Minimum price in integer paise", ge=0),
    max_price: Optional[int] = Query(None, description="Maximum price in integer paise", ge=0),
    min_year: Optional[int] = Query(None, description="Minimum manufacturing year", ge=1980),
    max_year: Optional[int] = Query(None, description="Maximum manufacturing year", le=2030),
    fuel_type: Optional[str] = Query(None, description="petrol, diesel, electric, cng, hybrid, lpg"),
    transmission: Optional[str] = Query(None, description="manual, automatic"),
    make: Optional[str] = Query(None, description="Vehicle make/brand"),
    q: Optional[str] = Query(None, description="Search query string for title/make/model"),
    sort_by: str = Query("latest", description="latest, price_asc, price_desc, mileage_asc, year_desc"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db),
) -> Any:
    service = ListingService(db)
    items, total, pages = await service.search(
        category=category,
        city=city,
        min_price_paise=min_price,
        max_price_paise=max_price,
        min_year=min_year,
        max_year=max_year,
        fuel_type=fuel_type,
        transmission=transmission,
        make=make,
        query=q,
        sort_by=sort_by,
        page=page,
        page_size=page_size,
    )
    return PaginatedResponse(
        items=[ListingResponse.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


@router.get(
    "/{listing_id}",
    response_model=ListingResponse,
    summary="Get listing details by ID",
)
async def get_listing(
    listing_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> Any:
    service = ListingService(db)
    listing = await service.get_listing(listing_id)
    return ListingResponse.model_validate(listing)


@router.get(
    "/{listing_id}/contact",
    response_model=ListingContactResponse,
    summary="Get seller WhatsApp contact link and record contact event",
)
async def get_listing_contact(
    listing_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    service = ListingService(db)
    return await service.get_contact_and_record_event(listing_id, current_user)


@router.post(
    "",
    response_model=ListingResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new vehicle listing draft",
)
async def create_listing(
    listing_in: ListingCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    service = ListingService(db)
    created = await service.create_listing(listing_in, current_user)
    return ListingResponse.model_validate(created)


@router.patch(
    "/{listing_id}",
    response_model=ListingResponse,
    summary="Update editable non-locked fields on a listing",
)
async def update_listing(
    listing_id: uuid.UUID,
    update_in: ListingUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    service = ListingService(db)
    updated = await service.update_listing(listing_id, update_in, current_user)
    return ListingResponse.model_validate(updated)


@router.post(
    "/{listing_id}/sold",
    response_model=ListingResponse,
    summary="Mark vehicle listing as sold",
)
async def mark_listing_sold(
    listing_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    service = ListingService(db)
    updated = await service.mark_as_sold(listing_id, current_user)
    return ListingResponse.model_validate(updated)


@router.delete(
    "/{listing_id}",
    response_model=MessageResponse,
    summary="Delete a draft listing",
)
async def delete_listing(
    listing_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    service = ListingService(db)
    await service.delete_draft(listing_id, current_user)
    return MessageResponse(message="Listing draft deleted successfully.")
