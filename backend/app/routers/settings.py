from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import School, User
from app.schemas.schemas import SchoolUpdate, SchoolOut
from app.auth.auth import get_current_user
from app.config import settings as app_settings

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get("/school", response_model=SchoolOut)
def get_school(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    school = db.query(School).filter(School.id == current_user.school_id).first()
    if not school:
        raise HTTPException(404, "School not found")
    return school


@router.put("/school", response_model=SchoolOut)
def update_school(
    data: SchoolUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    school = db.query(School).filter(School.id == current_user.school_id).first()
    if not school:
        raise HTTPException(404, "School not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(school, k, v)
    db.commit()
    db.refresh(school)
    return school


@router.post("/subscribe")
def create_subscription(
    plan: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a Razorpay subscription for the school."""
    try:
        import razorpay
        client = razorpay.Client(
            auth=(app_settings.RAZORPAY_KEY_ID, app_settings.RAZORPAY_KEY_SECRET)
        )

        plan_ids = {
            "basic": "plan_basic_id_here",
            "pro": "plan_pro_id_here",
        }

        if plan not in plan_ids:
            raise HTTPException(400, "Invalid plan. Choose 'basic' or 'pro'")

        subscription = client.subscription.create({
            "plan_id": plan_ids[plan],
            "customer_notify": 1,
            "total_count": 12,
        })

        school = db.query(School).filter(School.id == current_user.school_id).first()
        school.razorpay_subscription_id = subscription["id"]
        school.subscription_plan = plan
        db.commit()

        return {"subscription_id": subscription["id"], "status": subscription["status"]}
    except Exception as e:
        raise HTTPException(500, f"Payment integration error: {str(e)}")


@router.get("/razorpay-key")
def get_razorpay_key(current_user: User = Depends(get_current_user)):
    return {"key_id": app_settings.RAZORPAY_KEY_ID}
