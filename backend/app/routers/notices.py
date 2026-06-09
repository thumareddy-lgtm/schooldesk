from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import Notice, User, NoticeAudience
from app.schemas.schemas import NoticeCreate, NoticeUpdate, NoticeOut
from app.auth.auth import get_current_user

router = APIRouter(prefix="/notices", tags=["Notices"])


@router.get("", response_model=List[NoticeOut])
def list_notices(
    audience: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Notice).filter(Notice.school_id == current_user.school_id)
    if audience:
        q = q.filter(Notice.audience == NoticeAudience(audience))
    notices = q.order_by(Notice.is_pinned.desc(), Notice.created_at.desc()).all()
    return [
        NoticeOut(
            id=n.id, title=n.title, content=n.content,
            audience=n.audience.value, is_pinned=n.is_pinned, created_at=n.created_at
        )
        for n in notices
    ]


@router.post("", response_model=NoticeOut, status_code=201)
def create_notice(data: NoticeCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    notice = Notice(
        school_id=current_user.school_id,
        title=data.title,
        content=data.content,
        audience=NoticeAudience(data.audience),
        is_pinned=data.is_pinned,
    )
    db.add(notice)
    db.commit()
    db.refresh(notice)
    return NoticeOut(
        id=notice.id, title=notice.title, content=notice.content,
        audience=notice.audience.value, is_pinned=notice.is_pinned, created_at=notice.created_at
    )


@router.put("/{notice_id}", response_model=NoticeOut)
def update_notice(
    notice_id: str,
    data: NoticeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notice = db.query(Notice).filter(Notice.id == notice_id, Notice.school_id == current_user.school_id).first()
    if not notice:
        raise HTTPException(404, "Notice not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        if k == "audience" and v:
            setattr(notice, k, NoticeAudience(v))
        else:
            setattr(notice, k, v)
    db.commit()
    db.refresh(notice)
    return NoticeOut(
        id=notice.id, title=notice.title, content=notice.content,
        audience=notice.audience.value, is_pinned=notice.is_pinned, created_at=notice.created_at
    )


@router.delete("/{notice_id}", status_code=204)
def delete_notice(notice_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    notice = db.query(Notice).filter(Notice.id == notice_id, Notice.school_id == current_user.school_id).first()
    if not notice:
        raise HTTPException(404, "Notice not found")
    db.delete(notice)
    db.commit()
