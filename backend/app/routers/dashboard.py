from datetime import date
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.models import Student, Class, Attendance, Fee, Exam, Notice, AttendanceStatus, FeeStatus
from app.schemas.schemas import DashboardMetrics
from app.auth.auth import get_current_user
from app.models.models import User

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/metrics", response_model=DashboardMetrics)
def get_metrics(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    school_id = current_user.school_id
    today = date.today()

    total_students = db.query(Student).filter(
        Student.school_id == school_id, Student.is_active == True
    ).count()

    total_classes = db.query(Class).filter(Class.school_id == school_id).count()

    present_today = db.query(Attendance).filter(
        Attendance.school_id == school_id,
        Attendance.date == today,
        Attendance.status == AttendanceStatus.present,
    ).count()

    absent_today = db.query(Attendance).filter(
        Attendance.school_id == school_id,
        Attendance.date == today,
        Attendance.status == AttendanceStatus.absent,
    ).count()

    marked_today = present_today + absent_today
    attendance_rate = round((present_today / marked_today * 100) if marked_today > 0 else 0, 1)

    fees_collected = db.query(func.sum(Fee.amount)).filter(
        Fee.school_id == school_id,
        Fee.status == FeeStatus.paid,
    ).scalar() or 0.0

    fees_pending = db.query(func.sum(Fee.amount)).filter(
        Fee.school_id == school_id,
        Fee.status.in_([FeeStatus.pending, FeeStatus.overdue]),
    ).scalar() or 0.0

    upcoming_exams = db.query(Exam).filter(
        Exam.school_id == school_id,
        Exam.exam_date >= today,
    ).count()

    recent_notices = db.query(Notice).filter(
        Notice.school_id == school_id,
    ).count()

    return DashboardMetrics(
        total_students=total_students,
        total_classes=total_classes,
        present_today=present_today,
        absent_today=absent_today,
        attendance_rate=attendance_rate,
        total_fees_collected=fees_collected,
        total_fees_pending=fees_pending,
        upcoming_exams=upcoming_exams,
        recent_notices=recent_notices,
    )
