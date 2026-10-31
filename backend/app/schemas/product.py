from datetime import date
from decimal import Decimal
from typing import Optional, List, Literal
from pydantic import BaseModel, Field, model_validator, ConfigDict


# ==========================================
# PRODUCT SCHEMAS
# ==========================================

class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Product name")
    product_type: str = Field("SERVICE", max_length=50, description="Product type (e.g. SERVICE, SOFTWARE, GOODS)")
    sales_price: Decimal = Field(..., ge=0, description="Sales price must be non-negative")
    cost_price: Decimal = Field(Decimal("0.00"), ge=0, description="Cost price must be non-negative")
    notes: Optional[str] = Field(None, max_length=500, description="Internal notes")
    is_active: bool = Field(True, description="Whether product is active")


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    product_type: Optional[str] = Field(None, max_length=50)
    sales_price: Optional[Decimal] = Field(None, ge=0)
    cost_price: Optional[Decimal] = Field(None, ge=0)
    notes: Optional[str] = Field(None, max_length=500)
    is_active: Optional[bool] = None


class ProductResponse(ProductBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


# ==========================================
# VARIANT SCHEMAS
# ==========================================

class VariantBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Variant name")
    sku: Optional[str] = Field(None, max_length=50, description="Optional SKU")
    brand: Optional[str] = Field(None, max_length=100, description="Brand name, e.g. Odoo")
    price_extra: Decimal = Field(Decimal("0.00"), description="Additional price adjustment (can be positive or negative)")
    is_active: bool = Field(True, description="Whether variant is active")


class VariantCreate(VariantBase):
    pass


class VariantUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    sku: Optional[str] = Field(None, max_length=50)
    brand: Optional[str] = Field(None, max_length=100)
    price_extra: Optional[Decimal] = None
    is_active: Optional[bool] = None


class VariantResponse(VariantBase):
    id: int
    product_id: int
    calculated_price: Optional[Decimal] = Field(None, description="Price including brand adjustment (+560 for Odoo) and price_extra")
    model_config = ConfigDict(from_attributes=True)


class ProductDetailResponse(ProductResponse):
    variants: List[VariantResponse] = []


# ==========================================
# SUBSCRIPTION PLAN SCHEMAS
# ==========================================

class PlanBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    billing_period: Literal["daily", "weekly", "monthly", "yearly"] = Field(
        "monthly", description="Billing frequency: daily, weekly, monthly, or yearly"
    )
    price: Decimal = Field(..., ge=0, description="Plan price must be non-negative")
    minimum_quantity: int = Field(1, ge=1, description="Minimum quantity for this plan")
    start_date: Optional[date] = None
    end_date: Optional[date] = None

    auto_close: bool = Field(False, description="Whether plan auto-closes when it ends")
    can_close_early: bool = Field(False, description="Whether plan allows early closure")
    can_pause: bool = Field(False, description="Whether plan allows pausing")
    can_renew: bool = Field(False, description="Whether plan allows renewal")
    is_active: bool = True

    @model_validator(mode="after")
    def validate_dates(self):
        if self.start_date and self.end_date and self.end_date < self.start_date:
            raise ValueError("end_date cannot be earlier than start_date")
        return self


class PlanCreate(PlanBase):
    pass


class PlanUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    billing_period: Optional[Literal["daily", "weekly", "monthly", "yearly"]] = None
    price: Optional[Decimal] = Field(None, ge=0)
    minimum_quantity: Optional[int] = Field(None, ge=1)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    auto_close: Optional[bool] = None
    can_close_early: Optional[bool] = None
    can_pause: Optional[bool] = None
    can_renew: Optional[bool] = None
    is_active: Optional[bool] = None

    @model_validator(mode="after")
    def validate_dates(self):
        if self.start_date and self.end_date and self.end_date < self.start_date:
            raise ValueError("end_date cannot be earlier than start_date")
        return self


class PlanResponse(PlanBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


# ==========================================
# TAX RULE SCHEMAS
# ==========================================

class TaxBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50, description="Tax name, e.g. GST 18%")
    rate: Decimal = Field(..., ge=0, le=100, description="Tax rate percentage between 0.00 and 100.00")
    is_active: bool = True


class TaxCreate(TaxBase):
    pass


class TaxUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    rate: Optional[Decimal] = Field(None, ge=0, le=100)
    is_active: Optional[bool] = None


class TaxResponse(TaxBase):
    id: int
    model_config = ConfigDict(from_attributes=True)
