"""Video download / inline-streaming routes.

The pipeline renders and composes the final lecture video inside the worker
container under ``MANIM_OUTPUT_DIR/{lecture_id}/``. With the shared
``manim_output`` volume (see infra/docker-compose.yml) those files are visible
to the API container, so we can serve them directly with ``FileResponse``.
"""
import logging
from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse

from config import settings
from middleware.auth_middleware import get_current_user
from models import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/lectures", tags=["video"])

_NOT_READY = "Video not ready. Pipeline may still be running."


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


@router.get("/{lecture_id}/download")
async def download_video(
    lecture_id: UUID,
    current_user: User = Depends(get_current_user),
) -> FileResponse:
    """Download the final rendered video as a file attachment."""
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
    current_user: User = Depends(get_current_user),
) -> FileResponse:
    """Serve the final rendered video inline for in-page playback."""
    path = _resolve_video(lecture_id)
    if path is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=_NOT_READY)

    return FileResponse(path=str(path), media_type="video/mp4")
