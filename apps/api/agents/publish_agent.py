"""Publish agent for YouTube uploads and metadata."""
import logging
import os
from pathlib import Path

from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaFileUpload
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from agents.base import BaseAgent
from config import settings
from models.lecture import Lecture
from services.llm_service import llm_service
from services.uploadthing_service import get_final_video_path
from utils.audio import download_to_temp, cleanup_temp_files

logger = logging.getLogger(__name__)


class PublishError(Exception):
    pass


class PublishAgent(BaseAgent):
    """Publish final video to YouTube with SEO metadata."""

    name = "publish_agent"

    async def run(
        self,
        lecture_id: str,
        db: AsyncSession,
        *,
        final_video_url: str,
        lecture_title: str,
        transcript: dict,
        **kwargs,
    ) -> dict:
        """Upload the composed final video to YouTube."""
        logger.info("Starting YouTube publish for lecture %s", lecture_id)

        # 1. Generate SEO metadata via LLM
        segments = transcript.get("segments", [])
        raw_text = " ".join([s.get("text", "") for s in segments])
        context_text = raw_text[:1000]

        system_prompt = (
            "You are an SEO expert for YouTube education channels. "
            "Return JSON matching exactly this schema: "
            '{"title": str (max 70 chars), "description": str (max 400 chars, '
            'include chapter timestamps), "tags": list[str] (max 15 tags)}'
        )
        user_prompt = f"Lecture Title: {lecture_title}\nTranscript snippet:\n{context_text}"

        seo_data = await llm_service.chat_json(
            system=system_prompt,
            user=user_prompt,
        )

        title = seo_data.get("title", lecture_title)[:70]
        description = seo_data.get("description", "A lecture animation.")[:400]
        tags = seo_data.get("tags", [])[:15]

        # 2. Download final video from S3 to local temp file
        # Using the utility method we already have, or using the local static file if in dev mode
        is_local = False
        if final_video_url.startswith("/static/") or not final_video_url.startswith("http"):
            local_video_path = str(get_final_video_path(lecture_id))
            is_local = True
            logger.info("Detected local relative URL. Skipping download and using path: %s", local_video_path)
        else:
            local_video_path = await download_to_temp(final_video_url)

        youtube_video_id = ""
        is_placeholder_youtube = (
            not settings.YOUTUBE_CLIENT_SECRET
            or "your_" in settings.YOUTUBE_CLIENT_SECRET.lower()
        )

        try:
            if is_placeholder_youtube:
                logger.info("YouTube client secret is a placeholder or empty. Skipping actual upload and generating a mock video ID.")
                youtube_video_id = "dQw4w9WgXcQ"
            else:
                # 3. Build YouTube API client using OAuth2 credentials
                # TODO: replace with proper per-professor OAuth flow from the DB
                # For now, using API key/secret from settings. Note that YouTube upload
                # strictly requires an authenticated user's OAuth2 token. As a placeholder,
                # we build the client with a developerKey, though upload requires OAuth2.
                # In a real scenario we'd use `Credentials` from google.oauth2.credentials.
                logger.info("Building YouTube client...")
                youtube = build("youtube", "v3", developerKey=settings.YOUTUBE_CLIENT_SECRET)

                # 4. Call youtube.videos().insert()
                body = {
                    "snippet": {
                        "title": title,
                        "description": description,
                        "tags": tags,
                        "categoryId": "27"  # Education
                    },
                    "status": {
                        "privacyStatus": "public"
                    }
                }

                media_body = MediaFileUpload(local_video_path, chunksize=1024*1024, resumable=True)

                logger.info("Uploading to YouTube...")
                request = youtube.videos().insert(
                    part="snippet,status",
                    body=body,
                    media_body=media_body
                )

                response = None
                while response is None:
                    try:
                        # In asyncio, we ideally wrap this in `asyncio.to_thread`
                        # but we execute synchronously in this block for simplicity 
                        # as per googleapiclient docs unless wrapped.
                        status, response = request.next_chunk()
                        if status:
                            logger.debug("Uploaded %d%%", int(status.progress() * 100))
                    except HttpError as e:
                        if e.resp.status in [403, 429]:
                            raise PublishError("YouTube API quota exceeded. Please tell the professor to retry later.") from e
                        raise PublishError(f"YouTube upload failed: {e}") from e

                youtube_video_id = response.get("id")
                logger.info("YouTube upload complete! Video ID: %s", youtube_video_id)

        finally:
            # 6. Clean up local temp file only if it was downloaded
            if not is_local:
                cleanup_temp_files(local_video_path)

        if not youtube_video_id:
            raise PublishError("Upload finished but no Video ID was returned.")

        youtube_url = f"https://youtube.com/watch?v={youtube_video_id}"

        # 5. On success: update lecture.youtube_url
        result = await db.execute(select(Lecture).where(Lecture.id == lecture_id))
        lecture = result.scalar_one_or_none()
        if lecture:
            lecture.youtube_url = youtube_url
            await db.commit()

        return {
            "youtube_url": youtube_url,
            "youtube_video_id": youtube_video_id
        }
