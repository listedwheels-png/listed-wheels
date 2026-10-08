import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.clients.s3 import s3_client
from app.core.errors import BadRequestError, NotFoundError
from app.db.models.listing import Listing
from app.db.models.user import User, VerificationDocument
from app.repositories.admin import AdminRepository
from app.repositories.listing import ListingRepository
from app.repositories.user import UserRepository
from app.schemas.admin import (
    AdminQueueResponse,
    QueueDocumentItem,
)
from app.schemas.listing import ListingResponse


class AdminService:
    """Service implementing administrative moderation queues, approvals, rejections, audit logging, and bans."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.admin_repo = AdminRepository(session)
        self.listing_repo = ListingRepository(session)
        self.user_repo = UserRepository(session)

    async def get_queue(self) -> AdminQueueResponse:
        """Loads pending listings and encrypted documents with short-lived signed URLs for admin inspection."""
        pending_listings = await self.admin_repo.get_pending_listings()
        pending_docs_with_users = await self.admin_repo.get_pending_documents()

        doc_items = []
        for doc, user in pending_docs_with_users:
            secure_url = s3_client.generate_admin_document_download_url(doc.storage_key, expires_in=900)
            doc_items.append(
                QueueDocumentItem(
                    id=doc.id,
                    user_id=user.id,
                    user_email=user.email,
                    user_name=user.name,
                    doc_type=doc.doc_type,
                    storage_key=doc.storage_key,
                    secure_download_url=secure_url,
                    status=doc.status,
                    created_at=doc.created_at,
                )
            )

        listing_items = [ListingResponse.model_validate(l) for l in pending_listings]

        return AdminQueueResponse(
            pending_listings=listing_items,
            pending_documents=doc_items,
            total_pending_listings=len(listing_items),
            total_pending_documents=len(doc_items),
        )

    async def approve_listing(self, listing_id: uuid.UUID, admin_user: User) -> Listing:
        """Approves listing, sets 365-day expiry timestamp, and writes to audit_log."""
        listing = await self.listing_repo.get_by_id(listing_id)
        if not listing:
            raise NotFoundError("Listing not found", code="LISTING_NOT_FOUND")

        now = datetime.now(timezone.utc)
        listing.status = "live"
        listing.expires_at = now + timedelta(days=365)

        await self.admin_repo.log_action(
            admin_id=admin_user.id,
            action="APPROVE_LISTING",
            entity="listing",
            entity_id=listing.id,
            reason="Listing verified and approved by admin",
        )

        await self.session.commit()
        await self.session.refresh(listing)
        return listing

    async def reject_listing(
        self, listing_id: uuid.UUID, reason: str, admin_user: User
    ) -> Listing:
        """Rejects listing with mandatory reason and writes to audit_log."""
        if not reason or len(reason.strip()) < 5:
            raise BadRequestError("A descriptive rejection reason (min 5 characters) is mandatory.", code="REASON_REQUIRED")

        listing = await self.listing_repo.get_by_id(listing_id)
        if not listing:
            raise NotFoundError("Listing not found", code="LISTING_NOT_FOUND")

        listing.status = "rejected"

        await self.admin_repo.log_action(
            admin_id=admin_user.id,
            action="REJECT_LISTING",
            entity="listing",
            entity_id=listing.id,
            reason=reason.strip(),
        )

        await self.session.commit()
        await self.session.refresh(listing)
        return listing

    async def hide_listing(self, listing_id: uuid.UUID, admin_user: User) -> Listing:
        """Hides listing from public marketplace."""
        listing = await self.listing_repo.get_by_id(listing_id)
        if not listing:
            raise NotFoundError("Listing not found", code="LISTING_NOT_FOUND")

        listing.status = "hidden"
        await self.admin_repo.log_action(
            admin_id=admin_user.id,
            action="HIDE_LISTING",
            entity="listing",
            entity_id=listing.id,
            reason="Listing hidden by moderation",
        )
        await self.session.commit()
        await self.session.refresh(listing)
        return listing

    async def remove_listing(self, listing_id: uuid.UUID, admin_user: User) -> Listing:
        """Permanently removes listing from marketplace."""
        listing = await self.listing_repo.get_by_id(listing_id)
        if not listing:
            raise NotFoundError("Listing not found", code="LISTING_NOT_FOUND")

        listing.status = "removed"
        await self.admin_repo.log_action(
            admin_id=admin_user.id,
            action="REMOVE_LISTING",
            entity="listing",
            entity_id=listing.id,
            reason="Listing removed by admin",
        )
        await self.session.commit()
        await self.session.refresh(listing)
        return listing

    async def approve_document(self, doc_id: uuid.UUID, admin_user: User) -> VerificationDocument:
        """Approves verification document (RC/Aadhaar/PAN)."""
        doc = await self.admin_repo.get_document_by_id(doc_id)
        if not doc:
            raise NotFoundError("Document not found", code="DOCUMENT_NOT_FOUND")

        doc.status = "approved"
        doc.reviewed_by = admin_user.id
        doc.reviewed_at = datetime.now(timezone.utc)

        await self.admin_repo.log_action(
            admin_id=admin_user.id,
            action="APPROVE_DOCUMENT",
            entity="verification_document",
            entity_id=doc.id,
            reason=f"Approved {doc.doc_type} document",
        )

        await self.session.commit()
        await self.session.refresh(doc)
        return doc

    async def reject_document(
        self, doc_id: uuid.UUID, reason: str, admin_user: User
    ) -> VerificationDocument:
        """Rejects verification document with reason."""
        if not reason or len(reason.strip()) < 5:
            raise BadRequestError("Rejection reason is required.", code="REASON_REQUIRED")

        doc = await self.admin_repo.get_document_by_id(doc_id)
        if not doc:
            raise NotFoundError("Document not found", code="DOCUMENT_NOT_FOUND")

        doc.status = "rejected"
        doc.reviewed_by = admin_user.id
        doc.reviewed_at = datetime.now(timezone.utc)
        doc.rejection_reason = reason.strip()

        await self.admin_repo.log_action(
            admin_id=admin_user.id,
            action="REJECT_DOCUMENT",
            entity="verification_document",
            entity_id=doc.id,
            reason=reason.strip(),
        )

        await self.session.commit()
        await self.session.refresh(doc)
        return doc

    async def ban_user(self, user_id: uuid.UUID, reason: str, admin_user: User) -> User:
        """Bans user, records hashes in bans table to block re-registration, and writes audit log."""
        if not reason or len(reason.strip()) < 5:
            raise BadRequestError("Ban reason is required.", code="REASON_REQUIRED")

        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found", code="USER_NOT_FOUND")

        user.status = "banned"

        # Record ban hashes for vehicle registrations and phone if available
        seller_listings = await self.listing_repo.get_seller_listings(user.id)
        for l in seller_listings:
            if l.reg_no_hash:
                await self.admin_repo.record_ban(
                    user_id=user.id,
                    reg_no_hash=l.reg_no_hash,
                    reason=f"Banned with user: {reason}",
                )

        await self.admin_repo.log_action(
            admin_id=admin_user.id,
            action="BAN_USER",
            entity="user",
            entity_id=user.id,
            reason=reason.strip(),
        )

        await self.session.commit()
        await self.session.refresh(user)
        return user
