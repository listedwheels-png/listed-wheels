"""create plans, orders, payments, invoices, and credit_notes tables

Revision ID: 0004_plans_orders_payments_invoices
Revises: 0003_listings_and_media
Create Date: 2026-10-08

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0004_plans_orders_payments_invoices"
down_revision: Union[str, None] = "0003_listings_and_media"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Plans table
    op.create_table(
        "plans",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("category", sa.String(length=50), nullable=False),
        sa.Column("base_fee_paise", sa.BigInteger(), nullable=False),
        sa.Column("duration_days", sa.Integer(), server_default="365", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("category IN ('cycles', 'bikes', 'cars', 'other')", name="ck_plans_category"),
        sa.UniqueConstraint("category", name="uq_plans_category"),
    )

    # 2. Orders table
    op.create_table(
        "orders",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("listing_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("listings.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("base_paise", sa.BigInteger(), nullable=False),
        sa.Column("discount_paise", sa.BigInteger(), server_default="0", nullable=False),
        sa.Column("gst_paise", sa.BigInteger(), server_default="0", nullable=False),
        sa.Column("total_paise", sa.BigInteger(), nullable=False),
        sa.Column("promo_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("razorpay_order_id", sa.String(length=100), nullable=True),
        sa.Column("status", sa.String(length=50), server_default="created", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("status IN ('created', 'paid', 'failed', 'cancelled')", name="ck_orders_status"),
        sa.UniqueConstraint("razorpay_order_id", name="uq_orders_razorpay_order_id"),
    )
    op.create_index("idx_orders_listing_id", "orders", ["listing_id"])
    op.create_index("idx_orders_user_id", "orders", ["user_id"])
    op.create_index("idx_orders_status", "orders", ["status"])

    # 3. Payments table
    op.create_table(
        "payments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False),
        sa.Column("razorpay_payment_id", sa.String(length=100), nullable=True),
        sa.Column("amount_paise", sa.BigInteger(), nullable=False),
        sa.Column("fee_paise", sa.BigInteger(), server_default="0", nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("status IN ('authorized', 'captured', 'refunded', 'failed')", name="ck_payments_status"),
        sa.UniqueConstraint("razorpay_payment_id", name="uq_payments_razorpay_payment_id"),
    )
    op.create_index("idx_payments_order_id", "payments", ["order_id"])
    op.create_index("idx_payments_status", "payments", ["status"])

    # 4. Invoices table
    op.create_table(
        "invoices",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("orders.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("invoice_no", sa.String(length=100), nullable=False),
        sa.Column("gstin", sa.String(length=20), nullable=True),
        sa.Column("place_of_supply", sa.String(length=100), nullable=False),
        sa.Column("cgst", sa.BigInteger(), server_default="0", nullable=False),
        sa.Column("sgst", sa.BigInteger(), server_default="0", nullable=False),
        sa.Column("igst", sa.BigInteger(), server_default="0", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("order_id", name="uq_invoices_order_id"),
        sa.UniqueConstraint("invoice_no", name="uq_invoices_invoice_no"),
    )
    op.create_index("idx_invoices_invoice_no", "invoices", ["invoice_no"])

    # 5. Credit Notes table
    op.create_table(
        "credit_notes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("invoice_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("invoices.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("amount_paise", sa.BigInteger(), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("idx_credit_notes_invoice_id", "credit_notes", ["invoice_id"])


def downgrade() -> None:
    op.drop_table("credit_notes")
    op.drop_table("invoices")
    op.drop_table("payments")
    op.drop_table("orders")
    op.drop_table("plans")
