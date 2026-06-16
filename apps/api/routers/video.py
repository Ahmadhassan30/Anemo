"""Video download / inline-streaming routes.

The pipeline renders and composes the final lecture video inside the worker
container under ``MANIM_OUTPUT_DIR/{lecture_id}/``. With the shared
``manim_output`` volume (see infra/docker-compose.yml) those files are visible
to the API container, so we can serve them directly with ``FileResponse``.
"""
import logging
from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import FileResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt, JWTError
from jose.exceptions import ExpiredSignatureError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from db.session import get_db
from models import User, Lecture, UserRole, enrollments

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/lectures", tags=["video"])

_NOT_READY = "Video not ready. Pipeline may still be running."

bearer_scheme = HTTPBearer(auto_error=False)


async def get_video_user(
    token: str | None = Query(None, description="Auth token passed via query parameter"),
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Retrieve user from bearer header or query parameter JWT token."""
    token_str = None
    if credentials and credentials.scheme.lower() == "bearer":
        token_str = credentials.credentials
    elif token:
        token_str = token

    if not token_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = jwt.decode(token_str, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except ExpiredSignatureError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    subject = payload.get("sub")
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token subject",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_id = UUID(str(subject))
        statement = select(User).where(User.id == user_id)
    except ValueError:
        statement = select(User).where(User.email == subject)

    result = await db.execute(statement)
    user = result.scalar_one_or_none()
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def _resolve_video(lecture_id: UUID) -> Path | None:
    """Locate the best available rendered video for a lecture.

    Search order (most-finished first), then any mp4 as a last resort.
    """
    base = Path(settings.MANIM_OUTPUT_DIR) / str(lecture_id)
    if not base.exists():
        return None

    for name in ("final_with_captions.mp4", "final.mp4", "composed.mp4"):
        candidate = base / name
        if candidate.is_file():
            return candidate

    # Last resort: any rendered mp4 anywhere under the lecture's output dir.
    found = sorted(base.rglob("*.mp4"))
    return found[0] if found else None


async def _authorize_access(db: AsyncSession, lecture_id: UUID, user: User) -> None:
    """Only the owning professor or an enrolled student may access a video."""
    res = await db.execute(select(Lecture).where(Lecture.id == lecture_id))
    lecture = res.scalar_one_or_none()
    if lecture is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lecture not found")
    if user.role == UserRole.professor:
        if lecture.professor_id != user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your lecture")
        return
    enr = await db.execute(
        select(enrollments).where(
            enrollments.c.student_id == user.id,
            enrollments.c.lecture_id == lecture_id,
        )
    )
    if enr.first() is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enrolled in this lecture")


@router.get("/{lecture_id}/download")
async def download_video(
    lecture_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_video_user),
) -> FileResponse:
    """Download the final rendered video as a file attachment."""
    await _authorize_access(db, lecture_id, current_user)
    path = _resolve_video(lecture_id)
    if path is None:
        logger.info("Download requested but no video found for lecture %s", lecture_id)
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=_NOT_READY)

    return FileResponse(
        path=str(path),
        media_type="video/mp4",
        filename=f"lecture-{str(lecture_id)[:8]}.mp4",
        headers={
            "Content-Disposition": f'attachment; filename="lecture-{str(lecture_id)[:8]}.mp4"'
        },
    )


@router.get("/{lecture_id}/video")
async def stream_video(
    lecture_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_video_user),
) -> FileResponse:
    """Serve the final rendered video inline for in-page playback."""
    await _authorize_access(db, lecture_id, current_user)
    path = _resolve_video(lecture_id)
    if path is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=_NOT_READY)

    return FileResponse(path=str(path), media_type="video/mp4")

