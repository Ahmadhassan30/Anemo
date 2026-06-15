"""Service for ffmpeg composition, audio extraction, and caption burning."""
import asyncio
import logging
import os
import tempfile
from pathlib import Path
from typing import List

import ffmpeg
import httpx

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Internal helper
# ---------------------------------------------------------------------------

def _run_ffmpeg_sync(stream) -> None:
    """Execute an ffmpeg-python stream graph, raising RuntimeError on failure."""
    try:
        stream.run(quiet=True, overwrite_output=True)
    except ffmpeg.Error as exc:
        stderr = exc.stderr.decode(errors="replace") if exc.stderr else str(exc)
        raise RuntimeError(f"ffmpeg error: {stderr}") from exc


# ---------------------------------------------------------------------------
# Public module-level functions
# ---------------------------------------------------------------------------

async def extract_audio(video_url: str, output_path: str) -> str:
    """Download video from a CDN URL and extract 16 kHz mono WAV audio.

    Uses asyncio.to_thread so the synchronous ffmpeg call does not block the
    event loop.  The temporary video file is always cleaned up.

    Args:
        video_url: HTTPS URL of the source video (e.g. UploadThing CDN).
        output_path: Destination path for the WAV file.

    Returns:
        Absolute path to the written WAV file.
    """
    # Derive a sensible suffix from the URL
    url_stem = video_url.split("?")[0].split("/")[-1]
    suffix = Path(url_stem).suffix or ".mp4"

    # Close the fd immediately – Windows cannot open a file that is already open
    fd, tmp_video = tempfile.mkstemp(suffix=suffix)
    os.close(fd)
    tmp_video_path = Path(tmp_video)

    try:
        # Stream-download the video
        async with httpx.AsyncClient(timeout=600) as client:
            async with client.stream("GET", video_url) as response:
                response.raise_for_status()
                with tmp_video_path.open("wb") as f:
                    async for chunk in response.aiter_bytes(chunk_size=65536):
                        f.write(chunk)

        out = Path(output_path)
        out.parent.mkdir(parents=True, exist_ok=True)

        # Build the ffmpeg graph and run in a thread
        stream = (
            ffmpeg
            .input(str(tmp_video_path))
            .audio
            .output(
                str(out),
                ar=16000,
                ac=1,
                acodec="pcm_s16le",
            )
        )
        await asyncio.to_thread(_run_ffmpeg_sync, stream)

    finally:
        if tmp_video_path.exists():
            tmp_video_path.unlink(missing_ok=True)

    return str(Path(output_path).resolve())


async def concat_clips(clip_paths: List[str], output_path: str) -> str:
    """Concatenate MP4 clips in order using the ffmpeg concat filter (re-encoding for safety).

    Args:
        clip_paths: Ordered list of local MP4 file paths.
        output_path: Destination path for the joined video.

    Returns:
        Absolute path to the concatenated output.
    """
    if not clip_paths:
        raise ValueError("clip_paths must not be empty")

    out = Path(output_path)
    out.parent.mkdir(parents=True, exist_ok=True)

    inputs = [ffmpeg.input(str(Path(p).resolve())) for p in clip_paths]
    
    # Pair and flatten the video and audio streams of each input file
    streams = []
    for inp in inputs:
        streams.append(inp.video)
        streams.append(inp.audio)
        
    # Concatenate the streams
    joined = ffmpeg.concat(*streams, v=1, a=1)
    
    stream = ffmpeg.output(
        joined.node['v'],
        joined.node['a'],
        str(out),
        vcodec="libx264",
        acodec="aac",
        pix_fmt="yuv420p",
    )
    await asyncio.to_thread(_run_ffmpeg_sync, stream)
    return str(out.resolve())


async def overlay_audio(
    video_path: str,
    audio_path: str,
    output_path: str,
    ts_start: float,
    ts_end: float,
) -> str:
    """Extract an audio segment from the professor recording and overlay it onto a clip.

    If the video clip is longer than the audio segment, it is sped up using
    the 'setpts' filter to fit the audio duration. If the video is shorter,
    it is padded with its last frame using the 'tpad' filter.

    Args:
        video_path: Local path to the silent video clip.
        audio_path: Local path to the full professor audio track.
        output_path: Destination path for the merged output.
        ts_start: Start timestamp (seconds) into the professor audio.
        ts_end: End timestamp (seconds) into the professor audio.

    Returns:
        Absolute path to the output video file.
    """
    duration = ts_end - ts_start
    if duration <= 0:
        raise ValueError(f"ts_end ({ts_end}) must be greater than ts_start ({ts_start})")

    out = Path(output_path)
    out.parent.mkdir(parents=True, exist_ok=True)

    video_duration = get_video_duration(video_path)
    video_in = ffmpeg.input(str(Path(video_path).resolve()))
    audio_in = ffmpeg.input(
        str(Path(audio_path).resolve()),
        ss=ts_start,
        t=duration,
    )

    if video_duration > duration:
        # Speed up the video to fit the audio duration
        pts_ratio = duration / video_duration
        processed_video = video_in.video.filter('setpts', f"{pts_ratio}*PTS")
        logger.info(f"Speeding up video {video_path} from {video_duration:.2f}s to {duration:.2f}s (ratio {pts_ratio:.3f})")
    else:
        # Pad video with its last frame if it's shorter than audio duration
        processed_video = video_in.video.filter('tpad', stop_mode='clone', stop=-1)
        logger.info(f"Padding video {video_path} from {video_duration:.2f}s to {duration:.2f}s")

    stream = ffmpeg.output(
        processed_video,
        audio_in.audio,
        str(out),
        vcodec="libx264",
        acodec="aac",
        t=duration,
    )
    await asyncio.to_thread(_run_ffmpeg_sync, stream)
    return str(out.resolve())


async def burn_captions(
    video_path: str,
    srt_path: str,
    output_path: str,
) -> str:
    """Burn SRT subtitles directly into the video stream, keeping the audio stream.

    Args:
        video_path: Local path to the source video.
        srt_path: Local path to the .srt subtitle file.
        output_path: Destination path for the captioned video.

    Returns:
        Absolute path to the output video.
    """
    out = Path(output_path)
    out.parent.mkdir(parents=True, exist_ok=True)

    # On Windows the subtitles filter requires forward-slash paths with
    # escaped colons; on Linux raw paths work fine.
    srt_escaped = str(Path(srt_path).resolve()).replace("\\", "/").replace(":", "\\:")

    input_file = ffmpeg.input(str(Path(video_path).resolve()))
    stream = ffmpeg.output(
        input_file.video.filter("subtitles", srt_escaped),
        input_file.audio,
        str(out),
        vcodec="libx264",
        acodec="copy",
    )
    await asyncio.to_thread(_run_ffmpeg_sync, stream)
    return str(out.resolve())


def get_video_duration(path: str) -> float:
    """Return the duration of a local video/audio file in seconds using ffprobe.

    Args:
        path: Local filesystem path to the media file.

    Returns:
        Duration in seconds as a float.

    Raises:
        RuntimeError: If ffprobe fails or the duration cannot be read.
    """
    try:
        probe = ffmpeg.probe(str(Path(path).resolve()))
    except ffmpeg.Error as exc:
        stderr = exc.stderr.decode(errors="replace") if exc.stderr else str(exc)
        raise RuntimeError(f"ffprobe error: {stderr}") from exc

    # Prefer the top-level format duration; fall back to the first stream
    fmt_duration = probe.get("format", {}).get("duration")
    if fmt_duration is not None:
        return float(fmt_duration)

    for stream in probe.get("streams", []):
        if "duration" in stream:
            return float(stream["duration"])

    raise RuntimeError(f"Could not determine duration for: {path}")


# ---------------------------------------------------------------------------
# Legacy class wrapper kept for backwards-compat with services/__init__.py
# ---------------------------------------------------------------------------

class FfmpegService:
    """Thin façade exposing module-level helpers as instance methods."""

    async def extract_audio(self, video_url: str, output_path: str) -> str:
        return await extract_audio(video_url, output_path)

    async def concat_clips(self, clip_paths: List[str], output_path: str) -> str:
        return await concat_clips(clip_paths, output_path)

    async def overlay_audio(
        self,
        video_path: str,
        audio_path: str,
        output_path: str,
        ts_start: float,
        ts_end: float,
    ) -> str:
        return await overlay_audio(video_path, audio_path, output_path, ts_start, ts_end)

    async def burn_captions(
        self, video_path: str, srt_path: str, output_path: str
    ) -> str:
        return await burn_captions(video_path, srt_path, output_path)

    def get_video_duration(self, path: str) -> float:
        return get_video_duration(path)
