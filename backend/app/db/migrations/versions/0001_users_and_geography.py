"""create users, states, cities, and bans tables

Revision ID: 0001_users_and_geography
Revises: 
Create Date: 2026-10-08

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0001_users_and_geography"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. States table
    op.create_table(
        "states",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("code", sa.String(length=2), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("slug", sa.String(length=100), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("code", name="uq_states_code"),
        sa.UniqueConstraint("slug", name="uq_states_slug"),
    )
    op.create_index("idx_states_code", "states", ["code"])
    op.create_index("idx_states_slug", "states", ["slug"])

    # 2. Cities table
    op.create_table(
        "cities",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("state_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("states.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("slug", sa.String(length=100), nullable=False),
        sa.Column("is_popular", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("state_id", "slug", name="uq_cities_state_slug"),
    )
    op.create_index("idx_cities_state_id", "cities", ["state_id"])
    op.create_index("idx_cities_slug", "cities", ["slug"])

    # 3. Users table
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("google_sub", sa.String(length=255), nullable=True),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=50), server_default="buyer", nullable=False),
        sa.Column("status", sa.String(length=50), server_default="active", nullable=False),
        sa.Column("tos_version", sa.String(length=50), nullable=True),
        sa.Column("tos_accepted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("role IN ('buyer', 'seller', 'dealer', 'admin')", name="ck_users_role"),
        sa.CheckConstraint("status IN ('active', 'suspended', 'banned')", name="ck_users_status"),
        sa.UniqueConstraint("email", name="uq_users_email"),
        sa.UniqueConstraint("google_sub", name="uq_users_google_sub"),
    )
    op.create_index("idx_users_email", "users", ["email"])
    op.create_index("idx_users_google_sub", "users", ["google_sub"])

    # 4. Bans table
    op.create_table(
        "bans",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("reg_no_hash", sa.String(length=64), nullable=True),
        sa.Column("phone_hash", sa.String(length=64), nullable=True),
        sa.Column("doc_hash", sa.String(length=64), nullable=True),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("idx_bans_reg_no_hash", "bans", ["reg_no_hash"])
    op.create_index("idx_bans_phone_hash", "bans", ["phone_hash"])
    op.create_index("idx_bans_doc_hash", "bans", ["doc_hash"])


def downgrade() -> None:
    op.drop_table("bans")
    op.drop_table("users")
    op.drop_table("cities")
    op.drop_table("states")
