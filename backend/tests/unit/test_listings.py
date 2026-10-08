import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch
import pytest

from app.core.errors import BadRequestError, ConflictError
from app.db.models.listing import Listing
from app.db.models.user import User
from app.schemas.listing import CarListingCreate, CycleListingCreate, ListingUpdate
from app.services.listing import ListingService


@pytest.fixture
def seller_user():
    return User(
        id=uuid.uuid4(),
        email="seller@example.com",
        name="Auto Seller",
        role="seller",
        status="active",
        tos_version="1.0",
        tos_accepted_at=datetime.now(timezone.utc),
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


@pytest.mark.asyncio
async def test_create_car_listing_success(seller_user):
    mock_session = AsyncMock()
    car_in = CarListingCreate(
        category="cars",
        title="2021 Hyundai i20 Asta",
        make="Hyundai",
        model="i20 Asta",
        year=2021,
        price_paise=85000000,
        city="Chennai",
        registration_no="TN-09-AB-1234",
        mileage_km=25000,
        fuel_type="petrol",
        transmission="manual",
        description="Single owner car",
    )

    with patch("app.services.listing.ListingRepository") as MockRepo:
        mock_repo_inst = MockRepo.return_value
        mock_repo_inst.get_active_by_reg_no_hash = AsyncMock(return_value=None)
        
        created_mock = Listing(
            id=uuid.uuid4(),
            seller_id=seller_user.id,
            category="cars",
            title=car_in.title,
            make=car_in.make,
            model=car_in.model,
            year=car_in.year,
            price_paise=car_in.price_paise,
            city=car_in.city,
            reg_no_hash="mock_hash",
            reg_no_masked="TN 09 ** 1234",
            mileage_km=car_in.mileage_km,
            fuel_type=car_in.fuel_type,
            transmission=car_in.transmission,
            status="draft",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        mock_repo_inst.create = AsyncMock(return_value=created_mock)

        service = ListingService(mock_session)
        service.listing_repo = mock_repo_inst

        listing = await service.create_listing(car_in, seller_user)
        assert listing.category == "cars"
        assert listing.reg_no_masked == "TN 09 ** 1234"
        assert listing.status == "draft"


@pytest.mark.asyncio
async def test_refuse_duplicate_active_listing_registration(seller_user):
    mock_session = AsyncMock()
    car_in = CarListingCreate(
        category="cars",
        title="2021 Hyundai i20 Asta",
        make="Hyundai",
        model="i20 Asta",
        year=2021,
        price_paise=85000000,
        city="Chennai",
        registration_no="TN-09-AB-1234",
        mileage_km=25000,
        fuel_type="petrol",
        transmission="manual",
    )

    with patch("app.services.listing.ListingRepository") as MockRepo:
        mock_repo_inst = MockRepo.return_value
        # Simulate active listing already exists
        existing_listing = Listing(id=uuid.uuid4(), status="live")
        mock_repo_inst.get_active_by_reg_no_hash = AsyncMock(return_value=existing_listing)

        service = ListingService(mock_session)
        service.listing_repo = mock_repo_inst

        with pytest.raises(ConflictError) as exc_info:
            await service.create_listing(car_in, seller_user)

        assert exc_info.value.code == "VEHICLE_ALREADY_LISTED"


@pytest.mark.asyncio
async def test_cycle_listing_restrictions(seller_user):
    """Verify that cycle schema forbids registration numbers or mileage."""
    with pytest.raises(ValueError):
        CycleListingCreate(
            category="cycles",
            title="Firefox Mountain Bike",
            make="Firefox",
            model="Target 29",
            year=2023,
            price_paise=1500000,
            city="Chennai",
            registration_no="TN09AB1234",  # Prohibited for cycles
        )


@pytest.mark.asyncio
async def test_locked_field_rule_on_update(seller_user):
    """Verify updating price & description succeeds while locked fields remain unchanged."""
    mock_session = AsyncMock()
    existing = Listing(
        id=uuid.uuid4(),
        seller_id=seller_user.id,
        category="cars",
        make="Maruti",
        model="Swift",
        year=2020,
        price_paise=60000000,
        city="Chennai",
        status="draft",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )

    with patch("app.services.listing.ListingRepository") as MockRepo:
        mock_repo_inst = MockRepo.return_value
        mock_repo_inst.get_by_id = AsyncMock(return_value=existing)

        service = ListingService(mock_session)
        service.listing_repo = mock_repo_inst

        update_in = ListingUpdate(price_paise=58000000, description="Price reduced for quick sale")
        updated = await service.update_listing(existing.id, update_in, seller_user)

        assert updated.price_paise == 58000000
        assert updated.description == "Price reduced for quick sale"
        assert updated.make == "Maruti"
        assert updated.year == 2020
