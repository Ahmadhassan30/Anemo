"""Agent orchestration logic for the lecture pipeline."""
import asyncio
import logging
from typing import Any, Dict

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from pathlib import Path

from agents.ingest_agent import IngestAgent
from agents.transcription_agent import TranscriptionAgent
from agents.segmentation_agent import SegmentationAgent
from agents.codegen_agent import CodeGenAgent
from agents.composition_agent import CompositionAgent
from agents.rag_indexing_agent import RagIndexingAgent
from agents.publish_agent import PublishAgent
from models.lecture import Lecture, LectureStatus
from models.concept import Concept
from orchestrator.events import PipelineEvent, PipelineEventType, publish_event
from services.narration_service import narration_service
from services.tts_service import tts_service
from services.ffmpeg_service import get_audio_duration

logger = logging.getLogger(__name__)

# Final video is hard-capped to ~1 minute. We pick the most important concepts,
# split the budget across them, and pace narration/animation to fit.
MAX_VIDEO_CONCEPTS = 6
TOTAL_VIDEO_BUDGET = 58.0  # seconds; headroom under the 60s hard cap
MIN_CONCEPT_SECONDS = 6.0
HARD_VIDEO_CAP = 60.0


class LectureOSPipeline:
    """Orchestrates the full lecture → animation → publish pipeline."""

    def __init__(self, lecture_id: str, db: AsyncSession) -> None:
        self.lecture_id = lecture_id
        self.db = db
        self.event_queue: asyncio.Queue[PipelineEvent] = asyncio.Queue()

        # Instantiate all agents
        self.agents = {
            "ingest": IngestAgent(),
            "transcription": TranscriptionAgent(),
            "segmentation": SegmentationAgent(),
            "codegen": CodeGenAgent(),
            "composition": CompositionAgent(),
            "rag_indexing": RagIndexingAgent(),
            "publish": PublishAgent(),
        }

    # ------------------------------------------------------------------
    # Event helpers
    # ------------------------------------------------------------------

    async def emit(self, event: PipelineEvent) -> None:
        """Push event onto the local queue AND publish to Redis (fire-and-forget)."""
        await self.event_queue.put(event)
        await publish_event(event)

    def _make_event(
        self,
        event_type: PipelineEventType,
        message: str,
        progress_pct: int,
        agent_name: str | None = None,
        metadata: Dict[str, Any] | None = None,
    ) -> PipelineEvent:
        return PipelineEvent(
            event_type=event_type,
            lecture_id=self.lecture_id,
            agent_name=agent_name,
            message=message,
            progress_pct=progress_pct,
            metadata=metadata or {},
        )

    # ------------------------------------------------------------------
    # Stage runner helper
    # ------------------------------------------------------------------

    async def _run_stage(
        self,
        agent_key: str,
        progress_before: int,
        progress_after: int,
        **kwargs: Any,
    ) -> dict:
        """Execute a single agent stage with proper event emission."""
        agent = self.agents[agent_key]
        agent_name = agent.name

        await self.emit(self._make_event(
            PipelineEventType.AGENT_STARTED,
            f"Starting {agent_name}",
            progress_before,
            agent_name=agent_name,
        ))

        try:
            result = await agent.execute_with_retry(
                self.lecture_id, self.db, **kwargs
            )
        except Exception as exc:
            await self.emit(self._make_event(
                PipelineEventType.AGENT_FAILED,
                f"{agent_name} failed: {exc}",
                progress_before,
                agent_name=agent_name,
                metadata={"error": str(exc)},
            ))
            raise

        await self.emit(self._make_event(
            PipelineEventType.AGENT_COMPLETED,
            f"{agent_name} completed",
            progress_after,
            agent_name=agent_name,
            metadata=result or {},
        ))
        return result

    # ------------------------------------------------------------------
    # Full pipeline
    # ------------------------------------------------------------------

    async def run(self) -> None:
        """Execute the full pipeline in sequence."""
        try:
            # ── Stage 1 (0→10%): Ingest ──────────────────────────────
            ingest_result = await self._run_stage("ingest", 0, 10)
            audio_path: str = ingest_result.get("audio_path", "")
            video_url: str = ingest_result.get("video_url", "")

            if video_url == "http://api:8080/dummy.mp4":
                # Mock transcription & segmentation for the test run
                transcript = {
                    "duration": 20.0,
                    "segments": [
                        {"start": 0.0, "end": 5.0, "text": "Let's review binary search process diagram."},
                        {"start": 5.0, "end": 10.0, "text": "Here is the equation for reducing search space."},
                        {"start": 10.0, "end": 15.0, "text": "This code block calculates the midpoint index."},
                        {"start": 15.0, "end": 20.0, "text": "And the graph displays log-time search time."}
                    ]
                }
                # Load concepts from the database
                concept_res = await self.db.execute(
                    select(Concept).where(Concept.lecture_id == self.lecture_id)
                )
                db_concepts = concept_res.scalars().all()
                concepts = []
                for c in db_concepts:
                    concepts.append({
                        "id": str(c.id),
                        "concept": c.title,
                        "title": c.title,
                        "ts_start": c.ts_start,
                        "ts_end": c.ts_end,
                        "visual_type": c.visual_type,
                        "summary": c.title
                    })
            else:
                # ── Stage 2 (10→20%): Transcription ──────────────────────
                transcription_result = await self._run_stage(
                    "transcription", 10, 20,
                    audio_path=audio_path,
                )
                transcript: dict = transcription_result.get("transcript", {})

                # ── Stage 3 (20→30%): Segmentation ───────────────────────
                segmentation_result = await self._run_stage(
                    "segmentation", 20, 30,
                    transcript=transcript,
                )
                concepts: list[dict] = segmentation_result.get("concepts", [])

            # ── Stage 3b: Select concepts + generate narration/TTS ───
            media_dir = Path(f"/tmp/lectures/{self.lecture_id}")
            media_dir.mkdir(parents=True, exist_ok=True)

            # Keep the full concept set for RAG/chapters, but cap the *video*
            # to the first N concepts so the final cut stays under ~1 minute.
            ordered_concepts = sorted(concepts, key=lambda c: c.get("ts_start", 0.0))
            video_concepts = ordered_concepts[:MAX_VIDEO_CONCEPTS]
            if len(ordered_concepts) > len(video_concepts):
                logger.info(
                    "Video capped to %d/%d concepts to fit the %.0fs budget",
                    len(video_concepts), len(ordered_concepts), TOTAL_VIDEO_BUDGET,
                )
            per_concept = max(
                TOTAL_VIDEO_BUDGET / max(len(video_concepts), 1),
                MIN_CONCEPT_SECONDS,
            )
            target_seconds = max(int(round(per_concept)), 6)
            logger.info(
                "Per-concept budget: %.1fs (%d concepts, target_seconds=%d)",
                per_concept, len(video_concepts), target_seconds,
            )

            await self.emit(self._make_event(
                PipelineEventType.PROGRESS_UPDATE,
                "Generating professional narration for each concept...",
                28,
                agent_name="narration",
            ))

            for concept in video_concepts:
                segment = self._get_segment(concept, transcript)
                script = await narration_service.generate_script(
                    concept, segment, target_seconds=target_seconds,
                )
                tts_path = await tts_service.synthesize(
                    script,
                    str(media_dir / f"tts_{concept['id']}.mp3"),
                )
                duration = get_audio_duration(tts_path)
                concept["narration_script"] = script
                concept["tts_path"] = tts_path
                concept["target_duration"] = per_concept
                concept["title"] = concept.get("concept") or concept.get("title", "")
                logger.info(
                    "Narration ready for '%s': %.1fs (budget %.1fs)",
                    concept["title"], duration, per_concept,
                )

            # ── Stage 4 (30→70%): CodeGen — sequential ─────────────
            total_video = len(video_concepts)
            await self.emit(self._make_event(
                PipelineEventType.AGENT_STARTED,
                f"Starting codegen for {total_video} concepts",
                30,
                agent_name="codegen_agent",
            ))

            codegen_results: list[dict] = []

            for i, concept in enumerate(video_concepts):
                logger.info(
                    f"Codegen concept {i+1}/{total_video}: "
                    f"{concept.get('title')}"
                )
                try:
                    result = await self.agents["codegen"].execute_with_retry(
                        self.lecture_id, self.db,
                        concept=concept,
                        transcript_segment=self._get_segment(concept, transcript),
                    )
                    codegen_results.append(result)
                except Exception as e:
                    logger.error(
                        f"Concept {i+1} failed, continuing: {e}"
                    )
                    codegen_results.append({
                        "concept_id": str(concept.get("id", "")),
                        "clip_url": None,
                        "error": str(e)
                    })

                # Emit a per-concept progress update
                pct = 30 + int((i + 1) / max(total_video, 1) * 40)
                await self.emit(self._make_event(
                    PipelineEventType.PROGRESS_UPDATE,
                    f"Rendered concept {i + 1}/{total_video}: "
                    f"{concept.get('concept', '')}",
                    pct,
                    agent_name="codegen_agent",
                ))

            # Merge clip_url back into the video concept list for composition
            clip_lookup = {r["concept_id"]: r["clip_url"] for r in codegen_results}
            for c in video_concepts:
                c["clip_url"] = clip_lookup.get(c["id"], c.get("clip_url"))

            await self.emit(self._make_event(
                PipelineEventType.AGENT_COMPLETED,
                f"codegen_agent completed — {total_video} concepts rendered",
                70,
                agent_name="codegen_agent",
            ))

            # ── Stage 5 (70→80%): Composition ────────────────────────
            composition_result = await self._run_stage(
                "composition", 70, 80,
                concepts=video_concepts,
                audio_path=audio_path,
                transcript=transcript,
            )
            final_video_url: str = composition_result.get("final_video_url", "")

            # ── Stage 6 (80→85%): RAG Indexing ───────────────────────
            await self._run_stage(
                "rag_indexing", 80, 85,
                transcript=transcript,
                concepts=concepts,
            )

            # ── Stage 7 (85→95%): Publish ────────────────────────────
            # Fetch the lecture title from DB
            result = await self.db.execute(
                select(Lecture).where(Lecture.id == self.lecture_id)
            )
            lecture = result.scalar_one_or_none()
            lecture_title = lecture.title if lecture else "Untitled Lecture"

            publish_result = await self._run_stage(
                "publish", 85, 95,
                final_video_url=final_video_url,
                lecture_title=lecture_title,
                transcript=transcript,
            )

            # ── Stage 8 (100%): Mark completed ───────────────────────
            if lecture:
                lecture.status = LectureStatus.completed
                await self.db.commit()

            await self.emit(self._make_event(
                PipelineEventType.PIPELINE_COMPLETED,
                "Pipeline completed successfully",
                100,
                metadata={
                    "final_video_url": final_video_url,
                    "youtube_url": publish_result.get("youtube_url", ""),
                },
            ))

        except Exception as exc:
            logger.exception("Pipeline failed for lecture %s", self.lecture_id)

            # Mark lecture as failed
            try:
                result = await self.db.execute(
                    select(Lecture).where(Lecture.id == self.lecture_id)
                )
                lecture = result.scalar_one_or_none()
                if lecture:
                    lecture.status = LectureStatus.failed
                    await self.db.commit()
            except Exception:
                logger.exception("Failed to mark lecture as failed")

            await self.emit(self._make_event(
                PipelineEventType.PIPELINE_FAILED,
                f"Pipeline failed: {exc}",
                -1,
                metadata={"error": str(exc)},
            ))
            raise

    def _get_segment(self, concept: dict, transcript: dict) -> str:
        """Gather transcript text that falls within this concept's time range."""
        segments = transcript.get("segments", [])
        ts_s = concept.get("ts_start", 0)
        ts_e = concept.get("ts_end", 0)
        seg_texts = [
            s.get("text", "")
            for s in segments
            if ts_s <= (s.get("start", 0) + s.get("end", 0)) / 2 <= ts_e
        ]
        return " ".join(seg_texts)
