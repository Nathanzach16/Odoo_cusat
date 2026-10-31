from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.product import Product, ProductVariant
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    ProductDetailResponse,
    VariantCreate,
    VariantUpdate,
    VariantResponse,
)

router = APIRouter(prefix="/catalog", tags=["Catalog"])


# ==========================================
# HELPER FUNCTIONS
# ==========================================

def calculate_variant_price(product, variant):
    """Calculate the final price for a product variant."""
    brand_adjustment = (
        Decimal("560.00")
        if variant.brand and variant.brand.lower() == "odoo"
        else Decimal("0.00")
    )

    return (
        Decimal(str(product.sales_price))
        + brand_adjustment
        + Decimal(str(variant.price_extra))
    )


def build_product_detail(product):
    """Build product details, including calculated variant prices."""
    product_data = ProductDetailResponse.model_validate(product).model_dump()

    product_data["variants"] = []

    for variant in product.variants:
        variant_data = VariantResponse.model_validate(variant).model_dump()
        variant_data["calculated_price"] = calculate_variant_price(
            product, variant
        )
        product_data["variants"].append(variant_data)

    return product_data


# ==========================================
# PRODUCT ENDPOINTS
# ==========================================

@router.post(
    "/products",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_product(
    product_data: ProductCreate,
    db: Session = Depends(get_db),
):
    product = Product(**product_data.model_dump())

    db.add(product)
    db.commit()
    db.refresh(product)

    return product


@router.get("/products", response_model=list[ProductResponse])
def list_products(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    if skip < 0 or limit < 1 or limit > 500:
        raise HTTPException(
            status_code=400,
            detail="skip must be non-negative and limit must be between 1 and 500",
        )

    return (
        db.query(Product)
        .order_by(Product.id)
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get(
    "/products/{product_id}",
    response_model=ProductDetailResponse,
)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
):
    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    return build_product_detail(product)


@router.put("/products/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product_data: ProductUpdate,
    db: Session = Depends(get_db),
):
    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    updates = product_data.model_dump(exclude_unset=True)

    for field, value in updates.items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)

    return product


@router.delete(
    "/products/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
):
    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    db.delete(product)
    db.commit()


# ==========================================
# PRODUCT VARIANT ENDPOINTS
# ==========================================

@router.post(
    "/products/{product_id}/variants",
    response_model=VariantResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_variant(
    product_id: int,
    variant_data: VariantCreate,
    db: Session = Depends(get_db),
):
    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    variant = ProductVariant(
        product_id=product_id,
        **variant_data.model_dump(),
    )

    db.add(variant)
    db.commit()
    db.refresh(variant)

    result = VariantResponse.model_validate(variant).model_dump()
    result["calculated_price"] = calculate_variant_price(product, variant)

    return result


@router.get(
    "/products/{product_id}/variants",
    response_model=list[VariantResponse],
)
def list_variants(
    product_id: int,
    db: Session = Depends(get_db),
):
    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    results = []

    for variant in product.variants:
        result = VariantResponse.model_validate(variant).model_dump()
        result["calculated_price"] = calculate_variant_price(
            product, variant
        )
        results.append(result)

    return results


@router.put("/variants/{variant_id}", response_model=VariantResponse)
def update_variant(
    variant_id: int,
    variant_data: VariantUpdate,
    db: Session = Depends(get_db),
):
    variant = (
        db.query(ProductVariant)
        .filter(ProductVariant.id == variant_id)
        .first()
    )

    if variant is None:
        raise HTTPException(
            status_code=404,
            detail="Product variant not found",
        )

    updates = variant_data.model_dump(exclude_unset=True)

    for field, value in updates.items():
        setattr(variant, field, value)

    db.commit()
    db.refresh(variant)

    product = variant.product

    result = VariantResponse.model_validate(variant).model_dump()
    result["calculated_price"] = calculate_variant_price(product, variant)

    return result


@router.delete(
    "/variants/{variant_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_variant(
    variant_id: int,
    db: Session = Depends(get_db),
):
    variant = (
        db.query(ProductVariant)
        .filter(ProductVariant.id == variant_id)
        .first()
    )

    if variant is None:
        raise HTTPException(
            status_code=404,
            detail="Product variant not found",
        )

    db.delete(variant)
    db.commit()