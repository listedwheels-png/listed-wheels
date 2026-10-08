"""create seller_profiles and verification_documents tables

Revision ID: 0002_seller_profiles_and_docs
Revises: 0001_users_and_geography
Create Date: 2026-10-08

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0002_seller_profiles_and_docs"
down_revision: Union[str, None] = "0001_users_and_geography"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Seller Profiles table
    op.create_table(
        "seller_profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("type", sa.String(length=50), server_default="individual", nullable=False),
        sa.Column("shop_name", sa.String(length=255), nullable=True),
        sa.Column("gst_no", sa.String(length=20), nullable=True),
        sa.Column("maps_link", sa.Text(), nullable=True),
        sa.Column("whatsapp", sa.String(length=20), nullable=True),
        sa.Column("state_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("states.id"), nullable=True),
        sa.Column("city_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("cities.id"), nullable=True),
        sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("type IN ('individual', 'dealer')", name="ck_seller_profiles_type"),
        sa.UniqueConstraint("user_id", name="uq_seller_profiles_user_id"),
    )
    op.create_index("idx_seller_profiles_user_id", "seller_profiles", ["user_id"])

    # 2. Verification Documents table
    op.create_table(
        "verification_documents",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("doc_type", sa.String(length=50), nullable=False),
        sa.Column("storage_key", sa.String(length=500), nullable=False),
        sa.Column("status", sa.String(length=50), server_default="pending", nullable=False),
        sa.Column("reviewed_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("rejection_reason", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("doc_type IN ('RC', 'AADHAAR', 'PAN')", name="ck_verification_documents_doc_type"),
        sa.CheckConstraint("status IN ('pending', 'approved', 'rejected')", name="ck_verification_documents_status"),
    )
    op.create_index("idx_verification_documents_user_id", "verification_documents", ["user_id"])
    op.create_index("idx_verification_documents_status", "verification_documents", ["status"])


def downgrade() -> None:
    op.drop_table("verification_documents")
    op.drop_table("seller_profiles")
