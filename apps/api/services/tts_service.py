"""Text-to-speech for professional narration audio."""
import asyncio
import logging
from pathlib import Path

import edge_tts

logger = logging.getLogger(__name__)

DEFAULT_VOICE = "en-US-GuyNeural"


async def synthesize_speech(
    text: str,
    output_path: str,
    *,
    voice: str = DEFAULT_VOICE,
) -> str:
    """Synthesize narration audio and return the output WAV path."""
    if not text.strip():
        raise ValueError("Cannot synthesize empty narration text")

    out = Path(output_path)
    out.parent.mkdir(parents=True, exist_ok=True)

    # edge-tts writes MP3; we keep .mp3 extension for ffmpeg compatibility
    if out.suffix.lower() != ".mp3":
        out = out.with_suffix(".mp3")

    communicate = edge_tts.Communicate(text=text.strip(), voice=voice)
    await communicate.save(str(out))

    logger.info("TTS saved: %s (%d bytes)", out, out.stat().st_size)
    return str(out.resolve())

class TTSService:
    async def synthesize(self, text: str, output_path: str, voice: str = DEFAULT_VOICE) -> str:
        return await synthesize_speech(text, output_path, voice=voice)


tts_service = TTSService()
