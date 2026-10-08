import io
import re
import uuid
from typing import Any, Dict, Optional
from PIL import Image, ImageOps
from sqlalchemy.ext.asyncio import AsyncSession

from app.clients.s3 import s3_client
from app.core.config import settings
from app.core.errors import BadRequestError, ForbiddenError, NotFoundError
from app.db.models.listing import Listing, ListingMedia, PromoVideo
from app.db.models.user import User, VerificationDocument
from app.repositories.listing import ListingRepository


def strip_exif_and_optimize(image_bytes: bytes, max_width: int = 1600, quality: int = 85) -> bytes:
    """
    Strips all EXIF metadata (GPS location coordinates, camera serial numbers, capture timestamps)
    and compresses the image to optimized web quality.
    """
    try:
        with Image.open(io.BytesIO(image_bytes)) as img:
            img = ImageOps.exif_transpose(img)
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")

            if img.width > max_width:
                height = int(img.height * (max_width / img.width))
                img = img.resize((max_width, height), Image.Resampling.LANCZOS)

            output = io.BytesIO()
            img.save(output, format="JPEG", quality=quality, optimize=True)
            return output.getvalue()
    except Exception as e:
        raise BadRequestError(f"Invalid image format: {str(e)}", code="INVALID_IMAGE")


def validate_video_link(link: str) -> str:
    """
    Validates and normalizes vehicle video walkaround URLs.
    Supports YouTube, Vimeo, Google Drive, and Instagram video links.
    """
    clean_url = link.strip()
    valid_domains = [
        "youtube.com", "youtu.be", "vimeo.com", "drive.google.com",
        "instagram.com", "cloudfront.net", "listedwheels.com"
    ]
    if not any(domain in clean_url.lower() for domain in valid_domains):
        raise BadRequestError(
            "Video link must be a valid YouTube, Vimeo, Google Drive, or Instagram video URL.",
            code="INVALID_VIDEO_PROVIDER",
        )
    return clean_url


class MediaService:
    """Service managing vehicle photos, seller documents, and video walkarounds."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.listing_repo = ListingRepository(session)

    async def generate_photo_presign(
        self, listing_id: uuid.UUID, file_name: str, content_type: str, current_user: User
    ) -> Dict[str, Any]:
        """Generates pre-signed S3 upload URL for public vehicle photo."""
        listing = await self.listing_repo.get_by_id(listing_id)
        if not listing:
            raise NotFoundError("Listing not found", code="LISTING_NOT_FOUND")

        if listing.seller_id != current_user.id and current_user.role != "admin":
            raise ForbiddenError("Only the listing owner can upload photos", code="FORBIDDEN")

        ext = file_name.split(".")[-1].lower() if "." in file_name else "jpg"
        photo_id = uuid.uuid4()
        storage_key = f"listings/{listing_id}/{photo_id}.{ext}"

        presign_data = s3_client.generate_presigned_photo_upload_url(
            storage_key=storage_key,
            content_type=content_type,
            expires_in=300,
        )

        return {
            "upload_url": presign_data["url"],
            "storage_key": storage_key,
            "fields": presign_data.get("fields", {}),
        }

    async def generate_document_presign(
        self, doc_type: str, file_name: str, content_type: str, current_user: User
    ) -> Dict[str, Any]:
        """
        Generates pre-signed upload URL for seller verification documents into the Private Encrypted S3 Bucket.
        """
        allowed_types = {"RC", "AADHAAR", "PAN", "DEALER_PROOF"}
        clean_type = doc_type.upper().strip()
        if clean_type not in allowed_types:
            raise BadRequestError(
                f"Invalid document type. Must be one of: {', '.join(sorted(allowed_types))}",
                code="INVALID_DOC_TYPE",
            )

        ext = file_name.split(".")[-1].lower() if "." in file_name else "pdf"
        doc_id = uuid.uuid4()
        storage_key = f"documents/{current_user.id}/{clean_type}_{doc_id}.{ext}"

        presign_data = s3_client.generate_presigned_document_upload_url(
            storage_key=storage_key,
            content_type=content_type,
            expires_in=300,
        )

        return {
            "upload_url": presign_data["url"],
            "storage_key": storage_key,
            "fields": presign_data.get("fields", {}),
        }

    async def register_uploaded_photo(
        self, listing_id: uuid.UUID, storage_key: str, position: int, current_user: User
    ) -> ListingMedia:
        """Registers uploaded vehicle photo in database."""
        listing = await self.listing_repo.get_by_id(listing_id)
        if not listing:
            raise NotFoundError("Listing not found", code="LISTING_NOT_FOUND")

        if listing.seller_id != current_user.id and current_user.role != "admin":
            raise ForbiddenError("Only the listing owner can register photos", code="FORBIDDEN")

        media = await self.listing_repo.add_media(
            listing_id=listing_id,
            storage_key=storage_key,
            kind="photo",
            position=position,
        )
        await self.session.commit()
        return media

    async def delete_photo(
        self, listing_id: uuid.UUID, photo_id: uuid.UUID, current_user: User
    ) -> bool:
        """Deletes a photo from the listing."""
        listing = await self.listing_repo.get_by_id(listing_id)
        if not listing:
            raise NotFoundError("Listing not found", code="LISTING_NOT_FOUND")

        if listing.seller_id != current_user.id and current_user.role != "admin":
            raise ForbiddenError("Only the listing owner can delete photos", code="FORBIDDEN")

        success = await self.listing_repo.delete_media(photo_id)
        if not success:
            raise NotFoundError("Photo record not found", code="PHOTO_NOT_FOUND")

        await self.session.commit()
        return True

    async def add_video_walkaround(
        self, listing_id: uuid.UUID, link: str, current_user: User
    ) -> PromoVideo:
        """Validates and attaches video walkaround link to listing."""
        listing = await self.listing_repo.get_by_id(listing_id)
        if not listing:
            raise NotFoundError("Listing not found", code="LISTING_NOT_FOUND")

        if listing.seller_id != current_user.id and current_user.role != "admin":
            raise ForbiddenError("Only the listing owner can attach video walkarounds", code="FORBIDDEN")

        clean_link = validate_video_link(link)

        video = PromoVideo(
            listing_id=listing_id,
            link=clean_link,
            method="link",
            status="submitted",
        )
        self.session.add(video)
        await self.session.commit()
        return video
