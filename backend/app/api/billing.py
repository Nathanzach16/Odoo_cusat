from datetime import date, timedelta
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
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