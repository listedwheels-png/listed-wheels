import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models.user import SellerProfile, User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    """Repository executing parameterized SQL queries for the users and seller_profiles tables."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(User, session)

    async def get_by_id(self, user_id: uuid.UUID) -> Optional[User]:
        stmt = (
            select(User)
            .where(User.id == user_id)
            .options(selectinload(User.seller_profile))
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> Optional[User]:
        stmt = (
            select(User)
            .where(User.email == email.lower().strip())
            .options(selectinload(User.seller_profile))
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_google_sub(self, google_sub: str) -> Optional[User]:
        stmt = (
            select(User)
            .where(User.google_sub == google_sub)
            .options(selectinload(User.seller_profile))
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create_user(
        self,
        email: str,
        name: str,
        google_sub: Optional[str] = None,
        role: str = "buyer",
        status: str = "active",
        tos_version: Optional[str] = None,
        tos_accepted_at: Optional[datetime] = None,
    ) -> User:
        user = User(
            email=email.lower().strip(),
            name=name.strip(),
            google_sub=google_sub,
            role=role,
            status=status,
            tos_version=tos_version,
            tos_accepted_at=tos_accepted_at,
        )
        return await self.create(user)

    async def update_tos_consent(self, user_id: uuid.UUID, tos_version: str) -> Optional[User]:
        now = datetime.now(timezone.utc)
        stmt = (
            update(User)
            .where(User.id == user_id)
            .values(tos_version=tos_version, tos_accepted_at=now)
            .returning(User)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def link_google_sub(self, user_id: uuid.UUID, google_sub: str) -> Optional[User]:
        stmt = (
            update(User)
            .where(User.id == user_id)
            .values(google_sub=google_sub)
            .returning(User)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def update_status(self, user_id: uuid.UUID, status: str) -> Optional[User]:
        stmt = (
            update(User)
            .where(User.id == user_id)
            .values(status=status)
            .returning(User)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_seller_profile(self, user_id: uuid.UUID) -> Optional[SellerProfile]:
        stmt = select(SellerProfile).where(SellerProfile.user_id == user_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def upsert_seller_profile(
        self,
        user_id: uuid.UUID,
        type: str = "individual",
        shop_name: Optional[str] = None,
        gst_no: Optional[str] = None,
        maps_link: Optional[str] = None,
        whatsapp: Optional[str] = None,
        state_id: Optional[uuid.UUID] = None,
        city_id: Optional[uuid.UUID] = None,
    ) -> SellerProfile:
        profile = await self.get_seller_profile(user_id)
        if profile:
            profile.type = type
            profile.shop_name = shop_name
            profile.gst_no = gst_no
            profile.maps_link = maps_link
            profile.whatsapp = whatsapp
            profile.state_id = state_id
            profile.city_id = city_id
            await self.session.flush()
            await self.session.refresh(profile)
            return profile
        else:
            profile = SellerProfile(
                user_id=user_id,
                type=type,
                shop_name=shop_name,
                gst_no=gst_no,
                maps_link=maps_link,
                whatsapp=whatsapp,
                state_id=state_id,
                city_id=city_id,
            )
            self.session.add(profile)
            await self.session.flush()
            await self.session.refresh(profile)
            return profile
