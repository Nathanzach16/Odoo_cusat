from datetime import date
from sqlalchemy import Column, Integer, String, Numeric, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False, index=True)
    method = Column(String(20), nullable=False)          # CASH, CARD, BANK_TRANSFER, UPI
    amount = Column(Numeric(12, 2), nullable=False)
    payment_date = Column(Date, nullable=False, default=date.today)
    note = Column(String(255), nullable=True)            # optional

    invoice = relationship("Invoice", back_populates="payments")