import hashlib
import uuid
from typing import Optional
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.promo import PromoCode, PromoRedemption
from app.repositories.base import BaseRepository


def hash_promo_code(code: str) -> str:
    """Computes SHA-256 hash of uppercase normalized promo code."""
    clean = code.upper().strip()
    return hashlib.sha256(clean.encode("utf-8")).hexdigest()


class PromoRepository(BaseRepository[PromoCode]):
    """Repository handling SQL operations on promo_codes and promo_redemptions tables."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(PromoCode, session)

    async def get_by_code(self, code: str) -> Optional[PromoCode]:
        """Finds promo code by its SHA-256 hash."""
        code_h = hash_promo_code(code)
        stmt = select(PromoCode).where(PromoCode.code_hash == code_h, PromoCode.is_active.is_(True))
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def record_redemption(
        self, promo_id: uuid.UUID, user_id: uuid.UUID, listing_id: uuid.UUID
    ) -> PromoRedemption:
        """Records promo code redemption and increments used_count."""
        redemption = PromoRedemption(
            promo_id=promo_id,
            user_id=user_id,
            listing_id=listing_id,
        )
        self.session.add(redemption)
        
        # Increment used_count
        stmt = (
            update(PromoCode)
            .where(PromoCode.id == promo_id)
            .values(used_count=PromoCode.used_count + 1)
        )
        await self.session.execute(stmt)
        await self.session.flush()
        return redemption
