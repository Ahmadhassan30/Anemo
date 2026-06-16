"""Wrapper around faster-whisper for transcription and SRT generation.

The WhisperService is intentionally initialised lazily – calling
whisper_service.load() on first use – to avoid importing a 3 GB model
at Python startup / import time.  Call whisper_service.load() explicitly
at worker startup if you want eager loading.
"""
from __future__ import annotations

import logging
import os
import threading
from pathlib import Path
from typing import TYPE_CHECKING, Any, Dict, List, Optional

import torch

from config import settings

if TYPE_CHECKING:
    from faster_whisper import WhisperModel

logger = logging.getLogger(__name__)


def _format_srt_timestamp(seconds: float) -> str:
    """Convert a float seconds value to SRT timestamp format (HH:MM:SS,mmm)."""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int(round((seconds - int(seconds)) * 1000))
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"


class WhisperService:
    """Run transcription using faster-whisper.

    Designed as a singleton – see module-level ``whisper_service`` below.
    The underlying WhisperModel is **not** created at import time; it is
    initialised on the first call to :meth:`transcribe` or :meth:`load`.
    """

    def __init__(self) -> None:
        self._model: Optional["WhisperModel"] = None
        self._lock = threading.Lock()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def load(self) -> None:
        """Eagerly load the model.  Safe to call multiple times (no-op after first load)."""
        if self._model is not None:
            return
        with self._lock:
            if self._model is not None:
                return
            self._model = self._build_model()

    def transcribe(self, audio_path: str) -> Dict[str, Any]:
        """Transcribe a local audio file using faster-whisper.

        Enables automatic language detection (handles Urdu-English code-switching).

        Args:
            audio_path: Local path to the WAV / MP3 file to transcribe.

        Returns:
            A dict with shape::

                {
                    "segments": [
                        {
                            "start": float,
                            "end": float,
                            "text": str,
                            "language": str,   # detected language for this segment
                        },
                        ...
                    ],
                    "language": str,    # dominant detected language
                    "duration": float,  # total audio duration in seconds
                }
        """
        self.load()
        assert self._model is not None  # always true after load()

        logger.info("Transcribing %s", audio_path)
        raw_segments, info = self._model.transcribe(
            str(Path(audio_path).resolve()),
            language=None,          # auto-detect
            beam_size=5,
            vad_filter=True,
        )

        dominant_language: str = info.language
        segments: List[Dict[str, Any]] = []
        duration: float = 0.0

        for seg in raw_segments:
            # faster-whisper reports a language per segment when language=None
            seg_language = getattr(seg, "language", dominant_language) or dominant_language
            segments.append(
                {
                    "start": seg.start,
                    "end": seg.end,
                    "text": seg.text.strip(),
                    "language": seg_language,
                }
            )
            duration = max(duration, seg.end)

        return {
            "segments": segments,
            "language": dominant_language,
            "duration": duration,
        }

    def generate_srt(self, segments: List[Dict[str, Any]], output_path: str) -> str:
        """Convert transcription segment dicts to an SRT subtitle file.

        Args:
            segments: The ``"segments"`` list from :meth:`transcribe`.
            output_path: Destination path for the ``.srt`` file.

        Returns:
            Absolute path to the written SRT file.
        """
        out = Path(output_path)
        out.parent.mkdir(parents=True, exist_ok=True)

        lines: List[str] = []
        for idx, seg in enumerate(segments, start=1):
            start_ts = _format_srt_timestamp(seg["start"])
            end_ts = _format_srt_timestamp(seg["end"])
            lines.append(str(idx))
            lines.append(f"{start_ts} --> {end_ts}")
            lines.append(seg["text"])
            lines.append("")  # blank line between entries

        out.write_text("\n".join(lines), encoding="utf-8")
        logger.info("SRT written to %s (%d segments)", out, len(segments))
        return str(out.resolve())

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _build_model() -> "WhisperModel":
        """Instantiate the WhisperModel. Called at most once."""
        from faster_whisper import WhisperModel  # local import – heavy dependency

        device = "cuda" if torch.cuda.is_available() else "cpu"
        compute_type = "float16" if device == "cuda" else "int8"

        logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        logger.info(f"Loading Whisper model: {settings.WHISPER_MODEL_SIZE}")
        logger.info("If this is your first run, the model will download now.")
        logger.info("large-v3 is ~3GB — this may take several minutes.")
        logger.info("This only happens once. Do not restart the worker.")
        logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

        model = WhisperModel(
            settings.WHISPER_MODEL_SIZE,
            device=device,
            compute_type=compute_type,
        )

        logger.info(f"✓ Whisper {settings.WHISPER_MODEL_SIZE} loaded successfully")
        return model


# ---------------------------------------------------------------------------
# Module-level singleton – loaded once at worker startup, not per-request.
# Agent/task code should use this object directly.
# ---------------------------------------------------------------------------
whisper_service = WhisperService()

