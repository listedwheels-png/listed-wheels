import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class ReviewCreate(BaseModel):
    seller_id: uuid.UUID
    rating: int = Field(ge=1, le=5, description="Rating from 1 to 5 stars")
    text: str = Field(min_length=5, max_length=2000, description="Review comment")


class ReviewResponse(BaseModel):
    id: uuid.UUID
    seller_id: uuid.UUID
    buyer_id: uuid.UUID
    buyer_name: Optional[str] = None
    rating: int
    text: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class SellerReviewSummary(BaseModel):
    seller_id: uuid.UUID
    average_rating: float
    total_reviews: int
    reviews: List[ReviewResponse]


class ReportCreate(BaseModel):
    listing_id: uuid.UUID
    reason: str = Field(min_length=3, max_length=1000, description="Reason: misleading, already_sold, fraud_suspected, wrong_price, abuse, other")


class ReportUpdate(BaseModel):
    status: str = Field(pattern="^(pending|reviewed|dismissed|actioned)$")


class ReportResponse(BaseModel):
    id: uuid.UUID
    listing_id: uuid.UUID
    reporter_id: uuid.UUID
    reporter_name: Optional[str] = None
    reporter_email: Optional[str] = None
    reason: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class FavoriteResponse(BaseModel):
    id: uuid.UUID
    listing_id: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class FavoriteToggleResponse(BaseModel):
    listing_id: uuid.UUID
    is_favorite: bool
    message: str
