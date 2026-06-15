"""Service layer package exports."""
from .rag_service import RAGService, rag_service
from .youtube_service import YouTubeService
from .whisper_service import WhisperService, whisper_service
from .manim_service import ManimService, render_scene, ManimRenderError
from .ffmpeg_service import (
    FfmpegService,
    extract_audio,
    concat_clips,
    overlay_audio,
    sync_video_to_audio,
    burn_captions,
    get_video_duration,
    get_audio_duration,
    generate_srt_from_segments,
)
from .llm_service import LLMService, LLMError, llm_service

__all__ = [
    # Classes
    "RAGService",
    "YouTubeService",
    "WhisperService",
    "ManimService",
    "FfmpegService",
    "LLMService",
    "LLMError",
    "ManimRenderError",
    # Singletons
    "whisper_service",
    "llm_service",
    "rag_service",
    # Module-level helpers
    "extract_audio",
    "concat_clips",
    "overlay_audio",
    "sync_video_to_audio",
    "burn_captions",
    "get_video_duration",
    "get_audio_duration",
    "generate_srt_from_segments",
    "render_scene",
]

