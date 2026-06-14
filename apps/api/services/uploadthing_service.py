import shutil
from pathlib import Path
from config import settings


def get_final_video_url(lecture_id: str) -> str:
    return f"/static/{lecture_id}/final.mp4"


def get_final_video_path(lecture_id: str) -> Path:
    return Path(settings.MANIM_OUTPUT_DIR) / lecture_id / "final.mp4"


async def upload_file(file_path: str) -> str:
    """
    Dev mode: copies final video to static serving directory.
    TODO: Replace with real cloud upload in production.
    """
    src = Path(file_path)
    lecture_id = src.parent.name
    dest_dir = Path(settings.MANIM_OUTPUT_DIR) / lecture_id
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest = dest_dir / "final.mp4"
    shutil.copy2(str(src), str(dest))
    return f"/static/{lecture_id}/final.mp4"


class UploadthingService:
    async def upload_file(self, file_path: str) -> str:
        return await upload_file(file_path)


uploadthing_service = UploadthingService()
