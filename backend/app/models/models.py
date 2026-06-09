import uuid
from datetime import datetime, date
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, Date, DateTime,
    ForeignKey, Text, Enum as SAEnum, UniqueConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import enum

from app.database import Base


def gen_uuid():
    return str(uuid.uuid4())


class SubscriptionPlan(str, enum.Enum):
    free = "free"
    basic = "basic"
    pro = "pro"


class AttendanceStatus(str, enum.Enum):
    present = "present"
    absent = "absent"
    leave = "leave"


class FeeStatus(str, enum.Enum):
    pending = "pending"
    paid = "paid"
    overdue = "overdue"


class NoticeAudience(str, enum.Enum):
    all = "all"
    parents = "parents"
    teachers = "teachers"
    students = "students"


# ─── Schools ──────────────────────────────────────────────────────────────────

class School(Base):
    __tablename__ = "schools"

    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String(200), nullable=False)
    email = Column(String(200), unique=True, nullable=False)
    phone = Column(String(20))
    address = Column(Text)
    logo_url = Column(String(500))
    subscription_plan = Column(SAEnum(SubscriptionPlan), default=SubscriptionPlan.free)
    razorpay_subscription_id = Column(String(200))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("User", back_populates="school", cascade="all, delete")
    classes = relationship("Class", back_populates="school", cascade="all, delete")
    students = relationship("Student", back_populates="school", cascade="all, delete")
    notices = relationship("Notice", back_populates="school", cascade="all, delete")
    fees = relationship("Fee", back_populates="school", cascade="all, delete")
    exams = relationship("Exam", back_populates="school", cascade="all, delete")


# ─── Users ────────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_uuid)
    school_id = Column(String, ForeignKey("schools.id", ondelete="CASCADE"), nullable=False)
    email = Column(String(200), unique=True, nullable=False)
    password_hash = Column(String(500), nullable=False)
    name = Column(String(200))
    role = Column(String(50), default="admin")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    school = relationship("School", back_populates="users")


# ─── Classes ──────────────────────────────────────────────────────────────────

class Class(Base):
    __tablename__ = "classes"

    id = Column(String, primary_key=True, default=gen_uuid)
    school_id = Column(String, ForeignKey("schools.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)   # e.g. "Class 5"
    section = Column(String(10), default="A")    # e.g. "A", "B"
    teacher_name = Column(String(200))
    created_at = Column(DateTime, default=datetime.utcnow)

    school = relationship("School", back_populates="classes")
    students = relationship("Student", back_populates="class_", cascade="all, delete")
    attendances = relationship("Attendance", back_populates="class_", cascade="all, delete")
    exams = relationship("Exam", back_populates="class_", cascade="all, delete")

    __table_args__ = (
        UniqueConstraint("school_id", "name", "section", name="uq_class_school"),
    )


# ─── Students ─────────────────────────────────────────────────────────────────

class Student(Base):
    __tablename__ = "students"

    id = Column(String, primary_key=True, default=gen_uuid)
    school_id = Column(String, ForeignKey("schools.id", ondelete="CASCADE"), nullable=False)
    class_id = Column(String, ForeignKey("classes.id", ondelete="SET NULL"), nullable=True)
    roll_no = Column(String(20))
    name = Column(String(200), nullable=False)
    gender = Column(String(10))
    dob = Column(Date)
    parent_name = Column(String(200))
    parent_phone = Column(String(20))
    parent_email = Column(String(200))
    address = Column(Text)
    photo_url = Column(String(500))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    school = relationship("School", back_populates="students")
    class_ = relationship("Class", back_populates="students")
    attendances = relationship("Attendance", back_populates="student", cascade="all, delete")
    fees = relationship("Fee", back_populates="student", cascade="all, delete")
    results = relationship("Result", back_populates="student", cascade="all, delete")


# ─── Attendance ───────────────────────────────────────────────────────────────

class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(String, primary_key=True, default=gen_uuid)
    school_id = Column(String, ForeignKey("schools.id", ondelete="CASCADE"), nullable=False)
    class_id = Column(String, ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(String, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False)
    status = Column(SAEnum(AttendanceStatus), nullable=False)
    remarks = Column(String(300))
    marked_at = Column(DateTime, default=datetime.utcnow)

    class_ = relationship("Class", back_populates="attendances")
    student = relationship("Student", back_populates="attendances")

    __table_args__ = (
        UniqueConstraint("student_id", "date", name="uq_attendance_student_date"),
    )


# ─── Fees ─────────────────────────────────────────────────────────────────────

class Fee(Base):
    __tablename__ = "fees"

    id = Column(String, primary_key=True, default=gen_uuid)
    school_id = Column(String, ForeignKey("schools.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(String, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    fee_type = Column(String(100), nullable=False)   # "Tuition", "Transport", "Exam", etc.
    amount = Column(Float, nullable=False)
    due_date = Column(Date)
    paid_date = Column(Date)
    status = Column(SAEnum(FeeStatus), default=FeeStatus.pending)
    receipt_no = Column(String(100), unique=True)
    razorpay_payment_id = Column(String(200))
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    school = relationship("School", back_populates="fees")
    student = relationship("Student", back_populates="fees")


# ─── Exams ────────────────────────────────────────────────────────────────────

class Exam(Base):
    __tablename__ = "exams"

    id = Column(String, primary_key=True, default=gen_uuid)
    school_id = Column(String, ForeignKey("schools.id", ondelete="CASCADE"), nullable=False)
    class_id = Column(String, ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(200), nullable=False)    # "Unit Test 1", "Mid Term"
    subject = Column(String(100), nullable=False)
    exam_date = Column(Date)
    max_marks = Column(Integer, default=100)
    passing_marks = Column(Integer, default=35)
    created_at = Column(DateTime, default=datetime.utcnow)

    school = relationship("School", back_populates="exams")
    class_ = relationship("Class", back_populates="exams")
    results = relationship("Result", back_populates="exam", cascade="all, delete")


# ─── Results ──────────────────────────────────────────────────────────────────

class Result(Base):
    __tablename__ = "results"

    id = Column(String, primary_key=True, default=gen_uuid)
    exam_id = Column(String, ForeignKey("exams.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(String, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    marks_obtained = Column(Float)
    grade = Column(String(5))
    remarks = Column(String(300))
    created_at = Column(DateTime, default=datetime.utcnow)

    exam = relationship("Exam", back_populates="results")
    student = relationship("Student", back_populates="results")

    __table_args__ = (
        UniqueConstraint("exam_id", "student_id", name="uq_result_exam_student"),
    )


# ─── Notices ──────────────────────────────────────────────────────────────────

class Notice(Base):
    __tablename__ = "notices"

    id = Column(String, primary_key=True, default=gen_uuid)
    school_id = Column(String, ForeignKey("schools.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(300), nullable=False)
    content = Column(Text, nullable=False)
    audience = Column(SAEnum(NoticeAudience), default=NoticeAudience.all)
    is_pinned = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    school = relationship("School", back_populates="notices")
