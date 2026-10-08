import uuid
from typing import Any
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.db.models.user import User
from app.schemas.user import (
    PublicSellerProfileResponse,
    SellerProfileCreateOrUpdate,
    SellerProfileResponse,
    UserResponse,
)
from app.services.user import UserService

router = APIRouter()


@router.get(
    "/profile/{user_id}",
    response_model=PublicSellerProfileResponse,
    summary="Get public seller / dealer profile with ratings and inventory count",
)
async def get_public_profile(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> Any:
    service = UserService(db)
    return await service.get_public_profile(user_id)


@router.get(
    "/me/seller-profile",
    response_model=SellerProfileResponse,
    summary="Get current user seller profile",
)
async def get_my_seller_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    service = UserService(db)
    profile = await service.user_repo.get_seller_profile(current_user.id)
    if not profile:
        # Create default individual profile if none exists
        profile = await service.user_repo.upsert_seller_profile(
            user_id=current_user.id, type="individual"
        )
        await db.commit()
    return SellerProfileResponse.model_validate(profile)


@router.put(
    "/me/seller-profile",
    response_model=SellerProfileResponse,
    summary="Upsert current user seller/dealer profile",
)
async def update_seller_profile(
    profile_in: SellerProfileCreateOrUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    service = UserService(db)
    return await service.update_seller_profile(current_user, profile_in)
