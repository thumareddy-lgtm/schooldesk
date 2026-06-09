import uuid
from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import Fee, Student, Class, User, FeeStatus
from app.schemas.schemas import FeeCreate, FeeUpdate, FeeOut
from app.auth.auth import get_current_user

router = APIRouter(prefix="/fees", tags=["Fees"])


def _generate_receipt() -> str:
    return f"RCPT-{uuid.uuid4().hex[:8].upper()}"


def _enrich_fee(fee: Fee, db: Session) -> FeeOut:
    student = db.query(Student).filter(Student.id == fee.student_id).first()
    class_name = None
    if student and student.class_id:
        cls = db.query(Class).filter(Class.id == student.class_id).first()
        if cls:
            class_name = f"{cls.name} - {cls.section}"
    return FeeOut(
        id=fee.id,
        student_id=fee.student_id,
        student_name=student.name if student else None,
        class_name=class_name,
        fee_type=fee.fee_type,
        amount=fee.amount,
        due_date=fee.due_date,
        paid_date=fee.paid_date,
        status=fee.status.value,
        receipt_no=fee.receipt_no,
        razorpay_payment_id=fee.razorpay_payment_id,
        notes=fee.notes,
        created_at=fee.created_at,
    )


@router.get("", response_model=List[FeeOut])
def list_fees(
    status: Optional[str] = Query(None),
    student_id: Optional[str] = Query(None),
    class_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Fee).filter(Fee.school_id == current_user.school_id)

    if status:
        q = q.filter(Fee.status == FeeStatus(status))
    if student_id:
        q = q.filter(Fee.student_id == student_id)
    if class_id:
        student_ids = [s.id for s in db.query(Student).filter(Student.class_id == class_id).all()]
        q = q.filter(Fee.student_id.in_(student_ids))

    fees = q.order_by(Fee.created_at.desc()).all()
    return [_enrich_fee(f, db) for f in fees]


@router.post("", response_model=FeeOut, status_code=201)
def create_fee(data: FeeCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    student = db.query(Student).filter(
        Student.id == data.student_id, Student.school_id == current_user.school_id
    ).first()
    if not student:
        raise HTTPException(404, "Student not found")

    fee = Fee(
        school_id=current_user.school_id,
        receipt_no=_generate_receipt(),
        **data.model_dump(),
    )
    db.add(fee)
    db.commit()
    db.refresh(fee)
    return _enrich_fee(fee, db)


@router.put("/{fee_id}/collect", response_model=FeeOut)
def collect_fee(
    fee_id: str,
    data: FeeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    fee = db.query(Fee).filter(Fee.id == fee_id, Fee.school_id == current_user.school_id).first()
    if not fee:
        raise HTTPException(404, "Fee record not found")

    fee.status = FeeStatus.paid
    fee.paid_date = data.paid_date or date.today()
    if data.razorpay_payment_id:
        fee.razorpay_payment_id = data.razorpay_payment_id
    if data.notes:
        fee.notes = data.notes

    db.commit()
    db.refresh(fee)
    return _enrich_fee(fee, db)


@router.delete("/{fee_id}", status_code=204)
def delete_fee(fee_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    fee = db.query(Fee).filter(Fee.id == fee_id, Fee.school_id == current_user.school_id).first()
    if not fee:
        raise HTTPException(404, "Fee record not found")
    db.delete(fee)
    db.commit()


@router.get("/summary")
def fee_summary(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from sqlalchemy import func
    school_id = current_user.school_id

    collected = db.query(func.sum(Fee.amount)).filter(
        Fee.school_id == school_id, Fee.status == FeeStatus.paid
    ).scalar() or 0

    pending = db.query(func.sum(Fee.amount)).filter(
        Fee.school_id == school_id, Fee.status == FeeStatus.pending
    ).scalar() or 0

    overdue = db.query(func.sum(Fee.amount)).filter(
        Fee.school_id == school_id, Fee.status == FeeStatus.overdue
    ).scalar() or 0

    return {"collected": collected, "pending": pending, "overdue": overdue}
