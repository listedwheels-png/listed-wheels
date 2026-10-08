import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import TimestampedModel


class Listing(TimestampedModel):
    __tablename__ = "listings"
    __table_args__ = (
        CheckConstraint("category IN ('cycles', 'bikes', 'cars', 'other')", name="ck_listings_category"),
        CheckConstraint(
            "status IN ('draft', 'pending_payment', 'pending_verification', 'live', 'hidden', 'sold', 'expired', 'rejected', 'removed')",
            name="ck_listings_status",
        ),
        CheckConstraint(
            "fuel_type IS NULL OR fuel_type IN ('petrol', 'diesel', 'electric', 'cng', 'hybrid', 'lpg')",
            name="ck_listings_fuel_type",
        ),
        CheckConstraint(
            "transmission IS NULL OR transmission IN ('manual', 'automatic')",
            name="ck_listings_transmission",
        ),
        # Partial unique index: only 1 active listing per vehicle registration
        Index(
            "uq_listings_live_reg_no_hash",
            "reg_no_hash",
            unique=True,
            postgresql_where=text("status IN ('live', 'pending_verification') AND reg_no_hash IS NOT NULL"),
        ),
        # Composite search index: category, city, status, price_paise
        Index("idx_listings_search", "category", "city", "status", "price_paise"),
        # Created at index for sorting
        Index("idx_listings_created_at", text("created_at DESC")),
    )

    seller_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    make: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    model: Mapped[str] = mapped_column(String(100), nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    price_paise: Mapped[int] = mapped_column(BigInteger, nullable=False)
    mileage_km: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    owners: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    fuel_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    transmission: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    state_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("states.id"), nullable=True)
    city_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("cities.id"), nullable=True)
    city: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    reg_no_hash: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    reg_no_masked: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="draft", nullable=False)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    media: Mapped[List["ListingMedia"]] = relationship("ListingMedia", back_populates="listing", cascade="all, delete-orphan", order_by="ListingMedia.position")
    promo_video: Mapped[Optional["PromoVideo"]] = relationship("PromoVideo", back_populates="listing", uselist=False, cascade="all, delete-orphan")


class ListingMedia(TimestampedModel):
    __tablename__ = "listing_media"

    listing_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("listings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    kind: Mapped[str] = mapped_column(String(50), default="photo", nullable=False)
    storage_key: Mapped[str] = mapped_column(String(500), nullable=False)
    position: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    listing: Mapped["Listing"] = relationship("Listing", back_populates="media")


class PromoVideo(TimestampedModel):
    __tablename__ = "promo_videos"
    __table_args__ = (
        CheckConstraint("status IN ('submitted', 'approved', 'needs_changes', 'rejected', 'posted')", name="ck_promo_videos_status"),
    )

    listing_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("listings.id", ondelete="CASCADE"), unique=True, nullable=False, index=True
    )
    link: Mapped[str] = mapped_column(String(500), nullable=False)
    method: Mapped[str] = mapped_column(String(50), default="link", nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="submitted", nullable=False)
    consent_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    listing: Mapped["Listing"] = relationship("Listing", back_populates="promo_video")


class Favorite(TimestampedModel):
    __tablename__ = "favorites"
    __table_args__ = (
        UniqueConstraint("user_id", "listing_id", name="uq_favorites_user_listing"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    listing_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("listings.id", ondelete="CASCADE"), nullable=False, index=True
    )
