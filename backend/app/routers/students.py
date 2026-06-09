from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import Student, Class, User
from app.schemas.schemas import StudentCreate, StudentUpdate, StudentOut, ClassCreate, ClassOut
from app.auth.auth import get_current_user

router = APIRouter(tags=["Students"])


# ─── Classes ──────────────────────────────────────────────────────────────────

@router.get("/classes", response_model=List[ClassOut])
def list_classes(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    classes = db.query(Class).filter(Class.school_id == current_user.school_id).all()
    result = []
    for c in classes:
        count = db.query(Student).filter(
            Student.class_id == c.id, Student.is_active == True
        ).count()
        result.append(ClassOut(
            id=c.id, name=c.name, section=c.section,
            teacher_name=c.teacher_name, student_count=count
        ))
    return result


@router.post("/classes", response_model=ClassOut, status_code=201)
def create_class(data: ClassCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    c = Class(school_id=current_user.school_id, **data.model_dump())
    db.add(c)
    db.commit()
    db.refresh(c)
    return ClassOut(id=c.id, name=c.name, section=c.section, teacher_name=c.teacher_name, student_count=0)


@router.delete("/classes/{class_id}", status_code=204)
def delete_class(class_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    c = db.query(Class).filter(Class.id == class_id, Class.school_id == current_user.school_id).first()
    if not c:
        raise HTTPException(404, "Class not found")
    db.delete(c)
    db.commit()


# ─── Students ─────────────────────────────────────────────────────────────────

def _enrich(student: Student, db: Session) -> StudentOut:
    class_name = None
    if student.class_id:
        c = db.query(Class).filter(Class.id == student.class_id).first()
        if c:
            class_name = f"{c.name} - {c.section}"
    return StudentOut(
        **{k: v for k, v in student.__dict__.items() if not k.startswith("_")},
        class_name=class_name,
    )


@router.get("/students", response_model=List[StudentOut])
def list_students(
    class_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    is_active: bool = Query(True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Student).filter(
        Student.school_id == current_user.school_id,
        Student.is_active == is_active,
    )
    if class_id:
        q = q.filter(Student.class_id == class_id)
    if search:
        q = q.filter(Student.name.ilike(f"%{search}%"))
    students = q.order_by(Student.name).all()
    return [_enrich(s, db) for s in students]


@router.get("/students/{student_id}", response_model=StudentOut)
def get_student(student_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    s = db.query(Student).filter(Student.id == student_id, Student.school_id == current_user.school_id).first()
    if not s:
        raise HTTPException(404, "Student not found")
    return _enrich(s, db)


@router.post("/students", response_model=StudentOut, status_code=201)
def create_student(data: StudentCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    s = Student(school_id=current_user.school_id, **data.model_dump())
    db.add(s)
    db.commit()
    db.refresh(s)
    return _enrich(s, db)


@router.put("/students/{student_id}", response_model=StudentOut)
def update_student(
    student_id: str,
    data: StudentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    s = db.query(Student).filter(Student.id == student_id, Student.school_id == current_user.school_id).first()
    if not s:
        raise HTTPException(404, "Student not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(s, k, v)
    db.commit()
    db.refresh(s)
    return _enrich(s, db)


@router.delete("/students/{student_id}", status_code=204)
def delete_student(student_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    s = db.query(Student).filter(Student.id == student_id, Student.school_id == current_user.school_id).first()
    if not s:
        raise HTTPException(404, "Student not found")
    s.is_active = False
    db.commit()
