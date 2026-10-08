import uuid
from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock, patch
import pytest

from app.core.errors import BadRequestError
from app.db.models.promo import PromoCode
from app.services.promo import PromoService, hash_promo_code


@pytest.mark.asyncio
async def test_promo_service_validate_active_success():
    mock_session = AsyncMock()
    valid_promo = PromoCode(
        id=uuid.uuid4(),
        code_hash=hash_promo_code("LAUNCH200"),
        code_display="LAUNCH200",
        type="flat",
        value=20000,
        category="cars",
        max_uses=100,
        used_count=10,
        expires_at=datetime.now(timezone.utc) + timedelta(days=30),
        is_active=True,
    )

    with patch("app.services.promo.PromoRepository") as MockRepo:
        mock_repo_inst = MockRepo.return_value
        mock_repo_inst.get_by_code = AsyncMock(return_value=valid_promo)

        service = PromoService(mock_session)
        service.promo_repo = mock_repo_inst

        result = await service.validate_promo("launch200", "cars")
        assert result.code_display == "LAUNCH200"
        assert result.value == 20000


@pytest.mark.asyncio
async def test_promo_service_expired_rejected():
    mock_session = AsyncMock()
    expired_promo = PromoCode(
        id=uuid.uuid4(),
        code_hash=hash_promo_code("EXPIREDCODE"),
        type="flat",
        value=10000,
        expires_at=datetime.now(timezone.utc) - timedelta(days=1),
        is_active=True,
    )

    with patch("app.services.promo.PromoRepository") as MockRepo:
        mock_repo_inst = MockRepo.return_value
        mock_repo_inst.get_by_code = AsyncMock(return_value=expired_promo)

        service = PromoService(mock_session)
        service.promo_repo = mock_repo_inst

        with pytest.raises(BadRequestError) as exc_info:
            await service.validate_promo("EXPIREDCODE", "cars")

        assert exc_info.value.code == "PROMO_EXPIRED"
