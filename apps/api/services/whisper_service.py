"""Wrapper around faster-whisper transcription."""
from typing import List


class WhisperService:
    """Run transcription and return segments."""

    def transcribe(self, audio_path: str) -> List[dict]:
        # TODO: call faster-whisper with language auto-detect
        pass
