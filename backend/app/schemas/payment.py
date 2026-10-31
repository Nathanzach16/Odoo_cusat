from datetime import date
from decimal import Decimal
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator


class PaymentCreate(BaseModel):
    invoice_id: int = Field(gt=0)
    method: Literal["CASH", "CARD", "BANK_TRANSFER", "UPI"]
    amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    payment_date: date = Field(default_factory=date.today)
    note: Optional[str] = Field(default=None, max_length=255)

    @field_validator("payment_date")
    @classmethod
    def not_in_future(cls, value: date) -> date:
        if value > date.today():
            raise ValueError("payment_date cannot be in the future")
        return value


class PaymentOut(BaseModel):
    id: int
    invoice_id: int
    method: str
    amount: Decimal
    payment_date: date
    note: Optional[str]

    model_config = {"from_attributes": True}