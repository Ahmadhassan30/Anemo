"""Pipeline trigger and SSE stream routes."""
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.session import get_db
from middleware.auth_middleware import require_professor
from models import Lecture, LectureStatus, User

router = APIRouter(prefix="/pipeline", tags=["pipeline"])


@router.post("/{lecture_id}/trigger")
async def trigger_pipeline(
    lecture_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_professor),
):
    result = await db.execute(select(Lecture).where(Lecture.id == lecture_id))
    lecture = result.scalar_one_or_none()
    if not lecture:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lecture not found")

    if lecture.professor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to trigger pipeline for this lecture",
        )

    # Update status to processing to start agent workflow
    lecture.status = LectureStatus.processing
    await db.commit()
    return {"status": "success", "lecture_id": lecture_id}


@router.get("/{lecture_id}/stream")
async def stream_pipeline(lecture_id: UUID):
    # TODO: stream SSE events for lecture pipeline
    pass

