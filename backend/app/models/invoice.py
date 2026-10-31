from datetime import date
from sqlalchemy import Column, Integer, String, Numeric, Date, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base


class Invoice(Base):
    __tablename__ = "invoices"
    __table_args__ = (
        # One invoice per subscription per billing period -> nothing billed twice
        UniqueConstraint("subscription_id", "period_start", name="uq_invoice_sub_period"),
    )

    id = Column(Integer, primary_key=True, index=True)
    number = Column(String(20), unique=True, nullable=False)        # e.g. INV/2026/0001
    subscription_id = Column(Integer, nullable=False, index=True)   # Member 2's subscription
    customer_id = Column(Integer, nullable=False, index=True)       # Member 1's user
    status = Column(String(10), nullable=False, default="DRAFT", index=True)  # DRAFT, CONFIRMED, PAID, CANCELLED
    invoice_date = Column(Date, nullable=False, default=date.today)
    due_date = Column(Date, nullable=False, index=True)
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    subtotal = Column(Numeric(12, 2), nullable=False, default=0)
    discount_total = Column(Numeric(12, 2), nullable=False, default=0)
    tax_total = Column(Numeric(12, 2), nullable=False, default=0)
    total = Column(Numeric(12, 2), nullable=False, default=0)
    amount_paid = Column(Numeric(12, 2), nullable=False, default=0)

    lines = relationship("InvoiceLine", back_populates="invoice", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="invoice")


class InvoiceLine(Base):
    __tablename__ = "invoice_lines"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False, index=True)
    description = Column(String(200), nullable=False)    # product name
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(12, 2), nullable=False)
    tax_rate = Column(Numeric(5, 2), nullable=False, default=0)
    amount = Column(Numeric(12, 2), nullable=False)      # quantity x unit_price

    invoice = relationship("Invoice", back_populates="lines")