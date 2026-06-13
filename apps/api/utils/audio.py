"""Audio utilities: temp-file download helpers used by pipeline agents."""
from __future__ import annotations

import logging
import os
import tempfile
from pathlib import Path

import httpx

# Re-export the primary audio-extraction function so callers can do:
#   from utils.audio import extract_audio
from services.ffmpeg_service import extract_audio as extract_audio  # noqa: F401

logger = logging.getLogger(__name__)


async def download_to_temp(url: str) -> str:
    """Stream-download a remote file to a named temporary file.

    The caller is responsible for deleting the file when finished
    (e.g. by calling :func:`cleanup_temp_files`).

    Args:
        url: HTTPS URL of the file to download (S3, UploadThing CDN, etc.).

    Returns:
        Absolute local path to the temporary file.

    Raises:
        httpx.HTTPStatusError: If the server returns a 4xx / 5xx response.
    """
    # Derive a suffix from the URL so ffmpeg/whisper can detect the format
    url_stem = url.split("?")[0].split("/")[-1]
    suffix = Path(url_stem).suffix or ".bin"

    fd, tmp_path = tempfile.mkstemp(suffix=suffix)
    os.close(fd)  # close immediately; open again for writing below
    tmp = Path(tmp_path)

    logger.info("Downloading %s → %s", url, tmp)
    async with httpx.AsyncClient(timeout=600, follow_redirects=True) as client:
        async with client.stream("GET", url) as response:
            response.raise_for_status()
            with tmp.open("wb") as f:
                async for chunk in response.aiter_bytes(chunk_size=65536):
                    f.write(chunk)

    logger.info("Download complete: %s (%d bytes)", tmp, tmp.stat().st_size)
    return str(tmp.resolve())


def cleanup_temp_files(*paths: str) -> None:
    """Delete local temporary files, silently ignoring any that are missing.

    Args:
        *paths: One or more file paths to delete.
    """
    for raw_path in paths:
        p = Path(raw_path)
        try:
            p.unlink(missing_ok=True)
            logger.debug("Removed temp file: %s", p)
        except OSError as exc:
            # Log but never raise – cleanup should never abort a pipeline
            logger.warning("Could not remove temp file %s: %s", p, exc)
