import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, computed_field


class OrderCreateRequest(BaseModel):
    listing_id: uuid.UUID
    promo_code: Optional[str] = Field(default=None, description="Optional promotional discount code")


class OrderResponse(BaseModel):
    id: uuid.UUID
    listing_id: uuid.UUID
    user_id: uuid.UUID
    base_paise: int
    discount_paise: int
    gst_paise: int
    total_paise: int
    promo_id: Optional[uuid.UUID] = None
    razorpay_order_id: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime

    @computed_field
    @property
    def total_inr(self) -> float:
        return round(self.total_paise / 100, 2)

    @computed_field
    @property
    def is_zero_total(self) -> bool:
        return self.total_paise == 0

    model_config = {"from_attributes": True}


class RazorpayPaymentOrder(BaseModel):
    order_id: uuid.UUID
    razorpay_order_id: str
    key_id: str
    amount_paise: int
    currency: str = "INR"
    name: str = "ListedWheels"
    description: str = "12-Month Vehicle Listing Fee"


class InvoiceResponse(BaseModel):
    id: uuid.UUID
    order_id: uuid.UUID
    invoice_no: str
    gstin: Optional[str] = None
    place_of_supply: str
    cgst: int
    sgst: int
    igst: int
    total_paise: Optional[int] = None
    created_at: datetime

    @computed_field
    @property
    def total_tax_inr(self) -> float:
        return round((self.cgst + self.sgst + self.igst) / 100, 2)

    model_config = {"from_attributes": True}
