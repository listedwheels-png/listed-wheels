import json
import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch
import pytest

from app.core.errors import UnauthorizedError
from app.db.models.listing import Listing
from app.db.models.payment import Invoice, Order, Payment, Plan
from app.db.models.promo import PromoCode
from app.db.models.user import User
from app.services.payment import PaymentService


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


@pytest.fixture
def car_listing(seller_user):
    return Listing(
        id=uuid.uuid4(),
        seller_id=seller_user.id,
        category="cars",
        title="2020 Swift",
        make="Maruti",
        model="Swift",
        year=2020,
        price_paise=50000000,
        city="Chennai",
        status="draft",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


@pytest.mark.asyncio
async def test_zero_total_promo_path_skips_razorpay(seller_user, car_listing):
    mock_session = AsyncMock()
    mock_session.add = MagicMock()
    car_plan = Plan(id=uuid.uuid4(), category="cars", base_fee_paise=199900, duration_days=365)
    free_promo = PromoCode(
        id=uuid.uuid4(),
        code_hash="mock_hash",
        type="percentage",
        value=100,
        is_active=True,
    )
    mock_invoice = Invoice(
        id=uuid.uuid4(),
        order_id=uuid.uuid4(),
        invoice_no="INV-202610-0001",
        place_of_supply="TN",
        cgst=0,
        sgst=0,
        igst=0,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )

    with patch("app.services.payment.ListingRepository") as MockListingRepo, \
         patch("app.services.payment.PlanRepository") as MockPlanRepo, \
         patch("app.services.payment.PromoRepository") as MockPromoRepo, \
         patch("app.services.payment.PaymentRepository") as MockPaymentRepo:

        mock_listing_repo = MockListingRepo.return_value
        mock_listing_repo.get_by_id = AsyncMock(return_value=car_listing)

        mock_plan_repo = MockPlanRepo.return_value
        mock_plan_repo.get_by_category = AsyncMock(return_value=car_plan)

        mock_promo_repo = MockPromoRepo.return_value
        mock_promo_repo.get_by_code = AsyncMock(return_value=free_promo)
        mock_promo_repo.record_redemption = AsyncMock()

        mock_payment_repo = MockPaymentRepo.return_value
        mock_payment_repo.generate_sequential_invoice = AsyncMock(return_value=mock_invoice)

        service = PaymentService(mock_session)
        service.listing_repo = mock_listing_repo
        service.plan_repo = mock_plan_repo
        service.promo_repo = mock_promo_repo
        service.payment_repo = mock_payment_repo

        order, rzp_order = await service.create_order(
            listing_id=car_listing.id,
            promo_code_str="FREE100",
            current_user=seller_user,
        )

        # Verified zero total path skipped Razorpay
        assert rzp_order is None
        assert order.status == "paid"
        assert order.total_paise == 0
        assert car_listing.status == "pending_verification"
        mock_payment_repo.generate_sequential_invoice.assert_called_once()
        mock_promo_repo.record_redemption.assert_called_once()


@pytest.mark.asyncio
async def test_webhook_idempotency_ignores_duplicates():
    """Verify that duplicate webhooks for the same payment are safely ignored."""
    mock_session = AsyncMock()
    existing_payment = Payment(id=uuid.uuid4(), razorpay_payment_id="pay_dup_123")

    with patch("app.services.payment.razorpay_client.verify_webhook_signature", return_value=True), \
         patch("app.services.payment.PaymentRepository") as MockPaymentRepo:

        mock_payment_repo = MockPaymentRepo.return_value
        mock_payment_repo.get_payment_by_razorpay_id = AsyncMock(return_value=existing_payment)

        service = PaymentService(mock_session)
        service.payment_repo = mock_payment_repo

        raw_payload = json.dumps({
            "event": "payment.captured",
            "payload": {"payment": {"entity": {"id": "pay_dup_123", "order_id": "order_rzp_123"}}}
        }).encode("utf-8")

        result = await service.process_razorpay_webhook(raw_payload, "valid_sig")
        assert result["status"] == "ignored_duplicate"
        assert result["payment_id"] == "pay_dup_123"


@pytest.mark.asyncio
async def test_webhook_invalid_signature_rejected():
    mock_session = AsyncMock()

    with patch("app.services.payment.razorpay_client.verify_webhook_signature", return_value=False):
        service = PaymentService(mock_session)

        with pytest.raises(UnauthorizedError) as exc_info:
            await service.process_razorpay_webhook(b'{"event":"test"}', "invalid_sig")

        assert exc_info.value.code == "INVALID_SIGNATURE"
