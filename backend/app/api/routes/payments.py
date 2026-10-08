import uuid
from typing import Any, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.db.models.user import User
from app.schemas.payment import (
    InvoiceResponse,
    OrderCreateRequest,
    OrderResponse,
    RazorpayPaymentOrder,
)
from app.services.payment import PaymentService

router = APIRouter()


@router.post(
    "/orders",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create order with server-side price and 18% GST calculation",
)
async def create_order(
    req: OrderCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    service = PaymentService(db)
    order, _ = await service.create_order(
        listing_id=req.listing_id,
        promo_code_str=req.promo_code,
        current_user=current_user,
    )
    return OrderResponse.model_validate(order)


@router.post(
    "/orders/{order_id}/pay",
    response_model=Optional[RazorpayPaymentOrder],
    summary="Initialize Razorpay payment order",
)
async def pay_order(
    order_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    service = PaymentService(db)
    order = await service.payment_repo.get_order_by_id(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.status == "paid":
        return None  # Zero-total promo already paid

    return RazorpayPaymentOrder(
        order_id=order.id,
        razorpay_order_id=order.razorpay_order_id or "order_rzp_mock",
        key_id=service.payment_repo.session.bind.url.host or "rzp_test_mock",
        amount_paise=order.total_paise,
    )


@router.post(
    "/webhooks/razorpay",
    summary="Razorpay signature-verified and idempotent webhook handler",
)
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
) -> Any:
    body = await request.body()
    if not x_razorpay_signature:
        raise HTTPException(status_code=400, detail="Missing X-Razorpay-Signature header")

    service = PaymentService(db)
    result = await service.process_razorpay_webhook(raw_body=body, signature=x_razorpay_signature)
    return result


@router.get(
    "/me/invoices/{invoice_id}",
    response_model=InvoiceResponse,
    summary="Get invoice details by ID",
)
async def get_invoice(
    invoice_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    service = PaymentService(db)
    invoice = await service.get_invoice(invoice_id, current_user)
    return InvoiceResponse.model_validate(invoice)
