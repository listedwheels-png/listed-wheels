import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, computed_field


class PlanBase(BaseModel):
    category: str = Field(description="cycles, bikes, cars, other")
    base_fee_paise: int = Field(description="Listing price in integer paise", ge=0)
    duration_days: int = Field(default=365, description="Listing duration in days", ge=1)
    is_active: bool = Field(default=True, description="Whether plan is currently active")


class PlanCreate(PlanBase):
    pass


class PlanUpdate(BaseModel):
    base_fee_paise: Optional[int] = Field(default=None, ge=0)
    duration_days: Optional[int] = Field(default=None, ge=1)
    is_active: Optional[bool] = None


class PlanResponse(PlanBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    @computed_field
    @property
    def base_fee_inr(self) -> float:
        """Formatted INR amount."""
        return round(self.base_fee_paise / 100, 2)

    model_config = {
        "from_attributes": True
    }
