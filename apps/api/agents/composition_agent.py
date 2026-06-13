"""Composition agent for concatenation and audio sync."""
import logging
import os
from pathlib import Path
from typing import Any, Dict

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from agents.base import BaseAgent
from models.lecture import Lecture, LectureStatus
from services.ffmpeg_service import extract_audio, concat_clips, overlay_audio, burn_captions
from services.whisper_service import whisper_service
from services.uploadthing_service import uploadthing_service
from utils.audio import cleanup_temp_files

logger = logging.getLogger(__name__)


class CompositionAgent(BaseAgent):
    """Compose final video with voice sync and captions."""

    name = "composition_agent"

    async def run(
        self,
        lecture_id: str,
        db: AsyncSession,
        *,
        concepts: list[dict],
        audio_path: str,
        **kwargs,
    ) -> dict:
        """Execute the final media composition pipeline."""
        logger.info("Starting composition for lecture %s", lecture_id)

        # Ensure concepts are ordered by start time
        ordered_concepts = sorted(concepts, key=lambda c: c.get("ts_start", 0.0))

        tmp_dir = Path("/tmp/lectures") / str(lecture_id)
        tmp_dir.mkdir(parents=True, exist_ok=True)

        composed_clips = []
        files_to_cleanup = []

        try:
            # 1 & 2. Overlay audio for each concept
            for c in ordered_concepts:
                clip_url = c.get("clip_url")
                assert clip_url, f"Concept {c.get('id')} has no clip_url set"
                assert Path(clip_url).exists(), f"Clip file not found: {clip_url}"

                concept_id = c.get("id")
                out_clip = tmp_dir / f"composed_{concept_id}.mp4"
                
                await overlay_audio(
                    video_path=clip_url,
                    audio_path=audio_path,
                    output_path=str(out_clip),
                    ts_start=float(c.get("ts_start", 0.0)),
                    ts_end=float(c.get("ts_end", 0.0)),
                )
                
                composed_clips.append(str(out_clip))
                files_to_cleanup.append(str(out_clip))

            # 3. Concatenate all composed clips
            composed_path = str(tmp_dir / "composed.mp4")
            await concat_clips(composed_clips, composed_path)
            files_to_cleanup.append(composed_path)

            # 4. Generate SRT
            # The lecture might not have a transcript attached to kwargs,
            # but since whisper_service is here, we can re-transcribe the final 
            # composed audio or the original audio if segments were passed.
            # Assuming `whisper_service.transcribe` returns {"segments": ...}
            # Or wait, instruction: "4. Generate SRT from whisper segments using whisper_service.generate_srt()"
            # If the orchestrator passes transcript in kwargs:
            transcript = kwargs.get("transcript")
            if not transcript:
                logger.info("No transcript found in kwargs, running transcribe on original audio.")
                transcript = whisper_service.transcribe(audio_path)
            
            srt_path = str(tmp_dir / "subtitles.srt")
            whisper_service.generate_srt(transcript.get("segments", []), srt_path)
            files_to_cleanup.append(srt_path)

            # 5. Burn Captions
            final_path = str(tmp_dir / "final.mp4")
            await burn_captions(
                video_path=composed_path,
                srt_path=srt_path,
                output_path=final_path
            )
            files_to_cleanup.append(final_path)

            # 6. Upload to UploadThing
            logger.info("Uploading final video to UploadThing...")
            final_video_url = await uploadthing_service.upload_file(final_path)

            # 7. Update lecture status
            result = await db.execute(select(Lecture).where(Lecture.id == lecture_id))
            lecture = result.scalar_one_or_none()
            if lecture:
                lecture.status = LectureStatus.completed
                await db.commit()

            # 8. Return
            return {
                "final_video_url": final_video_url,
                "lecture_id": lecture_id
            }

        finally:
            # Clean up all local temp clips after S3 upload
            logger.info("Cleaning up temp files for lecture %s", lecture_id)
            cleanup_temp_files(*files_to_cleanup)
