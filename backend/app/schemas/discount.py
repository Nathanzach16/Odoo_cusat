from datetime import date
from decimal import Decimal
from typing import Optional, List, Literal
from pydantic import BaseModel, Field, model_validator, ConfigDict


# ==========================================
# DISCOUNT SCHEMAS
# ==========================================

class DiscountBase(BaseModel):
    code: str = Field(..., min_length=2, max_length=50, description="Unique discount code, e.g. SUMMER20")
    description: Optional[str] = Field(None, max_length=255)
    discount_type: Literal["FIXED", "PERCENTAGE"] = Field(..., description="Discount type: FIXED amount or PERCENTAGE")
    value: Decimal = Field(..., ge=0, description="Discount value (currency amount if FIXED, percentage 0-100 if PERCENTAGE)")
    min_purchase_amount: Optional[Decimal] = Field(None, ge=0, description="Minimum order subtotal to qualify")
    min_quantity: Optional[int] = Field(None, ge=1, description="Minimum order quantity to qualify")
    start_date: Optional[date] = Field(None, description="Start date of validity")
    end_date: Optional[date] = Field(None, description="End date of validity")
    max_uses: Optional[int] = Field(None, ge=1, description="Maximum total uses allowed (null for unlimited)")
    scope: Literal["SUBSCRIPTION", "PRODUCT"] = Field("SUBSCRIPTION", description="Scope of application")
    product_id: Optional[int] = Field(None, description="Required if scope is PRODUCT")
    is_active: bool = Field(True, description="Whether discount is currently active")

    @model_validator(mode="after")
    def validate_discount_fields(self):
        if self.discount_type == "PERCENTAGE" and self.value > Decimal("100.00"):
            raise ValueError("Percentage discount value cannot exceed 100%")
        if self.start_date and self.end_date and self.end_date < self.start_date:
            raise ValueError("end_date cannot be earlier than start_date")
        if self.scope == "PRODUCT" and self.product_id is None:
            raise ValueError("product_id is required when discount scope is PRODUCT")
        return self


class DiscountCreate(DiscountBase):
    pass


class DiscountUpdate(BaseModel):
    code: Optional[str] = Field(None, min_length=2, max_length=50)
    description: Optional[str] = Field(None, max_length=255)
    discount_type: Optional[Literal["FIXED", "PERCENTAGE"]] = None
    value: Optional[Decimal] = Field(None, ge=0)
    min_purchase_amount: Optional[Decimal] = Field(None, ge=0)
    min_quantity: Optional[int] = Field(None, ge=1)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    max_uses: Optional[int] = Field(None, ge=1)
    scope: Optional[Literal["SUBSCRIPTION", "PRODUCT"]] = None
    product_id: Optional[int] = None
    is_active: Optional[bool] = None

    @model_validator(mode="after")
    def validate_discount_update(self):
        if self.value is not None and self.value > Decimal("100.00") and self.discount_type == "PERCENTAGE":
            raise ValueError("Percentage discount value cannot exceed 100%")
        if self.start_date and self.end_date and self.end_date < self.start_date:
            raise ValueError("end_date cannot be earlier than start_date")
        return self


class DiscountResponse(DiscountBase):
    id: int
    used_count: int = Field(..., description="Number of times this discount has been redeemed")
    model_config = ConfigDict(from_attributes=True)


# ==========================================
# BILLING ENGINE LOOKUP CONTRACT (Member 3 Handoff)
# ==========================================

class DiscountLookupRequest(BaseModel):
    customer_id: Optional[int] = None
    subscription_id: Optional[int] = None
    subtotal: Decimal = Field(Decimal("0.00"), ge=0, description="Order / invoice subtotal")
    total_quantity: int = Field(0, ge=0, description="Total items / seats in subscription")
    product_ids: List[int] = Field(default_factory=list, description="IDs of products in the invoice / subscription lines")
    check_date: Optional[date] = Field(None, description="Date for eligibility check (defaults to today)")


class ApplicableDiscountItem(BaseModel):
    discount_id: int
    code: str
    discount_type: Literal["FIXED", "PERCENTAGE"]
    value: Decimal
    scope: Literal["SUBSCRIPTION", "PRODUCT"]
    product_id: Optional[int] = None
    calculated_discount_amount: Decimal = Field(..., ge=0, description="Calculated deduction for this discount")


class DiscountLookupResponse(BaseModel):
    eligible_discounts: List[ApplicableDiscountItem] = []
    total_discount_amount: Decimal = Field(Decimal("0.00"), ge=0, description="Total discount sum applicable")
