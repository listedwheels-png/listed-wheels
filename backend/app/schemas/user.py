import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: str = Field(default="buyer", description="buyer, seller, dealer, admin")
    status: str = Field(default="active", description="active, suspended, banned")


class SellerProfileBase(BaseModel):
    type: str = Field(default="individual", description="individual, dealer")
    shop_name: Optional[str] = None
    gst_no: Optional[str] = None
    maps_link: Optional[str] = None
    whatsapp: Optional[str] = None
    state_id: Optional[uuid.UUID] = None
    city_id: Optional[uuid.UUID] = None


class SellerProfileCreateOrUpdate(SellerProfileBase):
    pass


class SellerProfileResponse(SellerProfileBase):
    id: uuid.UUID
    user_id: uuid.UUID
    verified_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PublicSellerProfileResponse(BaseModel):
    id: uuid.UUID
    name: str
    role: str
    seller_type: str = "individual"
    shop_name: Optional[str] = None
    whatsapp: Optional[str] = None
    maps_link: Optional[str] = None
    is_verified: bool = False
    average_rating: float = 0.0
    total_reviews: int = 0
    active_listings_count: int = 0
    created_at: datetime


class UserResponse(UserBase):
    id: uuid.UUID
    google_sub: Optional[str] = None
    tos_version: Optional[str] = None
    tos_accepted_at: Optional[datetime] = None
    seller_profile: Optional[SellerProfileResponse] = None
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }


class UserUpdate(BaseModel):
    name: Optional[str] = None
