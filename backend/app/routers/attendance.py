from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import Attendance, Student, Class, User, AttendanceStatus
from app.schemas.schemas import AttendanceBulkCreate, AttendanceOut
from app.auth.auth import get_current_user

router = APIRouter(prefix="/attendance", tags=["Attendance"])


@router.post("/bulk", status_code=201)
def mark_attendance(
    data: AttendanceBulkCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    school_id = current_user.school_id

    # Verify class belongs to school
    cls = db.query(Class).filter(Class.id == data.class_id, Class.school_id == school_id).first()
    if not cls:
        raise HTTPException(404, "Class not found")

    created = []
    for record in data.records:
        existing = db.query(Attendance).filter(
            Attendance.student_id == record.student_id,
            Attendance.date == data.date,
        ).first()

        status = AttendanceStatus(record.status)

        if existing:
            existing.status = status
            existing.remarks = record.remarks
        else:
            att = Attendance(
                school_id=school_id,
                class_id=data.class_id,
                student_id=record.student_id,
                date=data.date,
                status=status,
                remarks=record.remarks,
            )
            db.add(att)
            created.append(att)

    db.commit()
    return {"message": f"Attendance marked for {len(data.records)} students"}


@router.get("/class/{class_id}", response_model=List[AttendanceOut])
def get_class_attendance(
    class_id: str,
    att_date: date = Query(..., alias="date"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    records = db.query(Attendance).filter(
        Attendance.class_id == class_id,
        Attendance.school_id == current_user.school_id,
        Attendance.date == att_date,
    ).all()

    result = []
    for r in records:
        student = db.query(Student).filter(Student.id == r.student_id).first()
        result.append(AttendanceOut(
            id=r.id,
            student_id=r.student_id,
            student_name=student.name if student else None,
            class_id=r.class_id,
            date=r.date,
            status=r.status.value,
            remarks=r.remarks,
        ))
    return result


@router.get("/student/{student_id}", response_model=List[AttendanceOut])
def get_student_attendance(
    student_id: str,
    from_date: Optional[date] = Query(None),
    to_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Attendance).filter(
        Attendance.student_id == student_id,
        Attendance.school_id == current_user.school_id,
    )
    if from_date:
        q = q.filter(Attendance.date >= from_date)
    if to_date:
        q = q.filter(Attendance.date <= to_date)

    records = q.order_by(Attendance.date.desc()).all()
    student = db.query(Student).filter(Student.id == student_id).first()

    return [
        AttendanceOut(
            id=r.id,
            student_id=r.student_id,
            student_name=student.name if student else None,
            class_id=r.class_id,
            date=r.date,
            status=r.status.value,
            remarks=r.remarks,
        )
        for r in records
    ]


@router.get("/summary")
def get_attendance_summary(
    class_id: Optional[str] = Query(None),
    att_date: date = Query(date.today(), alias="date"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Attendance).filter(
        Attendance.school_id == current_user.school_id,
        Attendance.date == att_date,
    )
    if class_id:
        q = q.filter(Attendance.class_id == class_id)

    records = q.all()
    present = sum(1 for r in records if r.status == AttendanceStatus.present)
    absent = sum(1 for r in records if r.status == AttendanceStatus.absent)
    leave = sum(1 for r in records if r.status == AttendanceStatus.leave)

    return {"date": att_date, "present": present, "absent": absent, "leave": leave, "total": len(records)}
