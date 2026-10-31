from datetime import date
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field, computed_field, model_validator


class InvoiceLineIn(BaseModel):
    description: str = Field(min_length=1, max_length=200)
    quantity: int = Field(gt=0)
    unit_price: Decimal = Field(ge=0, max_digits=12, decimal_places=2)
    tax_id: Optional[int] = None          # which tax rule applies, if any


class InvoiceCreate(BaseModel):
    subscription_id: int = Field(gt=0)
    customer_id: int = Field(gt=0)
    period_start: date
    period_end: date
    payment_terms_days: int = Field(default=30, ge=0, le=365)
    lines: list[InvoiceLineIn] = Field(min_length=1)

    @model_validator(mode="after")
    def check_period(self):
        if self.period_end < self.period_start:
            raise ValueError("period_end cannot be before period_start")
        return self


class InvoiceLineOut(BaseModel):
    id: int
    description: str
    quantity: int
    unit_price: Decimal
    tax_rate: Decimal
    amount: Decimal

    model_config = {"from_attributes": True}


class InvoiceOut(BaseModel):
    id: int
    number: str
    subscription_id: int
    customer_id: int
    status: str
    invoice_date: date
    due_date: date
    period_start: date
    period_end: date
    subtotal: Decimal
    discount_total: Decimal
    tax_total: Decimal
    total: Decimal
    amount_paid: Decimal
    lines: list[InvoiceLineOut] = []

    model_config = {"from_attributes": True}

    @computed_field
    @property
    def balance_due(self) -> Decimal:
        return self.total - self.amount_paid

    @computed_field
    @property
    def is_overdue(self) -> bool:
        return self.status == "CONFIRMED" and self.balance_due > 0 and self.due_date < date.today()