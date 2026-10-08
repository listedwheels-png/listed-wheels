import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy import CheckConstraint, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import TimestampedModel


class User(TimestampedModel):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("role IN ('buyer', 'seller', 'dealer', 'admin')", name="ck_users_role"),
        CheckConstraint("status IN ('active', 'suspended', 'banned')", name="ck_users_status"),
    )

    google_sub: Mapped[Optional[str]] = mapped_column(String(255), unique=True, nullable=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default="buyer", nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="active", nullable=False)
    tos_version: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    tos_accepted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    seller_profile: Mapped[Optional["SellerProfile"]] = relationship("SellerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    documents: Mapped[List["VerificationDocument"]] = relationship("VerificationDocument", back_populates="user", cascade="all, delete-orphan", foreign_keys="VerificationDocument.user_id")


class SellerProfile(TimestampedModel):
    __tablename__ = "seller_profiles"
    __table_args__ = (
        CheckConstraint("type IN ('individual', 'dealer')", name="ck_seller_profiles_type"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True
    )
    type: Mapped[str] = mapped_column(String(50), default="individual", nullable=False)
    shop_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    gst_no: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    maps_link: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    whatsapp: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    state_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("states.id"), nullable=True)
    city_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("cities.id"), nullable=True)
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="seller_profile")


class VerificationDocument(TimestampedModel):
    __tablename__ = "verification_documents"
    __table_args__ = (
        CheckConstraint("doc_type IN ('RC', 'AADHAAR', 'PAN')", name="ck_verification_documents_doc_type"),
        CheckConstraint("status IN ('pending', 'approved', 'rejected')", name="ck_verification_documents_status"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    doc_type: Mapped[str] = mapped_column(String(50), nullable=False)
    storage_key: Mapped[str] = mapped_column(String(500), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False)
    reviewed_by: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="documents", foreign_keys=[user_id])


class Ban(TimestampedModel):
    __tablename__ = "bans"

    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)
    reg_no_hash: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    phone_hash: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    doc_hash: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
