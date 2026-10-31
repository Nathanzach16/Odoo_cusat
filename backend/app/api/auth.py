from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from app.schemas.user import UserCreate, UserLogin, PasswordResetRequest
from app.models.user import User
from app.core.security import hash_password, verify_password
from app.database import get_db
from app.core.dependencies import require_admin

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(user_in: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=400, detail="An account with this email already exists."
        )

    db_user = User(
        email=user_in.email,
        hashed_password=hash_password(user_in.password),
        role=user_in.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return {"message": f"User {db_user.email} created successfully as {db_user.role}"}

@router.post("/login")
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=401, detail="Invalid email or password"
        )
    return {"message": "Login successful", "role": user.role, "email": user.email}

@router.post("/reset-password-link")
def request_password_reset(payload: PasswordResetRequest):
    return {"message": f"Password reset link sent to {payload.email}"}

@router.post("/admin/add-staff", dependencies=[Depends(require_admin)])
def add_staff_member(staff_user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == staff_user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=400, detail="An account with this email already exists."
        )
    
    db_user = User(
        email=staff_user.email,
        hashed_password=hash_password(staff_user.password),
        role="STAFF"
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return {"message": f"Staff member {db_user.email} created successfully."}