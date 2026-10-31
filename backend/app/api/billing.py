from datetime import date, timedelta
from decimal import Decimal
from html import escape
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import HTMLResponse
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models.invoice import Invoice, InvoiceLine
from app.models.tax import Tax
from app.schemas.invoice import InvoiceCreate, InvoiceOut
from app.services.tax_calculator import line_totals, money

router = APIRouter(prefix="/invoices", tags=["Invoices"])


def next_invoice_number(db: Session) -> str:
    """INV/2026/0001, INV/2026/0002, ... one sequence per year."""
    year = date.today().year
    count = db.query(Invoice).filter(Invoice.number.like(f"INV/{year}/%")).count()
    return f"INV/{year}/{count + 1:04d}"


def get_invoice_or_404(db: Session, invoice_id: int) -> Invoice:
    invoice = db.get(Invoice, invoice_id)
    if invoice is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Invoice not found")
    return invoice


@router.post("", response_model=InvoiceOut, status_code=status.HTTP_201_CREATED)
def create_invoice(data: InvoiceCreate, db: Session = Depends(get_db)):
    """Create a DRAFT invoice for one subscription and period; taxes are calculated automatically."""
    invoice = Invoice(
        number=next_invoice_number(db),
        subscription_id=data.subscription_id,
        customer_id=data.customer_id,
        status="DRAFT",
        due_date=date.today() + timedelta(days=data.payment_terms_days),
        period_start=data.period_start,
        period_end=data.period_end,
    )
    subtotal = tax_total = Decimal("0")
    for line in data.lines:
        rate = Decimal("0")
        if line.tax_id is not None:
            tax = db.get(Tax, line.tax_id)
            if tax is None or not tax.is_active:
                raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Tax {line.tax_id} does not exist or is inactive")
            rate = tax.rate
        amount, tax_amount = line_totals(line.quantity, line.unit_price, rate)
        subtotal += amount
        tax_total += tax_amount
        invoice.lines.append(InvoiceLine(description=line.description, quantity=line.quantity,
                                         unit_price=line.unit_price, tax_rate=rate, amount=amount))
    invoice.subtotal = money(subtotal)
    invoice.tax_total = money(tax_total)
    invoice.total = money(subtotal + tax_total)   # discounts get subtracted here later
    db.add(invoice)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT,
                            "This subscription already has an invoice for that period (no double billing)")
    db.refresh(invoice)
    return invoice


@router.get("", response_model=list[InvoiceOut])
def list_invoices(status_filter: Optional[str] = None, customer_id: Optional[int] = None,
                  db: Session = Depends(get_db)):
    """List invoices, newest first. Filter by status (DRAFT, CONFIRMED, PAID, CANCELLED) or customer."""
    query = db.query(Invoice).options(selectinload(Invoice.lines))
    if status_filter:
        query = query.filter(Invoice.status == status_filter.upper())
    if customer_id:
        query = query.filter(Invoice.customer_id == customer_id)
    return query.order_by(Invoice.id.desc()).all()


@router.get("/{invoice_id}", response_model=InvoiceOut)
def get_invoice(invoice_id: int, db: Session = Depends(get_db)):
    return get_invoice_or_404(db, invoice_id)


@router.post("/{invoice_id}/confirm", response_model=InvoiceOut)
def confirm_invoice(invoice_id: int, db: Session = Depends(get_db)):
    """DRAFT -> CONFIRMED: the invoice is final and now owed."""
    invoice = get_invoice_or_404(db, invoice_id)
    if invoice.status != "DRAFT":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Only DRAFT invoices can be confirmed (this one is {invoice.status})")
    invoice.status = "CONFIRMED"
    db.commit()
    db.refresh(invoice)
    return invoice


@router.post("/{invoice_id}/cancel", response_model=InvoiceOut)
def cancel_invoice(invoice_id: int, db: Session = Depends(get_db)):
    """DRAFT or CONFIRMED -> CANCELLED, only if nothing has been paid yet."""
    invoice = get_invoice_or_404(db, invoice_id)
    if invoice.status not in ("DRAFT", "CONFIRMED"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"A {invoice.status} invoice cannot be cancelled")
    if invoice.amount_paid > 0:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invoice has payments recorded; it cannot be cancelled")
    invoice.status = "CANCELLED"
    db.commit()
    db.refresh(invoice)
    return invoice


@router.post("/{invoice_id}/send")
def send_invoice(invoice_id: int, db: Session = Depends(get_db)):
    """Send a CONFIRMED or PAID invoice to the customer (simulated: no real email yet)."""
    invoice = get_invoice_or_404(db, invoice_id)
    if invoice.status not in ("CONFIRMED", "PAID"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Confirm the invoice before sending it (this one is {invoice.status})")
    return {"message": f"Invoice {invoice.number} sent to customer {invoice.customer_id}",
            "print_url": f"/invoices/{invoice.id}/print"}


@router.get("/{invoice_id}/print", response_class=HTMLResponse)
def print_invoice(invoice_id: int, db: Session = Depends(get_db)):
    """A printable invoice page: open it in the browser and press Cmd + P."""
    inv = get_invoice_or_404(db, invoice_id)
    rows = "".join(
        f"<tr><td>{escape(l.description)}</td><td>{l.quantity}</td><td>{l.unit_price}</td>"
        f"<td>{l.tax_rate}%</td><td>{l.amount}</td></tr>"
        for l in inv.lines
    )
    return f"""<!doctype html><html><head><meta charset="utf-8"><title>{inv.number}</title>
<style>body{{font-family:system-ui,sans-serif;max-width:720px;margin:40px auto;color:#222}}
table{{width:100%;border-collapse:collapse;margin:24px 0}}th,td{{padding:8px;border-bottom:1px solid #ddd;text-align:left}}
.right{{text-align:right}}.status{{padding:2px 8px;border:1px solid #888;border-radius:4px}}</style></head><body>
<h1>Brightloop Software</h1>
<p><strong>Invoice {inv.number}</strong> <span class="status">{inv.status}</span></p>
<p>Customer #{inv.customer_id} &middot; Subscription #{inv.subscription_id}<br>
Period {inv.period_start} to {inv.period_end} &middot; Issued {inv.invoice_date} &middot; Due {inv.due_date}</p>
<table><tr><th>Product</th><th>Qty</th><th>Unit price</th><th>Tax</th><th>Amount</th></tr>{rows}</table>
<p class="right">Subtotal: {inv.subtotal}<br>Discount: {inv.discount_total}<br>Tax: {inv.tax_total}<br>
<strong>Total: {inv.total}</strong><br>Paid: {inv.amount_paid}<br><strong>Balance due: {inv.total - inv.amount_paid}</strong></p>
</body></html>"""