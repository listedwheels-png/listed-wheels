"""create listings, listing_media, promo_videos, and favorites tables

Revision ID: 0003_listings_and_media
Revises: 0002_seller_profiles_and_docs
Create Date: 2026-10-08

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0003_listings_and_media"
down_revision: Union[str, None] = "0002_seller_profiles_and_docs"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Listings table
    op.create_table(
        "listings",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("seller_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("category", sa.String(length=50), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("make", sa.String(length=100), nullable=False),
        sa.Column("model", sa.String(length=100), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("price_paise", sa.BigInteger(), nullable=False),
        sa.Column("mileage_km", sa.Integer(), nullable=True),
        sa.Column("owners", sa.Integer(), nullable=True),
        sa.Column("fuel_type", sa.String(length=50), nullable=True),
        sa.Column("transmission", sa.String(length=50), nullable=True),
        sa.Column("state_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("states.id"), nullable=True),
        sa.Column("city_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("cities.id"), nullable=True),
        sa.Column("city", sa.String(length=100), nullable=False),
        sa.Column("reg_no_hash", sa.String(length=64), nullable=True),
        sa.Column("reg_no_masked", sa.String(length=20), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=50), server_default="draft", nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("category IN ('cycles', 'bikes', 'cars', 'other')", name="ck_listings_category"),
        sa.CheckConstraint(
            "status IN ('draft', 'pending_payment', 'pending_verification', 'live', 'hidden', 'sold', 'expired', 'rejected', 'removed')",
            name="ck_listings_status",
        ),
        sa.CheckConstraint(
            "fuel_type IS NULL OR fuel_type IN ('petrol', 'diesel', 'electric', 'cng', 'hybrid', 'lpg')",
            name="ck_listings_fuel_type",
        ),
        sa.CheckConstraint(
            "transmission IS NULL OR transmission IN ('manual', 'automatic')",
            name="ck_listings_transmission",
        ),
    )

    op.create_index("idx_listings_seller_id", "listings", ["seller_id"])
    op.create_index("idx_listings_category", "listings", ["category"])
    op.create_index("idx_listings_city", "listings", ["city"])
    op.create_index("idx_listings_status", "listings", ["status"])
    op.create_index("idx_listings_make", "listings", ["make"])

    # Composite index for search performance: (category, city, status, price_paise)
    op.create_index(
        "idx_listings_search",
        "listings",
        ["category", "city", "status", "price_paise"],
    )

    # Sorting index
    op.create_index("idx_listings_created_at", "listings", [sa.text("created_at DESC")])

    # Partial unique index: 1 active listing per vehicle registration number hash
    op.create_index(
        "uq_listings_live_reg_no_hash",
        "listings",
        ["reg_no_hash"],
        unique=True,
        postgresql_where=sa.text("status IN ('live', 'pending_verification') AND reg_no_hash IS NOT NULL"),
    )

    # 2. Listing Media table
    op.create_table(
        "listing_media",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("listing_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("listings.id", ondelete="CASCADE"), nullable=False),
        sa.Column("kind", sa.String(length=50), server_default="photo", nullable=False),
        sa.Column("storage_key", sa.String(length=500), nullable=False),
        sa.Column("position", sa.Integer(), server_default="0", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("idx_listing_media_listing_id", "listing_media", ["listing_id"])

    # 3. Promo Videos table
    op.create_table(
        "promo_videos",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("listing_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("listings.id", ondelete="CASCADE"), nullable=False),
        sa.Column("link", sa.String(length=500), nullable=False),
        sa.Column("method", sa.String(length=50), server_default="link", nullable=False),
        sa.Column("status", sa.String(length=50), server_default="submitted", nullable=False),
        sa.Column("consent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("status IN ('submitted', 'approved', 'needs_changes', 'rejected', 'posted')", name="ck_promo_videos_status"),
        sa.UniqueConstraint("listing_id", name="uq_promo_videos_listing_id"),
    )
    op.create_index("idx_promo_videos_listing_id", "promo_videos", ["listing_id"])

    # 4. Favorites table
    op.create_table(
        "favorites",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("listing_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("listings.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("user_id", "listing_id", name="uq_favorites_user_listing"),
    )
    op.create_index("idx_favorites_user_id", "favorites", ["user_id"])
    op.create_index("idx_favorites_listing_id", "favorites", ["listing_id"])


def downgrade() -> None:
    op.drop_table("favorites")
    op.drop_table("promo_videos")
    op.drop_table("listing_media")
    op.drop_table("listings")
