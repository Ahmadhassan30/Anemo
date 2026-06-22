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

    Used when TTS times out/fails so the pipeline can still sync the scene
    instead of stalling. Falls back to an empty file if ffmpeg is unavailable.
    """
    try:
        import ffmpeg  # local import; ffmpeg-python is already a dependency
        (
            ffmpeg
            .input(f"anullsrc=r=24000:cl=mono", f="lavfi", t=seconds)
            .output(str(out), acodec="libmp3lame", **{"qscale:a": 9})
            .overwrite_output()
            .run(quiet=True)
        )
    except Exception:
        out.write_bytes(b"")


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
    except (asyncio.TimeoutError, Exception) as e:
        logger.warning("TTS failed/timed out (%s); using silent placeholder for %s", e, out)
        _write_silence(out)
        return str(out.resolve())

    logger.info("TTS saved: %s (%d bytes)", out, out.stat().st_size)
    return str(out.resolve())

class TTSService:
    async def synthesize(self, text: str, output_path: str, voice: str = DEFAULT_VOICE) -> str:
        return await synthesize_speech(text, output_path, voice=voice)


tts_service = TTSService()
