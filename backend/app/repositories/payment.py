import uuid
from datetime import datetime, timezone
from typing import List, Optional, Tuple
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models.payment import CreditNote, Invoice, Order, Payment
from app.db.models.user import User
from app.repositories.base import BaseRepository


class PaymentRepository(BaseRepository[Order]):
    """Repository handling SQL operations for orders, payments, sequential invoices, and credit notes."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Order, session)

    async def get_order_by_id(self, order_id: uuid.UUID) -> Optional[Order]:
        stmt = (
            select(Order)
            .where(Order.id == order_id)
            .options(selectinload(Order.invoice), selectinload(Order.payments))
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_order_by_razorpay_order_id(self, rzp_order_id: str) -> Optional[Order]:
        stmt = (
            select(Order)
            .where(Order.razorpay_order_id == rzp_order_id)
            .options(selectinload(Order.invoice), selectinload(Order.payments))
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_payment_by_razorpay_id(self, rzp_payment_id: str) -> Optional[Payment]:
        """Used for webhook idempotency check."""
        stmt = select(Payment).where(Payment.razorpay_payment_id == rzp_payment_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create_payment(
        self,
        order_id: uuid.UUID,
        amount_paise: int,
        fee_paise: int = 0,
        status: str = "captured",
        razorpay_payment_id: Optional[str] = None,
    ) -> Payment:
        payment = Payment(
            order_id=order_id,
            amount_paise=amount_paise,
            fee_paise=fee_paise,
            status=status,
            razorpay_payment_id=razorpay_payment_id,
        )
        self.session.add(payment)
        await self.session.flush()
        return payment

    async def generate_sequential_invoice(
        self,
        order_id: uuid.UUID,
        place_of_supply: str,
        cgst_paise: int,
        sgst_paise: int,
        igst_paise: int,
        gstin: Optional[str] = None,
    ) -> Invoice:
        """Generates an invoice with a sequential number (e.g. INV-202610-0001)."""
        now = datetime.now(timezone.utc)
        prefix = f"INV-{now.strftime('%Y%m')}"

        # Count invoices with this month's prefix to compute sequential number
        count_stmt = select(func.count(Invoice.id)).where(Invoice.invoice_no.like(f"{prefix}-%"))
        count_res = await self.session.execute(count_stmt)
        current_count = count_res.scalar() or 0
        seq_number = current_count + 1
        invoice_no = f"{prefix}-{seq_number:04d}"

        invoice = Invoice(
            order_id=order_id,
            invoice_no=invoice_no,
            gstin=gstin,
            place_of_supply=place_of_supply,
            cgst=cgst_paise,
            sgst=sgst_paise,
            igst=igst_paise,
        )
        self.session.add(invoice)
        await self.session.flush()
        return invoice

    async def get_invoice_by_id(self, invoice_id: uuid.UUID) -> Optional[Invoice]:
        stmt = (
            select(Invoice)
            .where(Invoice.id == invoice_id)
            .options(selectinload(Invoice.order))
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_monthly_invoices(self, month_str: str) -> List[Tuple[Invoice, Order, User]]:
        """
        Retrieves all invoices for a given month (format: 'YYYY-MM') for GSTR-1 and GSTR-3B CSV reporting.
        """
        # month_str e.g. '2026-10'
        year, month = month_str.split("-")
        y = int(year)
        m = int(month)

        stmt = (
            select(Invoice, Order, User)
            .join(Order, Invoice.order_id == Order.id)
            .join(User, Order.user_id == User.id)
            .where(
                func.extract("year", Invoice.created_at) == y,
                func.extract("month", Invoice.created_at) == m,
            )
            .order_by(Invoice.invoice_no.asc())
        )
        result = await self.session.execute(stmt)
        return list(result.all())
