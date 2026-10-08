import uuid
from datetime import datetime, timezone
from typing import List, Optional, Tuple
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models.engagement import AuditLog
from app.db.models.listing import Listing
from app.db.models.user import Ban, User, VerificationDocument
from app.repositories.base import BaseRepository


class AdminRepository(BaseRepository[AuditLog]):
    """Repository managing verification queues, audit logs, and bans."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(AuditLog, session)

    async def get_pending_listings(self) -> List[Listing]:
        """Fetches listings waiting for admin verification."""
        stmt = (
            select(Listing)
            .where(Listing.status == "pending_verification")
            .options(selectinload(Listing.media))
            .order_by(Listing.created_at.asc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_pending_documents(self) -> List[Tuple[VerificationDocument, User]]:
        """Fetches verification documents pending review with their corresponding user."""
        stmt = (
            select(VerificationDocument, User)
            .join(User, VerificationDocument.user_id == User.id)
            .where(VerificationDocument.status == "pending")
            .order_by(VerificationDocument.created_at.asc())
        )
        result = await self.session.execute(stmt)
        return list(result.all())

    async def get_document_by_id(self, doc_id: uuid.UUID) -> Optional[VerificationDocument]:
        stmt = select(VerificationDocument).where(VerificationDocument.id == doc_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def log_action(
        self,
        admin_id: uuid.UUID,
        action: str,
        entity: str,
        entity_id: uuid.UUID,
        reason: Optional[str] = None,
    ) -> AuditLog:
        """Writes audit entry to audit_log table in the active transaction."""
        log = AuditLog(
            admin_id=admin_id,
            action=action.upper(),
            entity=entity.lower(),
            entity_id=entity_id,
            reason=reason,
        )
        self.session.add(log)
        await self.session.flush()
        return log

    async def record_ban(
        self,
        reason: str,
        user_id: Optional[uuid.UUID] = None,
        reg_no_hash: Optional[str] = None,
        phone_hash: Optional[str] = None,
        doc_hash: Optional[str] = None,
    ) -> Ban:
        """Writes ban record with hashes to prevent subsequent sign-ups/listings."""
        ban = Ban(
            user_id=user_id,
            reg_no_hash=reg_no_hash,
            phone_hash=phone_hash,
            doc_hash=doc_hash,
            reason=reason,
        )
        self.session.add(ban)
        await self.session.flush()
        return ban
