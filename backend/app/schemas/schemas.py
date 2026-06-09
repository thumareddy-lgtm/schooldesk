from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr


# ─── Auth ─────────────────────────────────────────────────────────────────────

class SchoolRegister(BaseModel):
    school_name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    address: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    school_id: str
    school_name: str
    user_id: str


# ─── School ───────────────────────────────────────────────────────────────────

class SchoolUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    logo_url: Optional[str] = None


class SchoolOut(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str]
    address: Optional[str]
    logo_url: Optional[str]
    subscription_plan: str
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Class ────────────────────────────────────────────────────────────────────

class ClassCreate(BaseModel):
    name: str
    section: str = "A"
    teacher_name: Optional[str] = None


class ClassOut(BaseModel):
    id: str
    name: str
    section: str
    teacher_name: Optional[str]
    student_count: Optional[int] = 0

    class Config:
        from_attributes = True


# ─── Student ──────────────────────────────────────────────────────────────────

class StudentCreate(BaseModel):
    name: str
    class_id: Optional[str] = None
    roll_no: Optional[str] = None
    gender: Optional[str] = None
    dob: Optional[date] = None
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    parent_email: Optional[str] = None
    address: Optional[str] = None
    photo_url: Optional[str] = None


class StudentUpdate(BaseModel):
    name: Optional[str] = None
    class_id: Optional[str] = None
    roll_no: Optional[str] = None
    gender: Optional[str] = None
    dob: Optional[date] = None
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    parent_email: Optional[str] = None
    address: Optional[str] = None
    photo_url: Optional[str] = None
    is_active: Optional[bool] = None


class StudentOut(BaseModel):
    id: str
    name: str
    class_id: Optional[str]
    class_name: Optional[str] = None
    roll_no: Optional[str]
    gender: Optional[str]
    dob: Optional[date]
    parent_name: Optional[str]
    parent_phone: Optional[str]
    parent_email: Optional[str]
    address: Optional[str]
    photo_url: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Attendance ───────────────────────────────────────────────────────────────

class AttendanceRecord(BaseModel):
    student_id: str
    status: str   # "present" | "absent" | "leave"
    remarks: Optional[str] = None


class AttendanceBulkCreate(BaseModel):
    class_id: str
    date: date
    records: List[AttendanceRecord]


class AttendanceOut(BaseModel):
    id: str
    student_id: str
    student_name: Optional[str] = None
    class_id: str
    date: date
    status: str
    remarks: Optional[str]

    class Config:
        from_attributes = True


# ─── Fees ─────────────────────────────────────────────────────────────────────

class FeeCreate(BaseModel):
    student_id: str
    fee_type: str
    amount: float
    due_date: Optional[date] = None
    notes: Optional[str] = None


class FeeUpdate(BaseModel):
    status: Optional[str] = None
    paid_date: Optional[date] = None
    razorpay_payment_id: Optional[str] = None
    notes: Optional[str] = None


class FeeOut(BaseModel):
    id: str
    student_id: str
    student_name: Optional[str] = None
    class_name: Optional[str] = None
    fee_type: str
    amount: float
    due_date: Optional[date]
    paid_date: Optional[date]
    status: str
    receipt_no: Optional[str]
    razorpay_payment_id: Optional[str]
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Exams ────────────────────────────────────────────────────────────────────

class ExamCreate(BaseModel):
    name: str
    class_id: str
    subject: str
    exam_date: Optional[date] = None
    max_marks: int = 100
    passing_marks: int = 35


class ExamUpdate(BaseModel):
    name: Optional[str] = None
    subject: Optional[str] = None
    exam_date: Optional[date] = None
    max_marks: Optional[int] = None
    passing_marks: Optional[int] = None


class ExamOut(BaseModel):
    id: str
    name: str
    class_id: str
    class_name: Optional[str] = None
    subject: str
    exam_date: Optional[date]
    max_marks: int
    passing_marks: int
    result_count: Optional[int] = 0
    created_at: datetime

    class Config:
        from_attributes = True


class ResultEntry(BaseModel):
    student_id: str
    marks_obtained: Optional[float] = None
    remarks: Optional[str] = None


class ResultsBulkCreate(BaseModel):
    results: List[ResultEntry]


class ResultOut(BaseModel):
    id: str
    student_id: str
    student_name: Optional[str] = None
    exam_id: str
    marks_obtained: Optional[float]
    grade: Optional[str]
    remarks: Optional[str]

    class Config:
        from_attributes = True


# ─── Notices ──────────────────────────────────────────────────────────────────

class NoticeCreate(BaseModel):
    title: str
    content: str
    audience: str = "all"
    is_pinned: bool = False


class NoticeUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    audience: Optional[str] = None
    is_pinned: Optional[bool] = None


class NoticeOut(BaseModel):
    id: str
    title: str
    content: str
    audience: str
    is_pinned: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Dashboard ────────────────────────────────────────────────────────────────

class DashboardMetrics(BaseModel):
    total_students: int
    total_classes: int
    present_today: int
    absent_today: int
    attendance_rate: float
    total_fees_collected: float
    total_fees_pending: float
    upcoming_exams: int
    recent_notices: int
