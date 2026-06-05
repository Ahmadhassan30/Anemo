"""Service for ffmpeg composition and audio sync."""
from pathlib import Path
from typing import List

class FfmpegService:
    """Compose video clips with audio and captions."""

    def concat_clips(self, clip_paths: list[str]) -> str:
        # TODO: concatenate clips with ffmpeg
        pass

    def overlay_voice(self, video_path: str, audio_path: str) -> str:
        # TODO: overlay voice narration
        pass
