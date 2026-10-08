import uuid
from datetime import datetime
from typing import Annotated, Any, Dict, List, Literal, Optional, Union
from pydantic import BaseModel, Field, computed_field, model_validator

from app.core.errors import BadRequestError
from app.core.registration import normalize_reg_no, validate_reg_no


class MediaResponse(BaseModel):
    id: uuid.UUID
    kind: str = "photo"
    storage_key: str
    position: int = 0

    @computed_field
    @property
    def url(self) -> str:
        # In production this points to CloudFront CDN
        return f"https://photos.listedwheels.com/{self.storage_key}"

    model_config = {"from_attributes": True}


class PromoVideoResponse(BaseModel):
    id: uuid.UUID
    link: str
    method: str = "link"
    status: str

    model_config = {"from_attributes": True}


# --- Category Specific Create Models ---

class ListingCreateBase(BaseModel):
    title: str = Field(min_length=3, max_length=255, description="Listing title")
    make: str = Field(min_length=1, max_length=100, description="Manufacturer / Brand")
    model: str = Field(min_length=1, max_length=100, description="Model and trim name")
    year: int = Field(ge=1980, le=2030, description="Manufacturing / registration year")
    price_paise: int = Field(gt=0, description="Selling price in integer paise (e.g. 50000000 = ₹5,00,000)")
    city: str = Field(min_length=2, max_length=100, description="City name")
    state_id: Optional[uuid.UUID] = None
    city_id: Optional[uuid.UUID] = None
    description: Optional[str] = Field(default=None, max_length=2000)
    owners: Optional[int] = Field(default=1, ge=1, le=10)


class CarListingCreate(ListingCreateBase):
    category: Literal["cars"] = "cars"
    registration_no: str = Field(min_length=4, max_length=20, description="Indian vehicle registration number")
    mileage_km: int = Field(ge=0, le=1000000, description="Odometer reading in km")
    fuel_type: Literal["petrol", "diesel", "electric", "cng", "hybrid", "lpg"]
    transmission: Literal["manual", "automatic"]


class BikeListingCreate(ListingCreateBase):
    category: Literal["bikes"] = "bikes"
    registration_no: str = Field(min_length=4, max_length=20, description="Indian vehicle registration number")
    mileage_km: int = Field(ge=0, le=500000, description="Odometer reading in km")
    fuel_type: Literal["petrol", "electric"]
    transmission: Optional[Literal["manual", "automatic"]] = None


class CycleListingCreate(ListingCreateBase):
    category: Literal["cycles"] = "cycles"
    registration_no: Optional[str] = None
    mileage_km: Optional[int] = None
    fuel_type: Optional[str] = None
    transmission: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def validate_cycle_restrictions(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if data.get("registration_no"):
                raise ValueError("Cycles cannot have a vehicle registration number.")
            if data.get("mileage_km") is not None:
                raise ValueError("Cycles do not have odometer mileage.")
            if data.get("fuel_type"):
                raise ValueError("Cycles do not have fuel types.")
        return data


class OtherListingCreate(ListingCreateBase):
    category: Literal["other"] = "other"
    registration_no: Optional[str] = None
    mileage_km: Optional[int] = None
    fuel_type: Optional[str] = None
    transmission: Optional[str] = None


ListingCreate = Annotated[
    Union[CarListingCreate, BikeListingCreate, CycleListingCreate, OtherListingCreate],
    Field(discriminator="category"),
]


# --- Listing Update (Locked Field Rule) ---

class ListingUpdate(BaseModel):
    """
    Update payload. Category, Make, Model, Year, and Registration Number are LOCKED
    and cannot be edited by the seller once the draft is created.
    """
    title: Optional[str] = Field(default=None, min_length=3, max_length=255)
    price_paise: Optional[int] = Field(default=None, gt=0)
    city: Optional[str] = Field(default=None, min_length=2, max_length=100)
    description: Optional[str] = Field(default=None, max_length=2000)
    mileage_km: Optional[int] = Field(default=None, ge=0)
    owners: Optional[int] = Field(default=None, ge=1, le=10)


# --- Response Models ---

class ListingResponse(BaseModel):
    id: uuid.UUID
    seller_id: uuid.UUID
    category: str
    title: str
    make: str
    model: str
    year: int
    price_paise: int
    city: str
    state_id: Optional[uuid.UUID] = None
    city_id: Optional[uuid.UUID] = None
    mileage_km: Optional[int] = None
    fuel_type: Optional[str] = None
    transmission: Optional[str] = None
    owners: Optional[int] = None
    reg_no_masked: Optional[str] = None
    description: Optional[str] = None
    status: str
    expires_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    media: List[MediaResponse] = []

    @computed_field
    @property
    def price_inr(self) -> float:
        return round(self.price_paise / 100, 2)

    @computed_field
    @property
    def primary_photo_url(self) -> Optional[str]:
        if self.media:
            return self.media[0].url
        return None

    model_config = {"from_attributes": True}


class ListingContactResponse(BaseModel):
    listing_id: uuid.UUID
    seller_name: str
    whatsapp_number: str
    prefilled_message: str
