import pytest
from sqlalchemy import BigInteger, CheckConstraint, Index, UniqueConstraint
from app.db.models import (
    Base,
    State,
    City,
    User,
    SellerProfile,
    VerificationDocument,
    Ban,
    Listing,
    ListingMedia,
    PromoVideo,
    Favorite,
    Plan,
    Order,
    Payment,
    Invoice,
    CreditNote,
    PromoCode,
    PromoRedemption,
    Review,
    ContactEvent,
    Report,
    AuditLog,
)


def test_all_21_models_registered_in_metadata():
    tables = Base.metadata.tables
    expected_tables = {
        "states",
        "cities",
        "users",
        "seller_profiles",
        "verification_documents",
        "bans",
        "listings",
        "listing_media",
        "promo_videos",
        "favorites",
        "plans",
        "orders",
        "payments",
        "invoices",
        "credit_notes",
        "promo_codes",
        "promo_redemptions",
        "reviews",
        "contact_events",
        "reports",
        "audit_log",
    }
    assert expected_tables.issubset(set(tables.keys())), f"Missing tables: {expected_tables - set(tables.keys())}"


def test_money_stored_as_bigint_paise():
    """Verify that money fields use integer paise, not floats."""
    listing_table = Base.metadata.tables["listings"]
    assert isinstance(listing_table.c.price_paise.type, BigInteger)

    plan_table = Base.metadata.tables["plans"]
    assert isinstance(plan_table.c.base_fee_paise.type, BigInteger)

    order_table = Base.metadata.tables["orders"]
    assert isinstance(order_table.c.base_paise.type, BigInteger)
    assert isinstance(order_table.c.discount_paise.type, BigInteger)
    assert isinstance(order_table.c.gst_paise.type, BigInteger)
    assert isinstance(order_table.c.total_paise.type, BigInteger)

    payment_table = Base.metadata.tables["payments"]
    assert isinstance(payment_table.c.amount_paise.type, BigInteger)


def test_partial_unique_index_on_listing_registration_hash():
    """Verify the partial unique index on reg_no_hash for active listings."""
    listing_table = Base.metadata.tables["listings"]
    indexes = {idx.name: idx for idx in listing_table.indexes}
    assert "uq_listings_live_reg_no_hash" in indexes
    uq_idx = indexes["uq_listings_live_reg_no_hash"]
    assert uq_idx.unique is True
    assert uq_idx.dialect_options["postgresql"]["where"] is not None


def test_search_composite_index_on_listings():
    """Verify composite index (category, city, status, price_paise)."""
    listing_table = Base.metadata.tables["listings"]
    indexes = {idx.name: idx for idx in listing_table.indexes}
    assert "idx_listings_search" in indexes
    search_idx = indexes["idx_listings_search"]
    col_names = [c.name for c in search_idx.columns]
    assert col_names == ["category", "city", "status", "price_paise"]


def test_unique_review_per_buyer_per_seller():
    """Verify one review constraint per buyer per seller."""
    review_table = Base.metadata.tables["reviews"]
    uq_constraints = [c for c in review_table.constraints if isinstance(c, UniqueConstraint)]
    seller_buyer_uq = any(
        set([col.name for col in uq.columns]) == {"seller_id", "buyer_id"} for uq in uq_constraints
    )
    assert seller_buyer_uq, "Missing unique constraint on (seller_id, buyer_id) in reviews table"


def test_user_role_and_status_check_constraints():
    """Verify check constraints for user roles and statuses."""
    user_table = Base.metadata.tables["users"]
    ck_names = [ck.name for ck in user_table.constraints if isinstance(ck, CheckConstraint)]
    assert "ck_users_role" in ck_names
    assert "ck_users_status" in ck_names
