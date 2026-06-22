"""Service for ffmpeg composition, audio extraction, and caption burning."""
import asyncio
import logging
import os
import re
import tempfile
from pathlib import Path
from typing import List

import ffmpeg
import httpx


logger = logging.getLogger(__name__)

# High-quality H.264 encode tuned for flat-color animation. CRF 18 is visually
# lossless; -tune animation favors clean edges; faststart enables web streaming.
_VIDEO_QUALITY = {
    "vcodec": "libx264",
    "pix_fmt": "yuv420p",
    "crf": 18,
    "preset": "medium",
    "tune": "animation",
}
# Loudness normalization to broadcast target (EBU R128) for consistent narration.
_LOUDNORM = "loudnorm=I=-16:TP=-1.5:LRA=11"

# Premium caption styling baked into a generated ASS file (libass). Burning an
# ASS file avoids the fragile comma/space escaping that `force_style=` requires.
# Colours are &HAABBGGRR (alpha-blue-green-red). Light ink on a translucent box.
_ASS_HEADER = """[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Caption,DejaVu Sans,46,&H00F3EDE6,&H000000FF,&H00120D08,&H99000000,-1,0,0,0,100,100,0,0,3,2,0,2,170,170,80,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""


def build_caption_cues(text: str, start: float, end: float) -> List[dict]:
    """Split narration into sentence-level cues timed across [start, end].

    Replaces the old single-block-per-concept caption with readable, paced
    sentences so the screen never shows a wall of text.
    """
    text = (text or "").strip()
    if not text:
        return []
    sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]
    if not sentences:
        return []
    span = max(end - start, 0.3)
    total_chars = sum(len(s) for s in sentences) or 1
    cues: List[dict] = []
    t = start
    for s in sentences:
        dur = span * (len(s) / total_chars)
        cues.append({"start": round(t, 3), "end": round(min(t + dur, end), 3), "text": s})
        t += dur
    return cues


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
        acodec="aac",
        **_VIDEO_QUALITY,
        **{"b:a": "192k"},
    )
    await asyncio.to_thread(_run_ffmpeg_sync, stream)
    return str(out.resolve())


async def sync_video_to_audio(
    video_path: str,
    audio_path: str,
    output_path: str,
) -> str:
    """Match a silent animation clip to a narration track without speeding up."""
    audio_duration = get_audio_duration(audio_path)
    if audio_duration <= 0:
        raise ValueError(f"Invalid audio duration for: {audio_path}")

    out = Path(output_path)
    out.parent.mkdir(parents=True, exist_ok=True)

    video_duration = get_video_duration(video_path)
    video_in = ffmpeg.input(str(Path(video_path).resolve()))
    audio_in = ffmpeg.input(str(Path(audio_path).resolve()))

    if video_duration > audio_duration:
        pts_ratio = audio_duration / video_duration
        processed_video = video_in.video.filter("setpts", f"{pts_ratio}*PTS")
        logger.info(
            "Slowing video %s from %.2fs to %.2fs",
            video_path, video_duration, audio_duration,
        )
    elif video_duration < audio_duration:
        pad_seconds = audio_duration - video_duration
        processed_video = video_in.video.filter(
            "tpad", stop_mode="clone", stop_duration=pad_seconds,
        )
        logger.info(
            "Padding video %s from %.2fs to %.2fs",
            video_path, video_duration, audio_duration,
        )
    else:
        processed_video = video_in.video

    stream = ffmpeg.output(
        processed_video,
        audio_in.audio,
        str(out),
        acodec="aac",
        t=audio_duration,
        **_VIDEO_QUALITY,
        **{"b:a": "192k", "af": _LOUDNORM},
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
    subtitle_path: str,
    output_path: str,
    *,
    max_seconds: float | None = None,
) -> str:
    """Burn styled subtitles into the video, keeping the audio stream.

    Styling is carried by the subtitle file itself (an ASS file produced by
    :func:`generate_ass_from_segments`), so no fragile ``force_style`` escaping
    is needed. A plain ``.srt`` also works (libass default style).

    Args:
        video_path: Local path to the source video.
        subtitle_path: Local path to the .ass (preferred) or .srt subtitle file.
        output_path: Destination path for the captioned video.
        max_seconds: Optional hard cap on output duration (final-cut safety net).

    Returns:
        Absolute path to the output video.
    """
    out = Path(output_path)
    out.parent.mkdir(parents=True, exist_ok=True)

    # On Windows the subtitles filter requires forward-slash paths with
    # escaped colons; on Linux raw paths work fine.
    sub_escaped = str(Path(subtitle_path).resolve()).replace("\\", "/").replace(":", "\\:")

    out_kwargs = {**_VIDEO_QUALITY, "acodec": "copy", "movflags": "+faststart"}
    if max_seconds:
        out_kwargs["t"] = float(max_seconds)

    input_file = ffmpeg.input(str(Path(video_path).resolve()))
    stream = ffmpeg.output(
        input_file.video.filter("subtitles", sub_escaped),
        input_file.audio,
        str(out),
        **out_kwargs,
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


def get_audio_duration(path: str) -> float:
    """Return the duration of a local audio file in seconds."""
    return get_video_duration(path)


def generate_srt_from_segments(
    segments: list[dict],
    output_path: str,
) -> str:
    """Write an SRT file from timed text segments.

    Each segment dict: {"start": float, "end": float, "text": str}
    """
    out = Path(output_path)
    out.parent.mkdir(parents=True, exist_ok=True)

    def _fmt(seconds: float) -> str:
        h = int(seconds // 3600)
        m = int((seconds % 3600) // 60)
        s = int(seconds % 60)
        ms = int((seconds % 1) * 1000)
        return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

    lines: list[str] = []
    for i, seg in enumerate(segments, start=1):
        text = seg.get("text", "").strip()
        if not text:
            continue
        lines.append(str(i))
        lines.append(f"{_fmt(seg['start'])} --> {_fmt(seg['end'])}")
        lines.append(text)
        lines.append("")

    out.write_text("\n".join(lines), encoding="utf-8")
    return str(out.resolve())


def _ass_time(seconds: float) -> str:
    """Format seconds as ASS timestamp H:MM:SS.cc (centiseconds).

    Computed in integer centiseconds with proper rollover. The old
    ``int(round(frac * 100))`` produced ``100`` when the fraction was >= .995
    (e.g. 3.999 -> "0:00:03.100"), an out-of-range centisecond field that
    libass misparses — making captions overlap/linger on screen.
    """
    total_cs = int(round(max(float(seconds), 0.0) * 100))
    h = total_cs // 360000
    m = (total_cs % 360000) // 6000
    s = (total_cs % 6000) // 100
    cs = total_cs % 100
    return f"{h:d}:{m:02d}:{s:02d}.{cs:02d}"


def normalize_caption_segments(
    segments: list[dict],
    min_gap: float = 0.04,
    min_dur: float = 0.6,
    max_end: float | None = None,
) -> list[dict]:
    """Force caption cues into a strictly sequential, non-overlapping timeline.

    Upstream cues are timed per-concept off accumulated TTS durations, so tiny
    float drift at concept boundaries can leave two dialogue lines sharing a
    window — which renders as captions overwriting each other. This sorts by
    start and guarantees ``prev.end + min_gap <= cur.start`` and a minimum
    on-screen duration, clamping the final cue to ``max_end`` when given.
    """
    cleaned: list[dict] = []
    ordered = sorted(
        (s for s in segments if str(s.get("text", "")).strip()),
        key=lambda s: float(s.get("start", 0.0)),
    )
    prev_end = 0.0
    for i, seg in enumerate(ordered):
        start = max(float(seg.get("start", 0.0)), prev_end + min_gap)
        end = max(float(seg.get("end", 0.0)), start + min_dur)
        # Don't run into the next cue's start.
        if i + 1 < len(ordered):
            next_start = float(ordered[i + 1].get("start", 0.0))
            if next_start > start:
                end = min(end, next_start - min_gap)
            end = max(end, start + min(min_dur, max(next_start - start - min_gap, 0.1)))
        if max_end is not None:
            if start >= max_end:
                break
            end = min(end, max_end)
        # Compare AFTER rounding so a sub-millisecond clamp can't emit a
        # zero/negative-duration cue (start==end) into the ASS file.
        r_start, r_end = round(start, 3), round(end, 3)
        if r_end <= r_start:
            continue
        cleaned.append({"start": r_start, "end": r_end, "text": seg["text"]})
        prev_end = end
    return cleaned


def _ass_text(text: str) -> str:
    """Neutralize characters that have meaning in an ASS Dialogue line."""
    return (
        str(text)
        .replace("\\", " ")
        .replace("{", "(")
        .replace("}", ")")
        .replace("\n", " ")
        .replace("\r", " ")
        .strip()
    )


def generate_ass_from_segments(segments: list[dict], output_path: str) -> str:
    """Write a premium-styled ASS subtitle file from timed text segments.

    Each segment dict: {"start": float, "end": float, "text": str}
    """
    out = Path(output_path)
    out.parent.mkdir(parents=True, exist_ok=True)

    lines = [_ASS_HEADER]
    for seg in segments:
        text = _ass_text(seg.get("text", ""))
        if not text:
            continue
        lines.append(
            f"Dialogue: 0,{_ass_time(seg['start'])},{_ass_time(seg['end'])},"
            f"Caption,,0,0,0,,{text}"
        )
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return str(out.resolve())


# ---------------------------------------------------------------------------
# Legacy class wrapper kept for backwards-compat with services/__init__.py
# ---------------------------------------------------------------------------

class FfmpegService:
    """Thin façade exposing module-level helpers as instance methods."""

    async def extract_audio(self, video_url: str, output_path: str) -> str:
        return await extract_audio(video_url, output_path)

    async def concat_clips(self, clip_paths: List[str], output_path: str) -> str:
        return await concat_clips(clip_paths, output_path)

    async def sync_video_to_audio(
        self, video_path: str, audio_path: str, output_path: str,
    ) -> str:
        return await sync_video_to_audio(video_path, audio_path, output_path)

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
        self, video_path: str, subtitle_path: str, output_path: str,
        *, max_seconds: float | None = None,
    ) -> str:
        return await burn_captions(video_path, subtitle_path, output_path, max_seconds=max_seconds)

    def get_video_duration(self, path: str) -> float:
        return get_video_duration(path)
