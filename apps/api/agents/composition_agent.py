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
    generate_ass_from_segments,
    build_caption_cues,
    normalize_caption_segments,
)

# Safety ceiling (seconds). Output length now TRACKS the input lecture via the
# pipeline's per-concept budgets; this only bounds pathological runaways.
MAX_FINAL_SECONDS = 600.0
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
                # Skip concepts that did not render rather than aborting the whole
                # video — compose with whatever succeeded.
                if not clip_url or not Path(str(clip_url)).exists():
                    logger.warning("Skipping concept %s — no rendered clip (%s)", c.get("id"), clip_url)
                    continue
                if not tts_path or not Path(str(tts_path)).exists():
                    logger.warning("Skipping concept %s — no narration audio (%s)", c.get("id"), tts_path)
                    continue

                concept_id = c.get("id")
                out_clip = tmp_dir / f"composed_{concept_id}.mp4"

                # Resilience: one bad clip must not abort the whole video.
                try:
                    await sync_video_to_audio(
                        video_path=clip_url,
                        audio_path=tts_path,
                        output_path=str(out_clip),
                    )
                except Exception as e:
                    logger.warning(
                        "Skipping concept %s — audio/video sync failed: %s",
                        concept_id, e,
                    )
                    continue

                clip_duration = get_audio_duration(tts_path)
                narration = c.get("narration_script", "")
                if narration:
                    caption_segments.extend(
                        build_caption_cues(
                            narration,
                            timeline_offset,
                            timeline_offset + clip_duration,
                        )
                    )
                timeline_offset += clip_duration

                composed_clips.append(str(out_clip))
                files_to_cleanup.append(str(out_clip))

            if not composed_clips:
                raise RuntimeError(
                    "No concept clips were rendered — cannot compose a final video"
                )

            composed_path = str(tmp_dir / "composed.mp4")
            await concat_clips(composed_clips, composed_path)
            files_to_cleanup.append(composed_path)

            ass_path = str(tmp_dir / "subtitles.ass")
            # Guarantee strictly sequential, non-overlapping cues so captions
            # never overwrite each other (clamped to the real timeline end).
            caption_segments = normalize_caption_segments(
                caption_segments, max_end=timeline_offset,
            )
            generate_ass_from_segments(caption_segments, ass_path)
            files_to_cleanup.append(ass_path)

            final_path = str(tmp_dir / "final.mp4")
            await burn_captions(
                video_path=composed_path,
                subtitle_path=ass_path,
                output_path=final_path,
                max_seconds=MAX_FINAL_SECONDS,
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
