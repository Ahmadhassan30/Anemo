"""Transcription agent using faster-whisper large-v3."""
from agents.base import BaseAgent


class TranscriptionAgent(BaseAgent):
    """Transcribe audio with language auto-detection."""

    name = "transcription"

    async def run(self, lecture_id: str) -> None:
        # TODO: call whisper service and store segments
        pass
