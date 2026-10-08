from typing import Any, List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_admin
from app.schemas.plan import PlanCreate, PlanResponse
from app.services.plan import PlanService

router = APIRouter()


@router.get(
    "",
    response_model=List[PlanResponse],
    summary="List all active listing plans",
    description="Returns pricing plans for Cycles, Bikes, Cars, and Other vehicles in integer paise and INR.",
)
async def list_plans(db: AsyncSession = Depends(get_db)) -> Any:
    service = PlanService(db)
    return await service.list_active_plans()


@router.get(
    "/{category}",
    response_model=PlanResponse,
    summary="Get plan by category",
    description="Retrieves the active plan for a specific vehicle category (e.g. cars, bikes, cycles).",
)
async def get_plan(category: str, db: AsyncSession = Depends(get_db)) -> Any:
    service = PlanService(db)
    return await service.get_plan_by_category(category)


@router.post(
    "",
    response_model=PlanResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new plan (Admin only)",
    description="Creates a new vehicle listing plan. Enforces administrator privileges.",
)
async def create_plan(
    plan_in: PlanCreate,
    admin_user: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> Any:
    service = PlanService(db)
    return await service.create_plan(plan_in)
