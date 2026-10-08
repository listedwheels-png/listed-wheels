from typing import Any
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.db.models.user import User
from app.schemas.promo import PromoValidateRequest, PromoValidateResponse
from app.services.promo import PromoService

router = APIRouter()


@router.post(
    "/validate",
    response_model=PromoValidateResponse,
    summary="Validate promo code and calculate estimated discount",
)
async def validate_promo(
    req: PromoValidateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    service = PromoService(db)
    promo = await service.validate_promo(
        code=req.code, category=req.category, user_id=current_user.id
    )
    return PromoValidateResponse(
        valid=True,
        code=promo.code_display or req.code.upper(),
        type=promo.type,
        value=promo.value,
        discount_paise_estimate=promo.value if promo.type == "flat" else 0,
        requires_video=promo.requires_video,
    )
