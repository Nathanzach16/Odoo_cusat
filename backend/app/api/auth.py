from fastapi import APIRouter, HTTPException, status, Depends
from app.schemas.user import UserCreate, UserLogin, PasswordResetRequest
from app.core.dependencies import require_admin

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(user: UserCreate):
    return {"message": f"User {user.email} registered successfully as {user.role}"}

@router.post("/login")
def login(credentials: UserLogin):
    return {"access_token": "fake-jwt-token", "token_type": "bearer"}

@router.post("/reset-password-link")
def request_password_reset(payload: PasswordResetRequest):
    return {"message": f"Password reset link sent to {payload.email}"}

@router.post("/admin/add-staff", dependencies=[Depends(require_admin)])
def add_staff_member(staff_user: UserCreate):
    return {"message": f"Staff member {staff_user.email} created successfully."}