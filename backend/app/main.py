from fastapi import FastAPI
from app.api import auth, taxes, billing, payments
from app.database import engine, Base
from app.models import user as user_model
from app.models import tax, invoice, payment  # noqa: F401  (registers billing tables)

Base.metadata.create_all(bind=engine)
app = FastAPI(title="Subscription Management System API")

app.include_router(auth.router)
app.include_router(taxes.router)
app.include_router(billing.router)
app.include_router(payments.router)
@app.get("/")
def root():
    return {"status": "System operational"}