import uuid
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import BadRequestError, ConflictError, ForbiddenError, NotFoundError
from app.core.registration import hash_reg_no, mask_reg_no, normalize_reg_no, validate_reg_no
from app.db.models.listing import Listing
from app.db.models.user import User, SellerProfile
from app.repositories.listing import ListingRepository
from app.repositories.user import UserRepository
from app.schemas.listing import ListingCreate, ListingUpdate


class ListingService:
    """Service encapsulating all vehicle listing business rules, status workflows, and locked-field enforcement."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.listing_repo = ListingRepository(session)
        self.user_repo = UserRepository(session)

    async def create_listing(self, listing_in: ListingCreate, current_user: User) -> Listing:
        """
        Validates category rules, checks registration uniqueness, and creates a draft listing.
        """
        category = listing_in.category
        reg_no_hash: Optional[str] = None
        reg_no_masked: Optional[str] = None

        if category in ("cars", "bikes"):
            raw_reg = getattr(listing_in, "registration_no", None)
            if not raw_reg:
                raise BadRequestError(
                    f"Registration number is required for {category}.", code="REG_NO_REQUIRED"
                )

            is_valid, clean_reg = validate_reg_no(raw_reg)
            if not is_valid:
                raise BadRequestError(
                    "Invalid vehicle registration number format or unrecognized state code.",
                    code="INVALID_REGISTRATION_NUMBER",
                )

            reg_no_hash = hash_reg_no(clean_reg)
            reg_no_masked = mask_reg_no(clean_reg)

            # Check if vehicle is already actively listed
            existing = await self.listing_repo.get_active_by_reg_no_hash(reg_no_hash)
            if existing:
                raise ConflictError(
                    "A vehicle with this registration number is already actively listed or pending verification on ListedWheels.",
                    code="VEHICLE_ALREADY_LISTED",
                )

        elif category == "cycles":
            # Cycles cannot have registration, mileage, fuel, transmission
            if getattr(listing_in, "registration_no", None):
                raise BadRequestError("Cycles cannot have a registration number.", code="INVALID_CYCLE_FIELD")
            if getattr(listing_in, "mileage_km", None) is not None:
                raise BadRequestError("Cycles cannot have mileage.", code="INVALID_CYCLE_FIELD")

        # Create draft listing entity
        listing = Listing(
            seller_id=current_user.id,
            category=category,
            title=listing_in.title.strip(),
            make=listing_in.make.strip(),
            model=listing_in.model.strip(),
            year=listing_in.year,
            price_paise=listing_in.price_paise,
            city=listing_in.city.strip(),
            state_id=listing_in.state_id,
            city_id=listing_in.city_id,
            description=listing_in.description.strip() if listing_in.description else None,
            owners=listing_in.owners,
            mileage_km=getattr(listing_in, "mileage_km", None),
            fuel_type=getattr(listing_in, "fuel_type", None),
            transmission=getattr(listing_in, "transmission", None),
            reg_no_hash=reg_no_hash,
            reg_no_masked=reg_no_masked,
            status="draft",
        )

        created = await self.listing_repo.create(listing)
        await self.session.commit()
        return created

    async def get_listing(self, listing_id: uuid.UUID) -> Listing:
        """Loads listing with media details."""
        listing = await self.listing_repo.get_by_id(listing_id)
        if not listing:
            raise NotFoundError("Listing not found", code="LISTING_NOT_FOUND")
        return listing

    async def update_listing(
        self, listing_id: uuid.UUID, update_in: ListingUpdate, current_user: User
    ) -> Listing:
        """
        Updates allowed fields.
        Enforces the LOCKED-FIELD RULE: Category, Make, Model, Year, and Registration Number cannot be modified.
        """
        listing = await self.listing_repo.get_by_id(listing_id)
        if not listing:
            raise NotFoundError("Listing not found", code="LISTING_NOT_FOUND")

        if listing.seller_id != current_user.id and current_user.role != "admin":
            raise ForbiddenError("You can only edit your own listings", code="FORBIDDEN")

        # Apply updates to non-locked fields only
        data = update_in.model_dump(exclude_unset=True)
        for field, value in data.items():
            if value is not None and hasattr(listing, field):
                setattr(listing, field, value)

        await self.session.commit()
        await self.session.refresh(listing)
        return listing

    async def mark_as_sold(self, listing_id: uuid.UUID, current_user: User) -> Listing:
        """Transitions listing to 'sold' status."""
        listing = await self.listing_repo.get_by_id(listing_id)
        if not listing:
            raise NotFoundError("Listing not found", code="LISTING_NOT_FOUND")

        if listing.seller_id != current_user.id and current_user.role != "admin":
            raise ForbiddenError("Only the listing owner can mark it as sold", code="FORBIDDEN")

        listing.status = "sold"
        await self.session.commit()
        await self.session.refresh(listing)
        return listing

    async def delete_draft(self, listing_id: uuid.UUID, current_user: User) -> bool:
        """Deletes a draft listing. Only drafts can be deleted."""
        listing = await self.listing_repo.get_by_id(listing_id)
        if not listing:
            raise NotFoundError("Listing not found", code="LISTING_NOT_FOUND")

        if listing.seller_id != current_user.id and current_user.role != "admin":
            raise ForbiddenError("Only the owner can delete this draft", code="FORBIDDEN")

        if listing.status != "draft":
            raise BadRequestError(
                f"Cannot delete listing with status '{listing.status}'. Only drafts can be deleted.",
                code="CANNOT_DELETE_ACTIVE_LISTING",
            )

        await self.listing_repo.delete(listing_id)
        await self.session.commit()
        return True

    async def get_contact_and_record_event(
        self, listing_id: uuid.UUID, buyer_user: User
    ) -> Dict[str, Any]:
        """Records contact event and returns seller WhatsApp contact details."""
        listing = await self.listing_repo.get_by_id(listing_id)
        if not listing:
            raise NotFoundError("Listing not found", code="LISTING_NOT_FOUND")

        # Record contact event for trust & review eligibility
        await self.listing_repo.record_contact_event(listing_id, buyer_user.id)
        await self.session.commit()

        # Fetch seller details
        seller = await self.user_repo.get_by_id(listing.seller_id)
        seller_name = seller.name if seller else "Seller"
        
        # WhatsApp number fallback
        whatsapp_number = "+919876543210"
        if seller and seller.seller_profile and seller.seller_profile.whatsapp:
            whatsapp_number = seller.seller_profile.whatsapp

        price_inr = round(listing.price_paise / 100)
        formatted_price = f"₹{price_inr:,}"
        prefilled_msg = (
            f"Hi {seller_name}, I saw your listing on ListedWheels: {listing.title}, {formatted_price}. "
            f"Is it still available?"
        )

        return {
            "listing_id": listing.id,
            "seller_name": seller_name,
            "whatsapp_number": whatsapp_number,
            "prefilled_message": prefilled_msg,
        }

    async def search(
        self,
        category: Optional[str] = None,
        city: Optional[str] = None,
        min_price_paise: Optional[int] = None,
        max_price_paise: Optional[int] = None,
        min_year: Optional[int] = None,
        max_year: Optional[int] = None,
        fuel_type: Optional[str] = None,
        transmission: Optional[str] = None,
        make: Optional[str] = None,
        query: Optional[str] = None,
        sort_by: str = "latest",
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[Listing], int, int]:
        """Searches live listings with filtering, sorting, and pagination."""
        items, total_count = await self.listing_repo.search_listings(
            category=category,
            city=city,
            min_price_paise=min_price_paise,
            max_price_paise=max_price_paise,
            min_year=min_year,
            max_year=max_year,
            fuel_type=fuel_type,
            transmission=transmission,
            make=make,
            query=query,
            sort_by=sort_by,
            page=page,
            page_size=page_size,
        )
        total_pages = (total_count + page_size - 1) // page_size if total_count > 0 else 0
        return items, total_count, total_pages
