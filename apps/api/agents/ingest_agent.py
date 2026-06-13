"""Ingest agent for validating uploads and extracting audio."""
import logging
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from agents.base import BaseAgent
from models.lecture import Lecture
from services.ffmpeg_service import extract_audio

logger = logging.getLogger(__name__)


class IngestAgent(BaseAgent):
    """Validate uploads, download raw video, and extract audio track."""

    name = "ingest_agent"

    async def run(self, lecture_id: str, db: AsyncSession, **kwargs) -> dict:
        """Download the raw video from UploadThing and extract 16kHz mono WAV.

        Returns:
            {"video_url": str, "audio_path": str}
        """
        # Fetch the lecture to get the raw_video_url (UploadThing CDN link)
        result = await db.execute(select(Lecture).where(Lecture.id == lecture_id))
        lecture = result.scalar_one_or_none()
        if not lecture or not lecture.raw_video_url:
            raise RuntimeError(f"Lecture {lecture_id} not found or has no raw_video_url")

        video_url = lecture.raw_video_url
        logger.info("Ingesting lecture %s from %s", lecture_id, video_url)

        # Ensure output directory exists
        output_dir = Path("/tmp/lectures") / str(lecture_id)
        output_dir.mkdir(parents=True, exist_ok=True)
        audio_output = str(output_dir / "audio.wav")

        # Extract audio (downloads video, extracts 16kHz mono WAV)
        audio_path = await extract_audio(video_url, audio_output)

        logger.info("Ingest complete: audio at %s", audio_path)
        return {"video_url": video_url, "audio_path": audio_path}
