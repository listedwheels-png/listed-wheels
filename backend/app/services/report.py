import uuid
from typing import List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import BadRequestError, ForbiddenError, NotFoundError
from app.db.models.engagement import Report
from app.db.models.user import User
from app.repositories.engagement import ReportRepository
from app.repositories.listing import ListingRepository
from app.repositories.user import UserRepository
from app.schemas.engagement import ReportResponse


class ReportService:
    """Service handling reporting of fraudulent/suspicious listings, auto-flagging, and admin triage."""

    AUTO_FLAG_THRESHOLD = 3

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.report_repo = ReportRepository(session)
        self.listing_repo = ListingRepository(session)
        self.user_repo = UserRepository(session)

    async def create_report(
        self, listing_id: uuid.UUID, reason: str, reporter: User
    ) -> Report:
        """Submits a report against a listing and triggers auto-flagging if threshold reached."""
        listing = await self.listing_repo.get_by_id(listing_id)
        if not listing:
            raise NotFoundError("Listing not found.", code="LISTING_NOT_FOUND")

        report = await self.report_repo.create_report(
            listing_id=listing_id,
            reporter_id=reporter.id,
            reason=reason,
        )

        # Check report count for auto-flagging
        count = await self.report_repo.count_reports_for_listing(listing_id)
        if count >= self.AUTO_FLAG_THRESHOLD and listing.status == "active":
            # Auto-flag status
            listing.status = "flagged"

        await self.session.commit()
        return report

    async def list_reports(
        self, status: Optional[str] = None, page: int = 1, page_size: int = 50
    ) -> Tuple[List[ReportResponse], int]:
        """Admin endpoint to retrieve flagged/pending reports."""
        offset = (page - 1) * page_size
        reports, total = await self.report_repo.list_reports(status=status, limit=page_size, offset=offset)

        items: List[ReportResponse] = []
        for r in reports:
            reporter = await self.user_repo.get_by_id(r.reporter_id)
            items.append(
                ReportResponse(
                    id=r.id,
                    listing_id=r.listing_id,
                    reporter_id=r.reporter_id,
                    reporter_name=reporter.name if reporter else "Unknown",
                    reporter_email=reporter.email if reporter else "Unknown",
                    reason=r.reason,
                    status=r.status,
                    created_at=r.created_at,
                )
            )

        return items, total

    async def update_report_status(
        self, report_id: uuid.UUID, new_status: str, admin_user: User
    ) -> Report:
        """Updates moderation status for a report."""
        if admin_user.role != "admin":
            raise ForbiddenError("Admin access required.", code="ADMIN_REQUIRED")

        report = await self.report_repo.get_by_id(report_id)
        if not report:
            raise NotFoundError("Report not found.", code="REPORT_NOT_FOUND")

        updated = await self.report_repo.update_status(report_id, new_status)
        await self.session.commit()
        return updated
