from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
import app.models  # Ensure all models register with Base metadata

from app.api import auth, catalog, quotes, discounts, taxes, billing, payments
from app.models import invoice, payment  # noqa: F401


# Create tables in the database
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Brightloop Subscription Management System API",
    description=(
        "Backend API for Products, Plans, Taxes, Quotes, "
        "Subscriptions, Discounts, Invoicing, and Authentication"
    ),
    version="1.0.0",
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(auth.router)
app.include_router(catalog.router)
app.include_router(quotes.router)
app.include_router(discounts.router)
app.include_router(taxes.router)
app.include_router(billing.router)
app.include_router(payments.router)


@app.get("/")
def root():
    return {
        "status": "System operational",
        "service": "Brightloop Subscription Management System",
    }