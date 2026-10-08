import uuid
from typing import Any
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.db.models.user import User
from app.schemas.common import MessageResponse
from app.schemas.listing import MediaResponse, PromoVideoResponse
from app.schemas.media import (
    PhotoPresignRequest,
    PhotoPresignResponse,
    PhotoRegisterRequest,
    VideoLinkRequest,
)
from app.services.media import MediaService

router = APIRouter()


@router.post(
    "/listings/{listing_id}/photos/presign",
    response_model=PhotoPresignResponse,
    summary="Get pre-signed S3 URL for direct client-to-bucket photo upload",
)
async def presign_photo_upload(
    listing_id: uuid.UUID,
    req: PhotoPresignRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    media_service = MediaService(db)
    result = await media_service.generate_photo_presign(
        listing_id=listing_id,
        file_name=req.file_name,
        content_type=req.content_type,
        current_user=current_user,
    )
    return PhotoPresignResponse(**result)


@router.post(
    "/listings/{listing_id}/photos",
    response_model=MediaResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register uploaded photo in database",
)
async def register_photo(
    listing_id: uuid.UUID,
    req: PhotoRegisterRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    media_service = MediaService(db)
    media = await media_service.register_uploaded_photo(
        listing_id=listing_id,
        storage_key=req.storage_key,
        position=req.position,
        current_user=current_user,
    )
    return MediaResponse.model_validate(media)


@router.delete(
    "/listings/{listing_id}/photos/{photo_id}",
    response_model=MessageResponse,
    summary="Delete photo from listing",
)
async def delete_photo(
    listing_id: uuid.UUID,
    photo_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    media_service = MediaService(db)
    await media_service.delete_photo(
        listing_id=listing_id,
        photo_id=photo_id,
        current_user=current_user,
    )
    return MessageResponse(message="Photo deleted successfully.")


@router.post(
    "/listings/{listing_id}/video-link",
    response_model=PromoVideoResponse,
    summary="Submit YouTube / Google Drive / Instagram video link for listing",
)
async def add_video_link(
    listing_id: uuid.UUID,
    req: VideoLinkRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    media_service = MediaService(db)
    video = await media_service.add_video_link(
        listing_id=listing_id,
        link=req.link,
        current_user=current_user,
    )
    return PromoVideoResponse.model_validate(video)
