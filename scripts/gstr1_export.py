"""CLI tool to generate GSTR-1 CSV report from database for monthly tax compliance."""
import argparse
import asyncio
import csv
import sys
from datetime import datetime, timezone
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from sqlalchemy import select, and_, extract
from app.db.session import AsyncSessionLocal
from app.db.models.payment import Invoice, Order


async def export_gstr1(year: int, month: int, output_file: str) -> None:
    print(f"[*] Generating GSTR-1 report for {month:02d}/{year}...")

    async with AsyncSessionLocal() as session:
        stmt = (
            select(Invoice, Order)
            .join(Order, Invoice.order_id == Order.id)
            .where(
                and_(
                    extract("year", Invoice.created_at) == year,
                    extract("month", Invoice.created_at) == month,
                )
            )
            .order_by(Invoice.invoice_no.asc())
        )
        result = await session.execute(stmt)
        rows = result.all()

        total_invoices = len(rows)
        print(f"[*] Found {total_invoices} invoices.")

        with open(output_file, mode="w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow([
                "Invoice Number",
                "Invoice Date",
                "Place of Supply",
                "Taxable Value (INR)",
                "CGST Rate",
                "CGST Amount (INR)",
                "SGST Rate",
                "SGST Amount (INR)",
                "IGST Rate",
                "IGST Amount (INR)",
                "Total Invoice Value (INR)",
                "Order Status",
            ])

            total_taxable_paise = 0
            total_tax_paise = 0

            for inv, ord_obj in rows:
                taxable_inr = (ord_obj.base_paise - ord_obj.discount_paise) / 100
                cgst_inr = inv.cgst / 100
                sgst_inr = inv.sgst / 100
                igst_inr = inv.igst / 100
                total_inr = ord_obj.total_paise / 100

                total_taxable_paise += (ord_obj.base_paise - ord_obj.discount_paise)
                total_tax_paise += (inv.cgst + inv.sgst + inv.igst)

                writer.writerow([
                    inv.invoice_no,
                    inv.created_at.strftime("%Y-%m-%d"),
                    inv.place_of_supply,
                    f"{taxable_inr:.2f}",
                    "9%" if inv.cgst > 0 else "0%",
                    f"{cgst_inr:.2f}",
                    "9%" if inv.sgst > 0 else "0%",
                    f"{sgst_inr:.2f}",
                    "18%" if inv.igst > 0 else "0%",
                    f"{igst_inr:.2f}",
                    f"{total_inr:.2f}",
                    ord_obj.status,
                ])

        print(f"[+] GSTR-1 CSV exported successfully: {output_file}")
        print(f"    Total Taxable: ₹{total_taxable_paise/100:,.2f}")
        print(f"    Total GST:     ₹{total_tax_paise/100:,.2f}")


def main():
    parser = argparse.ArgumentParser(description="Export monthly GSTR-1 CSV for ListedWheels")
    now = datetime.now()
    parser.add_argument("--year", type=int, default=now.year, help="Filing Year (e.g. 2026)")
    parser.add_argument("--month", type=int, default=now.month, help="Filing Month (1-12)")
    parser.add_argument("--out", type=str, default="", help="Output CSV path")
    args = parser.parse_args()

    out_path = args.out or f"GSTR1_{args.year}_{args.month:02d}.csv"
    asyncio.run(export_gstr1(args.year, args.month, out_path))


if __name__ == "__main__":
    main()
