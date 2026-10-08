import uuid
from typing import List, Optional
from sqlalchemy import BigInteger, Boolean, CheckConstraint, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import TimestampedModel


class Plan(TimestampedModel):
    __tablename__ = "plans"
    __table_args__ = (
        CheckConstraint("category IN ('cycles', 'bikes', 'cars', 'other')", name="ck_plans_category"),
    )

    category: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    base_fee_paise: Mapped[int] = mapped_column(BigInteger, nullable=False)
    duration_days: Mapped[int] = mapped_column(Integer, default=365, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class Order(TimestampedModel):
    __tablename__ = "orders"
    __table_args__ = (
        CheckConstraint("status IN ('created', 'paid', 'failed', 'cancelled')", name="ck_orders_status"),
    )

    listing_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("listings.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    base_paise: Mapped[int] = mapped_column(BigInteger, nullable=False)
    discount_paise: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    gst_paise: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    total_paise: Mapped[int] = mapped_column(BigInteger, nullable=False)
    promo_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("promo_codes.id"), nullable=True)
    razorpay_order_id: Mapped[Optional[str]] = mapped_column(String(100), unique=True, nullable=True, index=True)
    status: Mapped[str] = mapped_column(String(50), default="created", nullable=False)

    payments: Mapped[List["Payment"]] = relationship("Payment", back_populates="order", cascade="all, delete-orphan")
    invoice: Mapped[Optional["Invoice"]] = relationship("Invoice", back_populates="order", uselist=False)


class Payment(TimestampedModel):
    __tablename__ = "payments"
    __table_args__ = (
        CheckConstraint("status IN ('authorized', 'captured', 'refunded', 'failed')", name="ck_payments_status"),
    )

    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True
    )
    razorpay_payment_id: Mapped[Optional[str]] = mapped_column(String(100), unique=True, nullable=True, index=True)
    amount_paise: Mapped[int] = mapped_column(BigInteger, nullable=False)
    fee_paise: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False)

    order: Mapped["Order"] = relationship("Order", back_populates="payments")


class Invoice(TimestampedModel):
    __tablename__ = "invoices"

    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("orders.id", ondelete="RESTRICT"), unique=True, nullable=False, index=True
    )
    invoice_no: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    gstin: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    place_of_supply: Mapped[str] = mapped_column(String(100), nullable=False)
    cgst: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    sgst: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    igst: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)

    order: Mapped["Order"] = relationship("Order", back_populates="invoice")
    credit_notes: Mapped[List["CreditNote"]] = relationship("CreditNote", back_populates="invoice", cascade="all, delete-orphan")


class CreditNote(TimestampedModel):
    __tablename__ = "credit_notes"

    invoice_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("invoices.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    amount_paise: Mapped[int] = mapped_column(BigInteger, nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)

    invoice: Mapped["Invoice"] = relationship("Invoice", back_populates="credit_notes")
