import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import BadRequestError, NotFoundError
from app.db.models.promo import PromoCode
from app.repositories.promo import PromoRepository, hash_promo_code


class PromoService:
    """Service managing promo code validation, rate-limiting rules, and creation."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.promo_repo = PromoRepository(session)

    async def validate_promo(
        self, code: str, category: str, user_id: Optional[uuid.UUID] = None
    ) -> PromoCode:
        """
        Validates promo code active status, expiration, usage limits, category, and user locks.
        Returns generic error if invalid to prevent enumeration.
        """
        if not code or len(code.strip()) < 3:
            raise BadRequestError("The promo code is invalid or has expired.", code="PROMO_INVALID")

        promo = await self.promo_repo.get_by_code(code)
        if not promo or not promo.is_active:
            raise BadRequestError("The promo code is invalid or has expired.", code="PROMO_INVALID")

        now = datetime.now(timezone.utc)
        if promo.expires_at and promo.expires_at < now:
            raise BadRequestError("The promo code is invalid or has expired.", code="PROMO_EXPIRED")

        if promo.max_uses is not None and promo.used_count >= promo.max_uses:
            raise BadRequestError("The promo code has reached its usage limit.", code="PROMO_MAX_USES_REACHED")

        if promo.category and promo.category.lower() != category.lower():
            raise BadRequestError(
                f"This promo code is only valid for {promo.category} listings.", code="PROMO_CATEGORY_MISMATCH"
            )

        if promo.locked_user_id and user_id and promo.locked_user_id != user_id:
            raise BadRequestError("This promo code is not valid for your account.", code="PROMO_USER_LOCKED")

        return promo

    async def create_promo(
        self,
        code: str,
        type: str,
        value: int,
        category: Optional[str] = None,
        max_uses: Optional[int] = None,
        expires_at: Optional[datetime] = None,
        locked_user_id: Optional[uuid.UUID] = None,
        requires_video: bool = False,
    ) -> PromoCode:
        """Creates a new promo code storing its SHA-256 hash."""
        clean_code = code.upper().strip()
        code_h = hash_promo_code(clean_code)

        existing = await self.promo_repo.get_by_code(clean_code)
        if existing:
            raise BadRequestError("Promo code already exists.", code="PROMO_EXISTS")

        promo = PromoCode(
            code_hash=code_h,
            code_display=clean_code,
            type=type,
            value=value,
            category=category.lower() if category else None,
            max_uses=max_uses,
            expires_at=expires_at,
            locked_user_id=locked_user_id,
            requires_video=requires_video,
            is_active=True,
        )
        created = await self.promo_repo.create(promo)
        await self.session.commit()
        return created
