from sqlalchemy import Column, Integer, String, Numeric, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    product_type = Column(String(50), nullable=False, default="SERVICE")  # SERVICE, SOFTWARE, GOODS
    sales_price = Column(Numeric(12, 2), nullable=False, default=0.00)
    cost_price = Column(Numeric(12, 2), nullable=False, default=0.00)
    notes = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)

    variants = relationship("ProductVariant", back_populates="product", cascade="all, delete-orphan")


class ProductVariant(Base):
    __tablename__ = "product_variants"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    sku = Column(String(50), nullable=True, unique=True, index=True)
    brand = Column(String(100), nullable=True, index=True)  # e.g. "Odoo"
    price_extra = Column(Numeric(12, 2), nullable=False, default=0.00)
    is_active = Column(Boolean, default=True)

    product = relationship("Product", back_populates="variants")
