from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class PricingBreakdown:
    base_paise: int
    discount_paise: int
    discounted_base_paise: int
    gst_rate: float
    gst_total_paise: int
    cgst_paise: int
    sgst_paise: int
    igst_paise: int
    total_paise: int
    is_same_state: bool


def calculate_pricing(
    base_fee_paise: int,
    promo_type: Optional[str] = None,
    promo_value: Optional[int] = None,
    seller_state_code: str = "TN",
    platform_state_code: str = "TN",
) -> PricingBreakdown:
    """
    Calculates listing price, promo discount, and 18% GST strictly using integer paise arithmetic.

    Worked Example:
    - Base: 199900 paise (₹1,999)
    - Promo: 20000 paise (₹200 flat)
    - Discounted Base: 179900 paise (₹1,799)
    - GST (18%): 32382 paise (₹323.82)
    - Total: 212282 paise (₹2,122.82)
    """
    if base_fee_paise < 0:
        raise ValueError("base_fee_paise cannot be negative")

    # 1. Compute Promo Discount
    discount_paise = 0
    if promo_type and promo_value is not None and promo_value > 0:
        if promo_type == "flat":
            discount_paise = min(base_fee_paise, promo_value)
        elif promo_type == "percentage":
            pct = min(100, max(0, promo_value))
            discount_paise = round(base_fee_paise * (pct / 100))

    discounted_base_paise = max(0, base_fee_paise - discount_paise)

    # 2. Compute 18% GST on the discounted taxable amount
    gst_rate = 0.18
    gst_total_paise = round(discounted_base_paise * gst_rate)

    # 3. Place of Supply Tax Split (CGST + SGST vs. IGST)
    is_same_state = seller_state_code.upper().strip() == platform_state_code.upper().strip()
    if is_same_state:
        cgst_paise = round(gst_total_paise / 2)
        sgst_paise = gst_total_paise - cgst_paise
        igst_paise = 0
    else:
        cgst_paise = 0
        sgst_paise = 0
        igst_paise = gst_total_paise

    total_paise = discounted_base_paise + gst_total_paise

    return PricingBreakdown(
        base_paise=base_fee_paise,
        discount_paise=discount_paise,
        discounted_base_paise=discounted_base_paise,
        gst_rate=gst_rate,
        gst_total_paise=gst_total_paise,
        cgst_paise=cgst_paise,
        sgst_paise=sgst_paise,
        igst_paise=igst_paise,
        total_paise=total_paise,
        is_same_state=is_same_state,
    )
