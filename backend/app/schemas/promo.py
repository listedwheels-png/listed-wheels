import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class PromoValidateRequest(BaseModel):
    code: str = Field(min_length=3, max_length=50, description="Promo code string")
    category: str = Field(description="Vehicle category: cars, bikes, cycles, other")


class PromoValidateResponse(BaseModel):
    valid: bool
    code: str
    type: str  # 'flat' or 'percentage'
    value: int
    discount_paise_estimate: int
    requires_video: bool


class PromoCreateRequest(BaseModel):
    code: str = Field(min_length=3, max_length=50)
    type: str = Field(default="flat", description="flat or percentage")
    value: int = Field(gt=0, description="Discount amount in integer paise or percentage integer")
    category: Optional[str] = None
    max_uses: Optional[int] = None
    expires_at: Optional[datetime] = None
    locked_user_id: Optional[uuid.UUID] = None
    requires_video: bool = False
