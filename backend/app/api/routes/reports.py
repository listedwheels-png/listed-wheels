import uuid
from typing import Any, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, require_admin
from app.db.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.engagement import ReportCreate, ReportResponse, ReportUpdate
from app.services.report import ReportService

router = APIRouter()


@router.post(
    "",
    response_model=ReportResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Report a fraudulent or suspicious listing",
)
async def report_listing(
    report_in: ReportCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    service = ReportService(db)
    report = await service.create_report(
        listing_id=report_in.listing_id,
        reason=report_in.reason,
        reporter=current_user,
    )
    return ReportResponse(
        id=report.id,
        listing_id=report.listing_id,
        reporter_id=report.reporter_id,
        reporter_name=current_user.name,
        reporter_email=current_user.email,
        reason=report.reason,
        status=report.status,
        created_at=report.created_at,
    )


@router.get(
    "",
    response_model=PaginatedResponse[ReportResponse],
    summary="List reported listings (Admin only)",
)
async def list_reports(
    status: Optional[str] = Query(None, description="pending, reviewed, dismissed, actioned"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> Any:
    service = ReportService(db)
    items, total = await service.list_reports(status=status, page=page, page_size=page_size)
    pages = (total + page_size - 1) // page_size if total > 0 else 0
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


@router.patch(
    "/{report_id}",
    response_model=ReportResponse,
    summary="Update report moderation status (Admin only)",
)
async def update_report_status(
    report_id: uuid.UUID,
    update_in: ReportUpdate,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> Any:
    service = ReportService(db)
    report = await service.update_report_status(report_id, update_in.status, admin_user)
    return ReportResponse.model_validate(report)
