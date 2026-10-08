import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import BigInteger, Boolean, CheckConstraint, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import TimestampedModel


class PromoCode(TimestampedModel):
    __tablename__ = "promo_codes"
    __table_args__ = (
        CheckConstraint("type IN ('flat', 'percentage')", name="ck_promo_codes_type"),
    )

    code_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    code_display: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    type: Mapped[str] = mapped_column(String(50), default="flat", nullable=False)
    value: Mapped[int] = mapped_column(BigInteger, nullable=False) # flat paise or percentage integer
    category: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    max_uses: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    used_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    locked_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    requires_video: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    redemptions: Mapped[List["PromoRedemption"]] = relationship("PromoRedemption", back_populates="promo_code", cascade="all, delete-orphan")


class PromoRedemption(TimestampedModel):
    __tablename__ = "promo_redemptions"

    promo_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("promo_codes.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    listing_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("listings.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    redeemed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    promo_code: Mapped["PromoCode"] = relationship("PromoCode", back_populates="redemptions")
