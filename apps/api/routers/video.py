"""Video download and streaming endpoints."""
from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse

from config import settings
from middleware.auth_middleware import get_current_user
from models import User

router = APIRouter(prefix="/lectures", tags=["video"])

# Priority order for locating the final rendered video.
_CANDIDATE_NAMES = [
    "final_with_captions.mp4",
    "final.mp4",
    "composed.mp4",
]


def _find_video(lecture_id: str) -> Path | None:
    """Return the first existing MP4 in the lecture output directory."""
    base = Path(settings.MANIM_OUTPUT_DIR) / lecture_id

    # 1. Check well-known filenames
    for name in _CANDIDATE_NAMES:
        candidate = base / name
        if candidate.is_file():
            return candidate

    # 2. Fallback: any .mp4 found recursively
    if base.is_dir():
        mp4s = sorted(base.rglob("*.mp4"))
        if mp4s:
            return mp4s[0]

    return None


@router.get("/{lecture_id}/download")
async def download_video(
    lecture_id: UUID,
    _current_user: User = Depends(get_current_user),
):
    """Download the rendered video as an attachment."""
    video_path = _find_video(str(lecture_id))
    if video_path is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not ready. Pipeline may still be running.",
        )
    return FileResponse(
        path=str(video_path),
        media_type="video/mp4",
        filename=f"{lecture_id}_final.mp4",
        headers={"Content-Disposition": f'attachment; filename="{lecture_id}_final.mp4"'},
    )


@router.get("/{lecture_id}/video")
async def stream_video(
    lecture_id: UUID,
    _current_user: User = Depends(get_current_user),
):
    """Stream the rendered video inline (for browser playback)."""
    video_path = _find_video(str(lecture_id))
    if video_path is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not ready. Pipeline may still be running.",
        )
    return FileResponse(
        path=str(video_path),
        media_type="video/mp4",
    )
