from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models.payment import Plan
from app.repositories.base import BaseRepository


class PlanRepository(BaseRepository[Plan]):
    """Repository handling SQL queries for the plans table."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Plan, session)

    async def get_active_plans(self) -> List[Plan]:
        """Returns all currently active listing plans."""
        stmt = select(Plan).where(Plan.is_active.is_(True)).order_by(Plan.base_fee_paise.asc())
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_by_category(self, category: str) -> Optional[Plan]:
        """Returns a plan by vehicle category (e.g. cars, bikes, cycles)."""
        stmt = select(Plan).where(Plan.category == category.lower())
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
