from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.invoice import Invoice
from app.models.payment import Payment
from app.schemas.invoice import InvoiceOut
from app.schemas.payment import PaymentCreate, PaymentOut

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post("", response_model=PaymentOut, status_code=status.HTTP_201_CREATED)
def record_payment(data: PaymentCreate, db: Session = Depends(get_db)):
    """Record money received against a CONFIRMED invoice; it turns PAID once fully paid."""
    invoice = db.get(Invoice, data.invoice_id)
    if invoice is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Invoice not found")
    if invoice.status != "CONFIRMED":
        raise HTTPException(status.HTTP_400_BAD_REQUEST,
                            f"Payments can only be recorded on CONFIRMED invoices (this one is {invoice.status})")
    balance = invoice.total - invoice.amount_paid
    if data.amount > balance:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Amount is more than the balance due ({balance})")

    payment = Payment(invoice_id=invoice.id, method=data.method, amount=data.amount,
                      payment_date=data.payment_date, note=data.note)
    invoice.amount_paid = invoice.amount_paid + data.amount
    if invoice.amount_paid == invoice.total:
        invoice.status = "PAID"
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


@router.get("", response_model=list[PaymentOut])
def list_payments(invoice_id: Optional[int] = None, db: Session = Depends(get_db)):
    """All payments, newest first, optionally for one invoice."""
    query = db.query(Payment)
    if invoice_id:
        query = query.filter(Payment.invoice_id == invoice_id)
    return query.order_by(Payment.payment_date.desc(), Payment.id.desc()).all()


@router.get("/outstanding", response_model=list[InvoiceOut])
def outstanding_invoices(overdue_only: bool = False, db: Session = Depends(get_db)):
    """Confirmed invoices that still have money owed; overdue_only=true keeps only those past their due date."""
    query = db.query(Invoice).filter(Invoice.status == "CONFIRMED", Invoice.amount_paid < Invoice.total)
    if overdue_only:
        query = query.filter(Invoice.due_date < date.today())
    return query.order_by(Invoice.due_date).all()