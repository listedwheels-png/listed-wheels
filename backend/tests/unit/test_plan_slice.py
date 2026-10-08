import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch
import pytest

from app.core.errors import BadRequestError, NotFoundError
from app.db.models.payment import Plan
from app.schemas.plan import PlanCreate, PlanResponse
from app.services.plan import PlanService


@pytest.mark.asyncio
async def test_plan_service_get_by_category_success():
    mock_session = AsyncMock()
    mock_plan = Plan(
        id=uuid.uuid4(),
        category="cars",
        base_fee_paise=199900,
        duration_days=365,
        is_active=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )

    with patch("app.services.plan.PlanRepository") as MockRepo:
        mock_repo_instance = MockRepo.return_value
        mock_repo_instance.get_by_category = AsyncMock(return_value=mock_plan)

        service = PlanService(mock_session)
        service.repo = mock_repo_instance

        plan = await service.get_plan_by_category("cars")
        assert plan.category == "cars"
        assert plan.base_fee_paise == 199900


@pytest.mark.asyncio
async def test_plan_service_invalid_category_raises_bad_request():
    mock_session = AsyncMock()
    service = PlanService(mock_session)

    with pytest.raises(BadRequestError) as exc_info:
        await service.get_plan_by_category("invalid_plane")

    assert exc_info.value.code == "INVALID_CATEGORY"


@pytest.mark.asyncio
async def test_plan_service_not_found_raises_domain_not_found():
    mock_session = AsyncMock()

    with patch("app.services.plan.PlanRepository") as MockRepo:
        mock_repo_instance = MockRepo.return_value
        mock_repo_instance.get_by_category = AsyncMock(return_value=None)

        service = PlanService(mock_session)
        service.repo = mock_repo_instance

        with pytest.raises(NotFoundError) as exc_info:
            await service.get_plan_by_category("cycles")

        assert exc_info.value.code == "PLAN_NOT_FOUND"


def test_plan_response_computed_inr():
    plan_resp = PlanResponse(
        id=uuid.uuid4(),
        category="cars",
        base_fee_paise=199900,
        duration_days=365,
        is_active=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    assert plan_resp.base_fee_inr == 1999.0
