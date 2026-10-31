from decimal import Decimal
from pydantic import BaseModel, Field


class TaxCreate(BaseModel):
    name: str = Field(min_length=2, max_length=50)
    rate: Decimal = Field(gt=0, le=100, max_digits=5, decimal_places=2)


class TaxOut(BaseModel):
    id: int
    name: str
    rate: Decimal
    is_active: bool

    model_config = {"from_attributes": True}