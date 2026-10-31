from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.tax import Tax
from app.schemas.tax import TaxCreate, TaxOut

router = APIRouter(prefix="/taxes", tags=["Taxes"])


@router.post("", response_model=TaxOut, status_code=status.HTTP_201_CREATED)
def create_tax(data: TaxCreate, db: Session = Depends(get_db)):
    """Admin adds a new tax rule, e.g. GST 18%."""
    if db.query(Tax).filter(Tax.name == data.name).first():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "A tax with this name already exists")
    tax = Tax(name=data.name, rate=data.rate)
    db.add(tax)
    db.commit()
    db.refresh(tax)
    return tax


@router.get("", response_model=list[TaxOut])
def list_taxes(active_only: bool = False, db: Session = Depends(get_db)):
    """List all tax rules (or only active ones)."""
    query = db.query(Tax)
    if active_only:
        query = query.filter(Tax.is_active.is_(True))
    return query.order_by(Tax.name).all()


@router.patch("/{tax_id}/deactivate", response_model=TaxOut)
def deactivate_tax(tax_id: int, db: Session = Depends(get_db)):
    """Switch a tax rule off so it is no longer applied to new invoices."""
    tax = db.get(Tax, tax_id)
    if tax is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tax not found")
    tax.is_active = False
    db.commit()
    db.refresh(tax)
    return tax