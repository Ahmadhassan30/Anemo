"""Local static file URL helpers for pipeline outputs.

During development, Manim-generated clips and final composed videos are
saved to the local filesystem and served via FastAPI's StaticFiles mount.
The browser-side professor upload goes directly to UploadThing CDN —
the API never handles that upload.
"""
# TODO: upload to S3/Cloudflare R2 in production for final composed videos
from pathlib import Path

from config import settings


def get_final_video_url(lecture_id: str) -> str:
    """Return the local static URL for a composed final video.

    In production this would return an S3/R2 URL instead.
    """
    # TODO: upload to S3/Cloudflare R2 in production
    return f"/static/{lecture_id}/final.mp4"


def get_final_video_path(lecture_id: str) -> Path:
    """Return the local filesystem path for a composed final video."""
    return Path(settings.MANIM_OUTPUT_DIR) / lecture_id / "final.mp4"
