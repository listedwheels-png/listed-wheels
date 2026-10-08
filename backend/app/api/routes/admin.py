import uuid
from typing import Any
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_admin
from app.db.models.user import User
from app.schemas.admin import (
    AdminActionResponse,
    AdminQueueResponse,
    BanUserRequest,
    RejectDocumentRequest,
    RejectListingRequest,
)
from app.schemas.listing import ListingResponse
from app.schemas.user import UserResponse
from app.services.admin import AdminService

router = APIRouter()


@router.get(
    "/queue",
    response_model=AdminQueueResponse,
    summary="Get verification queue for pending listings and encrypted documents",
)
async def get_verification_queue(
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> Any:
    service = AdminService(db)
    return await service.get_queue()


@router.post(
    "/listings/{listing_id}/approve",
    response_model=ListingResponse,
    summary="Approve listing and set 365-day expiration",
)
async def approve_listing(
    listing_id: uuid.UUID,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> Any:
    service = AdminService(db)
    listing = await service.approve_listing(listing_id, admin_user)
    return ListingResponse.model_validate(listing)


@router.post(
    "/listings/{listing_id}/reject",
    response_model=ListingResponse,
    summary="Reject listing with mandatory reason",
)
async def reject_listing(
    listing_id: uuid.UUID,
    req: RejectListingRequest,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> Any:
    service = AdminService(db)
    listing = await service.reject_listing(listing_id, req.reason, admin_user)
    return ListingResponse.model_validate(listing)


@router.post(
    "/listings/{listing_id}/hide",
    response_model=ListingResponse,
    summary="Hide listing from public search",
)
async def hide_listing(
    listing_id: uuid.UUID,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> Any:
    service = AdminService(db)
    listing = await service.hide_listing(listing_id, admin_user)
    return ListingResponse.model_validate(listing)


@router.post(
    "/listings/{listing_id}/remove",
    response_model=ListingResponse,
    summary="Permanently remove listing",
)
async def remove_listing(
    listing_id: uuid.UUID,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> Any:
    service = AdminService(db)
    listing = await service.remove_listing(listing_id, admin_user)
    return ListingResponse.model_validate(listing)


@router.post(
    "/documents/{doc_id}/approve",
    response_model=AdminActionResponse,
    summary="Approve seller verification document",
)
async def approve_document(
    doc_id: uuid.UUID,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> Any:
    service = AdminService(db)
    doc = await service.approve_document(doc_id, admin_user)
    return AdminActionResponse(
        action="APPROVE_DOCUMENT",
        entity_id=doc.id,
        message=f"{doc.doc_type} document successfully approved.",
    )


@router.post(
    "/documents/{doc_id}/reject",
    response_model=AdminActionResponse,
    summary="Reject seller verification document with reason",
)
async def reject_document(
    doc_id: uuid.UUID,
    req: RejectDocumentRequest,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> Any:
    service = AdminService(db)
    doc = await service.reject_document(doc_id, req.reason, admin_user)
    return AdminActionResponse(
        action="REJECT_DOCUMENT",
        entity_id=doc.id,
        message=f"{doc.doc_type} document rejected: {req.reason}",
    )


@router.post(
    "/users/{user_id}/ban",
    response_model=UserResponse,
    summary="Ban user and record hashes in bans table to block re-registration",
)
async def ban_user(
    user_id: uuid.UUID,
    req: BanUserRequest,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> Any:
    service = AdminService(db)
    user = await service.ban_user(user_id, req.reason, admin_user)
    return UserResponse.model_validate(user)


@router.get(
    "/exports/gst",
    summary="Export monthly GST CSV for GSTR-1 and GSTR-3B filing",
)
async def export_gst_csv(
    month: str = Query(..., description="Month in YYYY-MM format (e.g. 2026-10)"),
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> Any:
    from fastapi.responses import Response
    from app.services.payment import PaymentService

    payment_service = PaymentService(db)
    csv_content = await payment_service.export_gst_csv(month)

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=listedwheels_gst_{month}.csv"},
    )

