from sqlalchemy import Column, Integer, String, Numeric, Boolean
from app.database import Base


class Tax(Base):
    __tablename__ = "taxes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False, unique=True)   # e.g. "GST 18%"
    rate = Column(Numeric(5, 2), nullable=False)             # percent, e.g. 18.00
    is_active = Column(Boolean, default=True)