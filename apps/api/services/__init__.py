"""Service layer package exports."""
from .rag_service import RagService
from .youtube_service import YouTubeService
from .whisper_service import WhisperService, whisper_service
from .manim_service import ManimService
from .ffmpeg_service import (
    FfmpegService,
    extract_audio,
    concat_clips,
    overlay_audio,
    burn_captions,
    get_video_duration,
)
from .llm_service import LlmService

__all__ = [
    # Classes
    "RagService",
    "YouTubeService",
    "WhisperService",
    "ManimService",
    "FfmpegService",
    "LlmService",
    # Singletons
    "whisper_service",
    # Module-level ffmpeg helpers
    "extract_audio",
    "concat_clips",
    "overlay_audio",
    "burn_captions",
    "get_video_duration",
]

