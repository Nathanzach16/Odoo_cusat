from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import HTMLResponse
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


BILLING_PAGE = """<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>Billing</title>
<style>
body{font-family:system-ui,sans-serif;margin:0;background:#f6f7f9;color:#1f2937}
header{background:#1e3a5f;color:#fff;padding:14px 24px;font-size:18px;font-weight:600}
main{max-width:960px;margin:24px auto;padding:0 16px}
.card{background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:18px;margin-bottom:20px}
h2{font-size:16px;margin:0 0 12px}
table{width:100%;border-collapse:collapse;font-size:14px}
th,td{padding:8px;border-bottom:1px solid #eee;text-align:left}
.badge{padding:2px 8px;border-radius:10px;font-size:12px;background:#eef2f7}
.PAID{background:#dcfce7}.CONFIRMED{background:#dbeafe}.CANCELLED{background:#f3f4f6}.overdue{background:#fee2e2}
button{background:#1e3a5f;color:#fff;border:0;border-radius:6px;padding:6px 12px;cursor:pointer}
input,select{padding:7px;border:1px solid #ccc;border-radius:6px;margin-right:8px}
.err{color:#b91c1c;font-size:13px;margin-top:8px}.ok{color:#15803d;font-size:13px;margin-top:8px}
@media (max-width:640px){table{font-size:12px}input,select{width:100%;margin:4px 0}}
</style></head><body>
<header>Brightloop &middot; Billing</header>
<main>
<div class="card"><h2>Invoices</h2><table><thead><tr><th>Number</th><th>Customer</th><th>Status</th>
<th>Total</th><th>Balance</th><th>Due</th><th></th></tr></thead><tbody id="rows"></tbody></table></div>
<div class="card"><h2>Record a payment</h2>
<form id="pay"><input id="inv" type="number" min="1" placeholder="Invoice ID" required>
<select id="method"><option>UPI</option><option>CASH</option><option>CARD</option><option>BANK_TRANSFER</option></select>
<input id="amount" type="number" step="0.01" min="0.01" placeholder="Amount" required>
<input id="note" maxlength="255" placeholder="Note (optional)"><button>Save payment</button>
<div id="msg"></div></form></div>
</main>
<script>
async function load(){
  const res = await fetch('/invoices'); const list = await res.json();
  document.getElementById('rows').innerHTML = list.map(i => `<tr><td>${i.number}</td><td>#${i.customer_id}</td>
    <td><span class="badge ${i.is_overdue?'overdue':i.status}">${i.is_overdue?'OVERDUE':i.status}</span></td>
    <td>${i.total}</td><td>${i.balance_due}</td><td>${i.due_date}</td>
    <td>${i.status==='DRAFT'?`<button onclick="confirmInv(${i.id})">Confirm</button> `:''}
    <a href="/invoices/${i.id}/print" target="_blank">Print</a></td></tr>`).join('')
    || '<tr><td colspan="7">No invoices yet</td></tr>';
}
async function confirmInv(id){ await fetch(`/invoices/${id}/confirm`,{method:'POST'}); load(); }
document.getElementById('pay').onsubmit = async e => {
  e.preventDefault(); const msg = document.getElementById('msg');
  const body = {invoice_id:+inv.value, method:method.value, amount:amount.value, note:note.value||null};
  const res = await fetch('/payments',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const data = await res.json();
  if(res.ok){ msg.className='ok'; msg.textContent='Payment saved'; e.target.reset(); load(); }
  else { msg.className='err'; msg.textContent = typeof data.detail==='string' ? data.detail : data.detail.map(d=>d.msg).join(', '); }
};
load();
</script></body></html>"""


@router.get("/ui", response_class=HTMLResponse, include_in_schema=False)
def billing_page():
    """Billing screen: invoice list with confirm/print, and a record-payment form."""
    return BILLING_PAGE