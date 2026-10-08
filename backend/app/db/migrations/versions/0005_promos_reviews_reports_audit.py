"""create promo_codes, promo_redemptions, reviews, contact_events, reports, and audit_log tables

Revision ID: 0005_promos_reviews_reports_audit
Revises: 0004_plans_orders_payments_invoices
Create Date: 2026-10-08

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0005_promos_reviews_reports_audit"
down_revision: Union[str, None] = "0004_plans_orders_payments_invoices"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Promo Codes table
    op.create_table(
        "promo_codes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("code_hash", sa.String(length=64), nullable=False),
        sa.Column("code_display", sa.String(length=50), nullable=True),
        sa.Column("type", sa.String(length=50), server_default="flat", nullable=False),
        sa.Column("value", sa.BigInteger(), nullable=False),
        sa.Column("category", sa.String(length=50), nullable=True),
        sa.Column("max_uses", sa.Integer(), nullable=True),
        sa.Column("used_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("locked_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("requires_video", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("type IN ('flat', 'percentage')", name="ck_promo_codes_type"),
        sa.UniqueConstraint("code_hash", name="uq_promo_codes_code_hash"),
    )
    op.create_index("idx_promo_codes_code_hash", "promo_codes", ["code_hash"])
    op.create_index("idx_promo_codes_is_active", "promo_codes", ["is_active"])

    # Link orders to promo_codes
    op.create_foreign_key(
        "fk_orders_promo_id_promo_codes",
        "orders",
        "promo_codes",
        ["promo_id"],
        ["id"],
        ondelete="SET NULL",
    )

    # 2. Promo Redemptions table
    op.create_table(
        "promo_redemptions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("promo_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("promo_codes.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("listing_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("listings.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("redeemed_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("idx_promo_redemptions_promo_id", "promo_redemptions", ["promo_id"])
    op.create_index("idx_promo_redemptions_user_id", "promo_redemptions", ["user_id"])
    op.create_index("idx_promo_redemptions_listing_id", "promo_redemptions", ["listing_id"])

    # 3. Reviews table (One per buyer per seller)
    op.create_table(
        "reviews",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("seller_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("buyer_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=50), server_default="visible", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("rating >= 1 AND rating <= 5", name="ck_reviews_rating_range"),
        sa.CheckConstraint("status IN ('visible', 'hidden', 'flagged')", name="ck_reviews_status"),
        sa.UniqueConstraint("seller_id", "buyer_id", name="uq_reviews_seller_buyer"),
    )
    op.create_index("idx_reviews_seller_id", "reviews", ["seller_id"])
    op.create_index("idx_reviews_buyer_id", "reviews", ["buyer_id"])

    # 4. Contact Events table
    op.create_table(
        "contact_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("listing_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("listings.id", ondelete="CASCADE"), nullable=False),
        sa.Column("buyer_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("idx_contact_events_listing_id", "contact_events", ["listing_id"])
    op.create_index("idx_contact_events_buyer_id", "contact_events", ["buyer_id"])

    # 5. Reports table
    op.create_table(
        "reports",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("listing_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("listings.id", ondelete="CASCADE"), nullable=False),
        sa.Column("reporter_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=50), server_default="pending", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("status IN ('pending', 'reviewed', 'dismissed', 'actioned')", name="ck_reports_status"),
    )
    op.create_index("idx_reports_listing_id", "reports", ["listing_id"])
    op.create_index("idx_reports_status", "reports", ["status"])

    # 6. Audit Log table
    op.create_table(
        "audit_log",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("admin_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("action", sa.String(length=100), nullable=False),
        sa.Column("entity", sa.String(length=100), nullable=False),
        sa.Column("entity_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("idx_audit_log_admin_id", "audit_log", ["admin_id"])
    op.create_index("idx_audit_log_action", "audit_log", ["action"])
    op.create_index("idx_audit_log_entity_id", "audit_log", ["entity_id"])


def downgrade() -> None:
    op.drop_table("audit_log")
    op.drop_table("reports")
    op.drop_table("contact_events")
    op.drop_table("reviews")
    op.drop_table("promo_redemptions")
    op.drop_constraint("fk_orders_promo_id_promo_codes", "orders", type_="foreignkey")
    op.drop_table("promo_codes")
