"""Composition agent for concatenation and audio sync."""
import logging
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from agents.base import BaseAgent
from models.lecture import Lecture, LectureStatus
from services.ffmpeg_service import (
    concat_clips,
    sync_video_to_audio,
    burn_captions,
    get_audio_duration,
    generate_srt_from_segments,
)
from services.uploadthing_service import get_final_video_url, get_final_video_path
import shutil
from utils.audio import cleanup_temp_files

logger = logging.getLogger(__name__)


class CompositionAgent(BaseAgent):
    """Compose final video with AI narration sync and captions."""

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

        ordered_concepts = sorted(concepts, key=lambda c: c.get("ts_start", 0.0))

        tmp_dir = Path("/tmp/lectures") / str(lecture_id)
        tmp_dir.mkdir(parents=True, exist_ok=True)

        composed_clips = []
        caption_segments = []
        files_to_cleanup = []
        timeline_offset = 0.0

        try:
            for c in ordered_concepts:
                clip_url = c.get("clip_url")
                tts_path = c.get("tts_path")
                assert clip_url, f"Concept {c.get('id')} has no clip_url set"
                assert tts_path, f"Concept {c.get('id')} has no tts_path — narration missing"
                assert Path(clip_url).exists(), f"Clip file not found: {clip_url}"
                assert Path(tts_path).exists(), f"TTS file not found: {tts_path}"

                concept_id = c.get("id")
                out_clip = tmp_dir / f"composed_{concept_id}.mp4"

                await sync_video_to_audio(
                    video_path=clip_url,
                    audio_path=tts_path,
                    output_path=str(out_clip),
                )

                clip_duration = get_audio_duration(tts_path)
                narration = c.get("narration_script", "")
                if narration:
                    caption_segments.append({
                        "start": timeline_offset,
                        "end": timeline_offset + clip_duration,
                        "text": narration,
                    })
                timeline_offset += clip_duration

                composed_clips.append(str(out_clip))
                files_to_cleanup.append(str(out_clip))

            composed_path = str(tmp_dir / "composed.mp4")
            await concat_clips(composed_clips, composed_path)
            files_to_cleanup.append(composed_path)

            srt_path = str(tmp_dir / "subtitles.srt")
            generate_srt_from_segments(caption_segments, srt_path)
            files_to_cleanup.append(srt_path)

            final_path = str(tmp_dir / "final.mp4")
            await burn_captions(
                video_path=composed_path,
                srt_path=srt_path,
                output_path=final_path,
            )
            files_to_cleanup.append(final_path)

            logger.info(
                "Final video composed: %.1fs total across %d concepts",
                timeline_offset, len(ordered_concepts),
            )

            logger.info("Saving final video to static directory...")
            final_dest = get_final_video_path(lecture_id)
            final_dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(final_path, final_dest)
            final_video_url = get_final_video_url(lecture_id)

            result = await db.execute(select(Lecture).where(Lecture.id == lecture_id))
            lecture = result.scalar_one_or_none()
            if lecture:
                lecture.status = LectureStatus.completed
                await db.commit()

            return {
                "final_video_url": final_video_url,
                "lecture_id": lecture_id,
                "duration_seconds": timeline_offset,
            }

        finally:
            logger.info("Cleaning up temp files for lecture %s", lecture_id)
            cleanup_temp_files(*files_to_cleanup)
