from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import School, User
from app.schemas.schemas import SchoolRegister, LoginRequest, TokenResponse
from app.auth.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(data: SchoolRegister, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    school = School(
        name=data.school_name,
        email=data.email,
        phone=data.phone,
        address=data.address,
    )
    db.add(school)
    db.flush()

    user = User(
        school_id=school.id,
        email=data.email,
        password_hash=hash_password(data.password),
        name=data.school_name,
        role="admin",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    db.refresh(school)

    token = create_access_token({"sub": user.id, "school_id": school.id})
    return TokenResponse(
        access_token=token,
        school_id=school.id,
        school_name=school.name,
        user_id=user.id,
    )


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email, User.is_active == True).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    school = db.query(School).filter(School.id == user.school_id).first()
    token = create_access_token({"sub": user.id, "school_id": school.id})
    return TokenResponse(
        access_token=token,
        school_id=school.id,
        school_name=school.name,
        user_id=user.id,
    )


@router.get("/me")
def me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    school = db.query(School).filter(School.id == current_user.school_id).first()
    return {
        "user_id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "role": current_user.role,
        "school_id": school.id,
        "school_name": school.name,
        "subscription_plan": school.subscription_plan,
    }
