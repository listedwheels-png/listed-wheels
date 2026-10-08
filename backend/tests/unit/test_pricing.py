import pytest
from app.services.pricing import calculate_pricing


def test_pricing_worked_example_matches_build_guide():
    """
    Worked example from Architecture & Build Guide Section 10:
    ₹1,999 car listing with a ₹200 promo has a discounted base of ₹1,799,
    GST of ₹323.82, and a total of ₹2,122.82, which is 212282 paise.
    """
    pricing = calculate_pricing(
        base_fee_paise=199900,  # ₹1,999
        promo_type="flat",
        promo_value=20000,      # ₹200
        seller_state_code="TN",
        platform_state_code="TN",
    )

    assert pricing.base_paise == 199900
    assert pricing.discount_paise == 20000
    assert pricing.discounted_base_paise == 179900
    assert pricing.gst_total_paise == 32382
    assert pricing.total_paise == 212282
    # Place of supply for Tamil Nadu
    assert pricing.is_same_state is True
    assert pricing.cgst_paise == 16191
    assert pricing.sgst_paise == 16191
    assert pricing.igst_paise == 0


def test_pricing_100_percent_promo_zero_total():
    """Verify that a 100% discount promo yields 0 total paise and 0 GST."""
    pricing = calculate_pricing(
        base_fee_paise=199900,
        promo_type="percentage",
        promo_value=100,
        seller_state_code="TN",
    )

    assert pricing.discount_paise == 199900
    assert pricing.discounted_base_paise == 0
    assert pricing.gst_total_paise == 0
    assert pricing.total_paise == 0


def test_pricing_interstate_igst_split():
    """Verify that a non-TN seller (e.g. Karnataka KA) receives 18% IGST."""
    pricing = calculate_pricing(
        base_fee_paise=199900,
        promo_type="flat",
        promo_value=20000,
        seller_state_code="KA",
        platform_state_code="TN",
    )

    assert pricing.is_same_state is False
    assert pricing.cgst_paise == 0
    assert pricing.sgst_paise == 0
    assert pricing.igst_paise == 32382
    assert pricing.total_paise == 212282
