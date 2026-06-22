"""Text-to-speech for professional narration audio."""
import asyncio
import logging
from pathlib import Path

import edge_tts

from config import settings

logger = logging.getLogger(__name__)

DEFAULT_VOICE = "en-US-GuyNeural"


def _write_silence(out: Path, seconds: float = 2.0) -> None:
    """Write a short silent MP3 placeholder via ffmpeg.

    Used when TTS times out/fails so the pipeline can still proceed. RAISES if a
    valid (non-empty) file can't be produced — callers must never treat a broken
    placeholder as success (a 0-byte mp3 crashes the downstream ffprobe).
    """
    import ffmpeg  # ffmpeg-python is already a dependency
    (
        ffmpeg
        .input("anullsrc=r=24000:cl=mono", f="lavfi", t=seconds)
        .output(str(out), acodec="libmp3lame", **{"qscale:a": 9})
        .overwrite_output()
        .run(quiet=True)
    )
    if not out.exists() or out.stat().st_size == 0:
        raise RuntimeError("silent-placeholder generation produced an empty file")


async def synthesize_speech(
    text: str,
    output_path: str,
    *,
    voice: str = DEFAULT_VOICE,
) -> str:
    """Synthesize narration audio and return the output MP3 path.

    Bounded by ``settings.TTS_TIMEOUT``; on timeout/failure we drop in a short
    silent placeholder so one stuck synthesis can't hang the whole pipeline.
    """
    if not text.strip():
        raise ValueError("Cannot synthesize empty narration text")

    out = Path(output_path)
    out.parent.mkdir(parents=True, exist_ok=True)

    # edge-tts writes MP3; we keep .mp3 extension for ffmpeg compatibility
    if out.suffix.lower() != ".mp3":
        out = out.with_suffix(".mp3")

    communicate = edge_tts.Communicate(text=text.strip(), voice=voice)
    try:
        await asyncio.wait_for(communicate.save(str(out)), timeout=settings.TTS_TIMEOUT)
    except Exception as e:
        logger.warning("TTS failed/timed out (%s); writing silent placeholder for %s", e, out)
        _write_silence(out)  # raises if it cannot produce a valid file

    # Never return a missing/empty file as success — the caller probes it next.
    if not out.exists() or out.stat().st_size == 0:
        raise RuntimeError(f"TTS produced no usable audio for {out}")

    logger.info("TTS saved: %s (%d bytes)", out, out.stat().st_size)
    return str(out.resolve())

class TTSService:
    async def synthesize(self, text: str, output_path: str, voice: str = DEFAULT_VOICE) -> str:
        return await synthesize_speech(text, output_path, voice=voice)


tts_service = TTSService()
