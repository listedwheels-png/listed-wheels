import csv
import io
import json
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession

from app.clients.razorpay import razorpay_client
from app.core.config import settings
from app.core.errors import BadRequestError, ForbiddenError, NotFoundError, UnauthorizedError
from app.core.logging import logger
from app.db.models.listing import Listing
from app.db.models.payment import Invoice, Order, Payment
from app.db.models.promo import PromoCode
from app.db.models.user import User
from app.repositories.admin import AdminRepository
from app.repositories.listing import ListingRepository
from app.repositories.payment import PaymentRepository
from app.repositories.plan import PlanRepository
from app.repositories.promo import PromoRepository
from app.repositories.user import UserRepository
from app.schemas.payment import RazorpayPaymentOrder
from app.services.pricing import calculate_pricing


class PaymentService:
    """
    Service coordinating order creation, integer paise pricing, Razorpay checkout,
    idempotent webhook verification, zero-total promo bypass, and sequential GST invoicing.
    """

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.payment_repo = PaymentRepository(session)
        self.listing_repo = ListingRepository(session)
        self.plan_repo = PlanRepository(session)
        self.promo_repo = PromoRepository(session)
        self.user_repo = UserRepository(session)
        self.admin_repo = AdminRepository(session)

    async def create_order(
        self, listing_id: uuid.UUID, promo_code_str: Optional[str], current_user: User
    ) -> Tuple[Order, Optional[RazorpayPaymentOrder]]:
        """
        Calculates server-side pricing, applies promo code (if valid), and initializes order.
        If total is zero (100% promo), skips Razorpay and immediately issues invoice.
        """
        listing = await self.listing_repo.get_by_id(listing_id)
        if not listing:
            raise NotFoundError("Listing not found", code="LISTING_NOT_FOUND")

        if listing.seller_id != current_user.id and current_user.role != "admin":
            raise ForbiddenError("Only the listing owner can initiate payment", code="FORBIDDEN")

        # 1. Fetch Plan base fee
        plan = await self.plan_repo.get_by_category(listing.category)
        if not plan:
            raise NotFoundError(f"Pricing plan for {listing.category} not found", code="PLAN_NOT_FOUND")

        base_fee_paise = plan.base_fee_paise

        # 2. Validate Promo (if provided)
        promo: Optional[PromoCode] = None
        promo_type: Optional[str] = None
        promo_val: Optional[int] = None

        if promo_code_str:
            clean_code = promo_code_str.upper().strip()
            promo = await self.promo_repo.get_by_code(clean_code)
            if not promo or not promo.is_active:
                raise BadRequestError("The promo code is invalid or has expired.", code="PROMO_INVALID")

            now = datetime.now(timezone.utc)
            if promo.expires_at and promo.expires_at < now:
                raise BadRequestError("The promo code has expired.", code="PROMO_EXPIRED")

            if promo.max_uses is not None and promo.used_count >= promo.max_uses:
                raise BadRequestError("The promo code has reached its maximum uses.", code="PROMO_MAX_USES")

            if promo.category and promo.category.lower() != listing.category.lower():
                raise BadRequestError(
                    f"Promo code is only valid for {promo.category} listings.", code="PROMO_CATEGORY_MISMATCH"
                )

            if promo.locked_user_id and promo.locked_user_id != current_user.id:
                raise BadRequestError("Promo code is not applicable to this account.", code="PROMO_USER_LOCKED")

            promo_type = promo.type
            promo_val = promo.value

        # 3. Calculate Pricing with Place of Supply rule (Tamil Nadu = CGST+SGST, others = IGST)
        seller_state_code = "TN"  # Default launch state
        if current_user.seller_profile and current_user.seller_profile.state_id:
            # Look up state code if configured
            pass

        breakdown = calculate_pricing(
            base_fee_paise=base_fee_paise,
            promo_type=promo_type,
            promo_value=promo_val,
            seller_state_code=seller_state_code,
            platform_state_code="TN",
        )

        # 4. Create Order Record
        order = Order(
            listing_id=listing.id,
            user_id=current_user.id,
            base_paise=breakdown.base_paise,
            discount_paise=breakdown.discount_paise,
            gst_paise=breakdown.gst_total_paise,
            total_paise=breakdown.total_paise,
            promo_id=promo.id if promo else None,
            status="created",
        )
        self.session.add(order)
        await self.session.flush()

        # 5. Handle Zero-Total Path (100% Promo)
        if breakdown.total_paise == 0:
            order.status = "paid"

            # Create Zero-Value Invoice
            invoice = await self.payment_repo.generate_sequential_invoice(
                order_id=order.id,
                place_of_supply=seller_state_code,
                cgst_paise=breakdown.cgst_paise,
                sgst_paise=breakdown.sgst_paise,
                igst_paise=breakdown.igst_paise,
            )

            # Record Promo Redemption
            if promo:
                await self.promo_repo.record_redemption(
                    promo_id=promo.id,
                    user_id=current_user.id,
                    listing_id=listing.id,
                )

            # Advance listing status to pending_verification
            listing.status = "pending_verification"

            await self.session.commit()
            await self.session.refresh(order)
            return order, None

        # 6. Paid Path: Initialize Razorpay Order
        rzp_order = razorpay_client.create_order(
            amount_paise=breakdown.total_paise,
            receipt=str(order.id),
        )
        order.razorpay_order_id = rzp_order["id"]
        listing.status = "pending_payment"

        await self.session.commit()
        await self.session.refresh(order)

        rzp_payment_order = RazorpayPaymentOrder(
            order_id=order.id,
            razorpay_order_id=rzp_order["id"],
            key_id=razorpay_client.key_id or "rzp_test_mock",
            amount_paise=breakdown.total_paise,
            currency="INR",
        )
        return order, rzp_payment_order

    async def process_razorpay_webhook(self, raw_body: bytes, signature: str) -> Dict[str, Any]:
        """
        Processes Razorpay webhook payload with HMAC-SHA256 signature verification and idempotency.
        """
        # 1. Verify Signature
        if not razorpay_client.verify_webhook_signature(raw_body, signature):
            raise UnauthorizedError("Invalid Razorpay webhook signature", code="INVALID_SIGNATURE")

        try:
            event_data = json.loads(raw_body.decode("utf-8"))
        except Exception:
            raise BadRequestError("Malformed JSON webhook body", code="MALFORMED_JSON")

        event = event_data.get("event")
        payload = event_data.get("payload", {})
        payment_entity = payload.get("payment", {}).get("entity", {})
        rzp_payment_id = payment_entity.get("id")
        rzp_order_id = payment_entity.get("order_id")
        amount_paise = payment_entity.get("amount", 0)
        fee_paise = payment_entity.get("fee", 0)

        # 2. Idempotency Check: Keyed on razorpay_payment_id
        if rzp_payment_id:
            existing_payment = await self.payment_repo.get_payment_by_razorpay_id(rzp_payment_id)
            if existing_payment:
                logger.info(f"Duplicate webhook ignored for payment {rzp_payment_id}")
                return {"status": "ignored_duplicate", "payment_id": rzp_payment_id}

        # 3. Find Matching Order
        order: Optional[Order] = None
        if rzp_order_id:
            order = await self.payment_repo.get_order_by_razorpay_order_id(rzp_order_id)

        if not order:
            logger.warning(f"Order not found for Razorpay order ID {rzp_order_id}")
            return {"status": "order_not_found"}

        if event in ("payment.captured", "order.paid"):
            # Create Payment Record
            payment = await self.payment_repo.create_payment(
                order_id=order.id,
                amount_paise=amount_paise or order.total_paise,
                fee_paise=fee_paise,
                status="captured",
                razorpay_payment_id=rzp_payment_id,
            )

            order.status = "paid"

            # Create Sequential Invoice with GST split
            breakdown = calculate_pricing(
                base_fee_paise=order.base_paise,
                promo_type="flat",
                promo_value=order.discount_paise,
                seller_state_code="TN",
                platform_state_code="TN",
            )

            invoice = await self.payment_repo.generate_sequential_invoice(
                order_id=order.id,
                place_of_supply="TN",
                cgst_paise=breakdown.cgst_paise,
                sgst_paise=breakdown.sgst_paise,
                igst_paise=breakdown.igst_paise,
            )

            # Record Promo Redemption if applicable
            if order.promo_id:
                await self.promo_repo.record_redemption(
                    promo_id=order.promo_id,
                    user_id=order.user_id,
                    listing_id=order.listing_id,
                )

            # Advance listing to pending_verification
            listing = await self.listing_repo.get_by_id(order.listing_id)
            if listing:
                listing.status = "pending_verification"

            # Audit log
            await self.admin_repo.log_action(
                admin_id=order.user_id,
                action="PAYMENT_CAPTURED",
                entity="order",
                entity_id=order.id,
                reason=f"Razorpay payment captured: {rzp_payment_id}",
            )

            await self.session.commit()
            logger.info(f"Payment {rzp_payment_id} captured successfully for order {order.id}")
            return {"status": "processed", "order_id": str(order.id), "invoice_no": invoice.invoice_no}

        return {"status": "unhandled_event", "event": event}

    async def get_invoice(self, invoice_id: uuid.UUID, current_user: User) -> Invoice:
        """Loads invoice ensuring user ownership or admin rights."""
        invoice = await self.payment_repo.get_invoice_by_id(invoice_id)
        if not invoice:
            raise NotFoundError("Invoice not found", code="INVOICE_NOT_FOUND")

        if invoice.order.user_id != current_user.id and current_user.role != "admin":
            raise ForbiddenError("Access to this invoice is forbidden", code="FORBIDDEN")

        return invoice

    async def export_gst_csv(self, month_str: str) -> str:
        """
        Generates standard CSV export for Indian GST compliance (GSTR-1 and GSTR-3B).
        Columns: Invoice Number, Date, Customer Name, GSTIN, Place of Supply, Taxable Value, CGST, SGST, IGST, Total Value.
        """
        records = await self.payment_repo.get_monthly_invoices(month_str)

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "Invoice Number",
            "Invoice Date",
            "Customer Name",
            "Customer GSTIN",
            "Place of Supply",
            "Taxable Amount (INR)",
            "CGST (INR)",
            "SGST (INR)",
            "IGST (INR)",
            "Total Invoice Value (INR)",
        ])

        for inv, ord_rec, usr in records:
            taxable_inr = round((ord_rec.base_paise - ord_rec.discount_paise) / 100, 2)
            cgst_inr = round(inv.cgst / 100, 2)
            sgst_inr = round(inv.sgst / 100, 2)
            igst_inr = round(inv.igst / 100, 2)
            total_inr = round(ord_rec.total_paise / 100, 2)

            writer.writerow([
                inv.invoice_no,
                inv.created_at.strftime("%Y-%m-%d"),
                usr.name,
                inv.gstin or "URP",
                inv.place_of_supply,
                f"{taxable_inr:.2f}",
                f"{cgst_inr:.2f}",
                f"{sgst_inr:.2f}",
                f"{igst_inr:.2f}",
                f"{total_inr:.2f}",
            ])

        return output.getvalue()
