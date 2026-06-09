from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import Exam, Result, Student, Class, User
from app.schemas.schemas import ExamCreate, ExamUpdate, ExamOut, ResultsBulkCreate, ResultOut
from app.auth.auth import get_current_user

router = APIRouter(prefix="/exams", tags=["Exams"])


def _calc_grade(marks: float, max_marks: int) -> str:
    pct = (marks / max_marks) * 100
    if pct >= 90: return "A+"
    if pct >= 80: return "A"
    if pct >= 70: return "B+"
    if pct >= 60: return "B"
    if pct >= 50: return "C"
    if pct >= 35: return "D"
    return "F"


def _enrich_exam(exam: Exam, db: Session) -> ExamOut:
    cls = db.query(Class).filter(Class.id == exam.class_id).first()
    result_count = db.query(Result).filter(Result.exam_id == exam.id).count()
    return ExamOut(
        id=exam.id,
        name=exam.name,
        class_id=exam.class_id,
        class_name=f"{cls.name} - {cls.section}" if cls else None,
        subject=exam.subject,
        exam_date=exam.exam_date,
        max_marks=exam.max_marks,
        passing_marks=exam.passing_marks,
        result_count=result_count,
        created_at=exam.created_at,
    )


@router.get("", response_model=List[ExamOut])
def list_exams(
    class_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Exam).filter(Exam.school_id == current_user.school_id)
    if class_id:
        q = q.filter(Exam.class_id == class_id)
    exams = q.order_by(Exam.exam_date.desc().nullslast()).all()
    return [_enrich_exam(e, db) for e in exams]


@router.post("", response_model=ExamOut, status_code=201)
def create_exam(data: ExamCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cls = db.query(Class).filter(Class.id == data.class_id, Class.school_id == current_user.school_id).first()
    if not cls:
        raise HTTPException(404, "Class not found")
    exam = Exam(school_id=current_user.school_id, **data.model_dump())
    db.add(exam)
    db.commit()
    db.refresh(exam)
    return _enrich_exam(exam, db)


@router.put("/{exam_id}", response_model=ExamOut)
def update_exam(
    exam_id: str,
    data: ExamUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    exam = db.query(Exam).filter(Exam.id == exam_id, Exam.school_id == current_user.school_id).first()
    if not exam:
        raise HTTPException(404, "Exam not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(exam, k, v)
    db.commit()
    db.refresh(exam)
    return _enrich_exam(exam, db)


@router.delete("/{exam_id}", status_code=204)
def delete_exam(exam_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    exam = db.query(Exam).filter(Exam.id == exam_id, Exam.school_id == current_user.school_id).first()
    if not exam:
        raise HTTPException(404, "Exam not found")
    db.delete(exam)
    db.commit()


@router.post("/{exam_id}/results", status_code=201)
def submit_results(
    exam_id: str,
    data: ResultsBulkCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    exam = db.query(Exam).filter(Exam.id == exam_id, Exam.school_id == current_user.school_id).first()
    if not exam:
        raise HTTPException(404, "Exam not found")

    for entry in data.results:
        existing = db.query(Result).filter(
            Result.exam_id == exam_id, Result.student_id == entry.student_id
        ).first()
        grade = _calc_grade(entry.marks_obtained, exam.max_marks) if entry.marks_obtained is not None else None

        if existing:
            existing.marks_obtained = entry.marks_obtained
            existing.grade = grade
            existing.remarks = entry.remarks
        else:
            result = Result(
                exam_id=exam_id,
                student_id=entry.student_id,
                marks_obtained=entry.marks_obtained,
                grade=grade,
                remarks=entry.remarks,
            )
            db.add(result)

    db.commit()
    return {"message": f"Results saved for {len(data.results)} students"}


@router.get("/{exam_id}/results", response_model=List[ResultOut])
def get_results(
    exam_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    exam = db.query(Exam).filter(Exam.id == exam_id, Exam.school_id == current_user.school_id).first()
    if not exam:
        raise HTTPException(404, "Exam not found")

    results = db.query(Result).filter(Result.exam_id == exam_id).all()
    out = []
    for r in results:
        student = db.query(Student).filter(Student.id == r.student_id).first()
        out.append(ResultOut(
            id=r.id,
            student_id=r.student_id,
            student_name=student.name if student else None,
            exam_id=r.exam_id,
            marks_obtained=r.marks_obtained,
            grade=r.grade,
            remarks=r.remarks,
        ))
    return out
