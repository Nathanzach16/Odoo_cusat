from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
import app.models  # ensure all models register with Base metadata
from app.api import catalog, quotes, discounts

# Create tables in database
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Brightloop Subscription Management System API",
    description="Backend API for Products, Plans, Taxes, Quotes, Subscriptions, Discounts & Invoicing",
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

# Include Member 2 routers
app.include_router(catalog.router)
app.include_router(quotes.router)
app.include_router(discounts.router)

# Gracefully include auth router if present from Member 1
try:
    from app.api import auth
    app.include_router(auth.router)
except ImportError:
    pass


@app.get("/")
def root():
    return {"status": "System operational", "service": "Brightloop Subscription Management System"}
