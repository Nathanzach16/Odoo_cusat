from fastapi import FastAPI
from app.api import auth
from app.database import engine, Base
from app.models import user as user_model

Base.metadata.create_all(bind=engine)
app = FastAPI(title="Subscription Management System API")

app.include_router(auth.router)

@app.get("/")
def root():
    return {"status": "System operational"}