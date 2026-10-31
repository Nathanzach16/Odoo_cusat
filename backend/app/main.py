from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
import app.models  # Ensure all models register with Base metadata
from app.models import invoice, payment  # noqa: F401


# Create database tables automatically
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Brightloop Subscription Management System API",
    description=(
        "Backend API for Products, Plans, Discounts, Quotes, "
        "Invoicing, Payments, and Authentication"
    ),
    version="1.0.0",
)


# Enable CORS for frontend and cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Helper function to safely import and register routers
def safe_include_router(module_path: str, router_name: str = "router"):
    try:
        import importlib
        module = importlib.import_module(module_path)
        router = getattr(module, router_name)
        app.include_router(router)
    except (ImportError, AttributeError):
        # Create a fallback dummy router if the module or router is missing
        tag_name = module_path.split(".")[-1].capitalize()
        fallback_router = APIRouter(prefix=f"/{module_path.split('.')[-1]}", tags=[tag_name])
        
        @fallback_router.get("/")
        def placeholder():
            return {"status": f"{tag_name} module is pending implementation"}
            
        app.include_router(fallback_router)


# Register all application API routers safely
routers = [
    "app.api.auth",
    "app.api.catalog",
    "app.api.quotes",
    "app.api.discounts",
    "app.api.taxes",
    "app.api.billing",
    "app.api.payments",
]

for router_path in routers:
    safe_include_router(router_path)


@app.get("/")
def root():
    return {
        "status": "System operational",
        "service": "Brightloop Subscription Management System",
    }
