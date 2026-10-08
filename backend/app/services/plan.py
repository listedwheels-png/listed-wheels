from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.errors import BadRequestError, NotFoundError
from app.core.i18n import t
from app.db.models.payment import Plan
from app.repositories.plan import PlanRepository
from app.schemas.plan import PlanCreate, PlanUpdate

ALLOWED_CATEGORIES = {"cycles", "bikes", "cars", "other"}


class PlanService:
    """Service handling business rules and validation for vehicle listing plans."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = PlanRepository(session)

    async def list_active_plans(self) -> List[Plan]:
        """Retrieves active plans."""
        return await self.repo.get_active_plans()

    async def get_plan_by_category(self, category: str) -> Plan:
        """Validates category and retrieves plan, raising domain NotFoundError if absent."""
        clean_cat = category.lower().strip()
        if clean_cat not in ALLOWED_CATEGORIES:
            raise BadRequestError(
                message=f"Invalid category '{category}'. Must be one of: {', '.join(sorted(ALLOWED_CATEGORIES))}",
                code="INVALID_CATEGORY",
            )

        plan = await self.repo.get_by_category(clean_cat)
        if not plan:
            raise NotFoundError(
                message=t("errors.PLAN_NOT_FOUND", category=clean_cat),
                code="PLAN_NOT_FOUND",
            )
        return plan

    async def create_plan(self, plan_in: PlanCreate) -> Plan:
        """Validates and creates a new plan."""
        clean_cat = plan_in.category.lower().strip()
        if clean_cat not in ALLOWED_CATEGORIES:
            raise BadRequestError(
                message=f"Invalid category '{plan_in.category}'. Allowed: {', '.join(sorted(ALLOWED_CATEGORIES))}",
                code="INVALID_CATEGORY",
            )

        existing = await self.repo.get_by_category(clean_cat)
        if existing:
            raise BadRequestError(
                message=f"A plan for category '{clean_cat}' already exists.",
                code="PLAN_ALREADY_EXISTS",
            )

        plan = Plan(
            category=clean_cat,
            base_fee_paise=plan_in.base_fee_paise,
            duration_days=plan_in.duration_days,
            is_active=plan_in.is_active,
        )
        created = await self.repo.create(plan)
        await self.session.commit()
        return created
