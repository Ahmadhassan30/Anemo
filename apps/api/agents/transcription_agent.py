"""Transcription agent using faster-whisper large-v3."""
import asyncio
import logging

from sqlalchemy.ext.asyncio import AsyncSession

from agents.base import BaseAgent
from services.whisper_service import whisper_service

logger = logging.getLogger(__name__)


class TranscriptionAgent(BaseAgent):
    """Transcribe audio with language auto-detection."""

    name = "transcription_agent"

    async def run(self, lecture_id: str, db: AsyncSession, **kwargs) -> dict:
        """Run Whisper transcription on the extracted audio file.

        Args:
            **kwargs: Must include ``audio_path`` (str).

        Returns:
            {"transcript": dict}  — the dict from WhisperService.transcribe().
        """
        audio_path: str = kwargs.get("audio_path", "")
        if not audio_path:
            raise RuntimeError("audio_path not provided to TranscriptionAgent")

        logger.info("Transcribing audio for lecture %s: %s", lecture_id, audio_path)

        # whisper_service.transcribe is synchronous (CPU-bound model inference),
        # so we run it in a thread to avoid blocking the event loop.
        transcript = await asyncio.to_thread(whisper_service.transcribe, audio_path)

        seg_count = len(transcript.get("segments", []))
        lang = transcript.get("language", "unknown")
        duration = transcript.get("duration", 0)
        logger.info(
            "Transcription complete: %d segments, language=%s, duration=%.1fs",
            seg_count, lang, duration,
        )

        return {"transcript": transcript}
