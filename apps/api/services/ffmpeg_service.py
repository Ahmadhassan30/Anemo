"""Service for ffmpeg composition and audio sync."""
import asyncio
import os
import tempfile
from pathlib import Path
from typing import List
import httpx


async def extract_audio(video_url: str, output_path: str) -> str:
    """Download video from URL and extract 16kHz mono WAV audio using ffmpeg."""
    suffix = ".mp4"
    if "/" in video_url:
        last_part = video_url.split("/")[-1]
        if "." in last_part:
            suffix = f".{last_part.split('.')[-1]}"

    # 1. Use httpx.AsyncClient to stream-download the video URL to a temp file.
    # We close the file descriptor immediately to avoid Windows locking issues during ffmpeg execution.
    fd, temp_video_path = tempfile.mkstemp(suffix=suffix)
    os.close(fd)

    try:
        async with httpx.AsyncClient() as client:
            async with client.stream("GET", video_url) as response:
                response.raise_for_status()
                with open(temp_video_path, "wb") as f:
                    async for chunk in response.aiter_bytes():
                        f.write(chunk)

        # Ensure output directory exists
        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)

        # 2. Run ffmpeg to extract 16kHz mono WAV from the temp file
        cmd = [
            "ffmpeg",
            "-y",
            "-i",
            temp_video_path,
            "-ar",
            "16000",
            "-ac",
            "1",
            "-c:a",
            "pcm_s16le",
            output_path,
        ]
        process = await asyncio.create_subprocess_exec(
            *cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await process.communicate()
        if process.returncode != 0:
            raise RuntimeError(f"ffmpeg failed with exit code {process.returncode}: {stderr.decode()}")

    finally:
        # 3. Clean up the temp video file
        if os.path.exists(temp_video_path):
            os.remove(temp_video_path)

    # 4. Return path to WAV file
    return output_path


class FfmpegService:
    """Compose video clips with audio and captions."""

    def concat_clips(self, clip_paths: list[str]) -> str:
        # TODO: concatenate clips with ffmpeg
        pass

    def overlay_voice(self, video_path: str, audio_path: str) -> str:
        # TODO: overlay voice narration
        pass

