"""Lecture CRUD routes and UploadThing confirmation helper."""
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from db.session import get_db
from middleware.auth_middleware import get_current_user, require_professor
from models import Lecture, LectureStatus, User, UserRole
from schemas.lecture import (
    LectureConfirmUpload,
    LectureCreate,
    LectureCreateResponse,
    LectureRead,
)

router = APIRouter(prefix="/lectures", tags=["lectures"])


@router.get("", response_model=list[LectureRead])
async def list_lectures(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Lecture]:
    """List lectures. Professors see only their own, students see all."""
    if current_user.role == UserRole.professor:
        statement = select(Lecture).where(Lecture.professor_id == current_user.id)
    else:
        statement = select(Lecture)
    result = await db.execute(statement)
    return list(result.scalars().all())


@router.post("", response_model=LectureCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_lecture(
    payload: LectureCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_professor),
) -> LectureCreateResponse:
    """Create a new lecture. Returns the ID to client for direct UploadThing upload."""
    lecture = Lecture(
        professor_id=current_user.id,
        title=payload.title,
        raw_video_url="",  # UploadThing URL will be filled in confirm-upload
        status=LectureStatus.pending,
    )
    db.add(lecture)
    await db.commit()
    await db.refresh(lecture)
    return LectureCreateResponse(lecture_id=lecture.id, title=lecture.title)


@router.get("/{lecture_id}")
async def get_lecture(
    lecture_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch a lecture (with its concepts) by its ID.

    Concepts are eager-loaded and returned so the student viewer can render
    chapter markers / citation-seek and the professor can see the concept list.
    (The old LectureRead response_model silently dropped concepts.)
    """
    result = await db.execute(
        select(Lecture)
        .options(selectinload(Lecture.concepts))
        .where(Lecture.id == lecture_id)
    )
    lecture = result.scalar_one_or_none()
    if not lecture:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lecture not found")

    def _enum(v):
        return v.value if hasattr(v, "value") else (str(v) if v is not None else None)

    return {
        "id": str(lecture.id),
        "title": lecture.title,
        "status": _enum(lecture.status),
        "raw_video_url": lecture.raw_video_url,
        "youtube_url": lecture.youtube_url,
        "created_at": lecture.created_at.isoformat() if lecture.created_at else None,
        "concepts": [
            {
                "id": str(c.id),
                "concept": c.title,
                "title": c.title,
                "ts_start": c.ts_start,
                "ts_end": c.ts_end,
                "visual_type": c.visual_type,
                "render_status": _enum(c.render_status),
                "clip_url": c.clip_url,
            }
            for c in sorted(lecture.concepts, key=lambda x: x.ts_start)
        ],
    }


@router.post("/{lecture_id}/confirm-upload", response_model=LectureRead)
async def confirm_upload(
    lecture_id: UUID,
    payload: LectureConfirmUpload,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_professor),
) -> Lecture:
    """Confirm direct upload from UploadThing by updating database record."""
    result = await db.execute(select(Lecture).where(Lecture.id == lecture_id))
    lecture = result.scalar_one_or_none()
    if not lecture:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lecture not found")

    if lecture.professor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to update this lecture",
        )

    lecture.raw_video_url = payload.video_url
    lecture.status = LectureStatus.pending
    await db.commit()
    await db.refresh(lecture)
    return lecture


@router.delete("/{lecture_id}", status_code=status.HTTP_200_OK)
async def delete_lecture(
    lecture_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a lecture and associated metadata."""
    result = await db.execute(select(Lecture).where(Lecture.id == lecture_id))
    lecture = result.scalar_one_or_none()
    if not lecture:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lecture not found")

    # Only the owner (professor) can delete it
    if current_user.role == UserRole.professor and lecture.professor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this lecture",
        )

    await db.delete(lecture)
    await db.commit()
    return {"status": "success"}

