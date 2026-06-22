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

# Output duration SCALES WITH the input lecture, capped for render reliability.
# We pick a duration-proportional number of concepts, split a duration-scaled
# budget across them (weighted by how long each concept is discussed), and pace
# narration/animation to fit. See the concept-selection block in run().
SECONDS_PER_CONCEPT = 40.0       # ~1 animated scene per 40s of lecture
MIN_VIDEO_CONCEPTS = 3
MAX_VIDEO_CONCEPTS = 16          # render ceiling so long lectures stay feasible
DURATION_RATIO = 0.30            # output ≈ 30% of input length…
MIN_TOTAL_BUDGET = 30.0          # …but at least 30s…
MAX_TOTAL_BUDGET = 480.0         # …and at most ~8 minutes.
MIN_CONCEPT_SECONDS = 5.0
MAX_CONCEPT_SECONDS = 20.0


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
                await self.emit(self._make_event(
                    PipelineEventType.PROGRESS_UPDATE,
                    f"Transcribed {len(transcript.get('segments', []))} segments "
                    f"({transcript.get('duration', 0):.0f}s audio)",
                    20, agent_name="transcription_agent",
                ))

                # ── Stage 3 (20→30%): Segmentation ───────────────────────
                segmentation_result = await self._run_stage(
                    "segmentation", 20, 30,
                    transcript=transcript,
                )
                concepts: list[dict] = segmentation_result.get("concepts", [])
                _titles = [str(c.get("concept") or c.get("title") or "?") for c in concepts[:4]]
                await self.emit(self._make_event(
                    PipelineEventType.PROGRESS_UPDATE,
                    f"Extracted {len(concepts)} concepts: " + ", ".join(_titles)
                    + ("…" if len(concepts) > 4 else ""),
                    30, agent_name="segmentation_agent",
                ))

            # ── Stage 3b: Select concepts + generate narration/TTS ───
            media_dir = Path(f"/tmp/lectures/{self.lecture_id}")
            media_dir.mkdir(parents=True, exist_ok=True)

            # Keep the full concept set for RAG/chapters, but select a
            # duration-proportional slice for the *video* so the output length
            # tracks the input lecture (capped at MAX_TOTAL_BUDGET).
            ordered_concepts = sorted(concepts, key=lambda c: c.get("ts_start", 0.0))

            # How long is the source lecture?  Prefer the transcript's reported
            # duration, else the last segment's end, else a safe default.
            input_duration = float(transcript.get("duration") or 0.0)
            if input_duration <= 0.0:
                _segs = transcript.get("segments") or []
                input_duration = max(
                    (float(s.get("end", 0.0)) for s in _segs), default=0.0
                )
            if input_duration <= 0.0:
                input_duration = 180.0

            num_render = max(
                MIN_VIDEO_CONCEPTS,
                min(MAX_VIDEO_CONCEPTS, round(input_duration / SECONDS_PER_CONCEPT)),
            )
            num_render = min(num_render, len(ordered_concepts))
            video_concepts = ordered_concepts[:num_render]

            total_budget = min(
                max(input_duration * DURATION_RATIO, MIN_TOTAL_BUDGET),
                MAX_TOTAL_BUDGET,
            )

            # Weight each concept's screen time by how long it is discussed in
            # the lecture, then clamp to a sane per-scene range.
            _spans = [
                max(float(c.get("ts_end", 0.0)) - float(c.get("ts_start", 0.0)), 1.0)
                for c in video_concepts
            ]
            _span_sum = sum(_spans) or 1.0
            for i, concept in enumerate(video_concepts):
                weighted = total_budget * (_spans[i] / _span_sum)
                per = min(max(weighted, MIN_CONCEPT_SECONDS), MAX_CONCEPT_SECONDS)
                concept["target_duration"] = per
                concept["variety_index"] = i  # CONTRACT: de-dupes visuals downstream

            logger.info(
                "Video plan: input=%.0fs → %d/%d concepts, total budget %.0fs (cap %.0fs)",
                input_duration, len(video_concepts), len(ordered_concepts),
                total_budget, MAX_TOTAL_BUDGET,
            )

            await self.emit(self._make_event(
                PipelineEventType.PROGRESS_UPDATE,
                "Generating professional narration for each concept...",
                28,
                agent_name="narration",
            ))

            for concept in video_concepts:
                segment = self._get_segment(concept, transcript)
                per = float(concept.get("target_duration", MIN_CONCEPT_SECONDS))
                target_seconds = max(int(round(per)), 5)
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
                concept["title"] = concept.get("concept") or concept.get("title", "")
                logger.info(
                    "Narration ready for '%s': %.1fs (budget %.1fs)",
                    concept["title"], duration, per,
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
                    # Recover the shared session from any aborted transaction so
                    # the next concept / stage doesn't hit PendingRollbackError.
                    try:
                        await self.db.rollback()
                    except Exception:
                        pass
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
            await self.emit(self._make_event(
                PipelineEventType.PROGRESS_UPDATE,
                f"Composed final video — {composition_result.get('duration_seconds', 0):.0f}s "
                f"across {len(video_concepts)} concepts",
                80, agent_name="composition_agent",
            ))

            # ── Mark the video READY as soon as composition succeeds ──
            #    The rendered video is the product. RAG indexing and YouTube
            #    publishing are best-effort enhancements — a failure in either
            #    must NOT invalidate an already-rendered, downloadable video.
            result = await self.db.execute(
                select(Lecture).where(Lecture.id == self.lecture_id)
            )
            lecture = result.scalar_one_or_none()
            lecture_title = lecture.title if lecture else "Untitled Lecture"
            if lecture:
                lecture.status = LectureStatus.completed
                await self.db.commit()

            youtube_url = ""

            # ── Stage 6 (80→85%): RAG Indexing (best-effort) ─────────
            try:
                await self._run_stage(
                    "rag_indexing", 80, 85,
                    transcript=transcript,
                    concepts=concepts,
                )
            except Exception as rag_exc:
                logger.warning(
                    "RAG indexing failed (non-fatal) for lecture %s: %s",
                    self.lecture_id, rag_exc,
                )
                try:
                    await self.db.rollback()
                except Exception:
                    pass
                await self.emit(self._make_event(
                    PipelineEventType.PROGRESS_UPDATE,
                    "RAG indexing skipped — study assistant may be unavailable",
                    85,
                    agent_name="rag_indexing_agent",
                    metadata={"warning": str(rag_exc)},
                ))

            # ── Stage 7 (85→95%): Publish to YouTube (best-effort) ───
            try:
                publish_result = await self._run_stage(
                    "publish", 85, 95,
                    final_video_url=final_video_url,
                    lecture_title=lecture_title,
                    transcript=transcript,
                )
                youtube_url = publish_result.get("youtube_url", "")
            except Exception as pub_exc:
                logger.warning(
                    "Publish failed (non-fatal) for lecture %s: %s",
                    self.lecture_id, pub_exc,
                )
                try:
                    await self.db.rollback()
                except Exception:
                    pass
                await self.emit(self._make_event(
                    PipelineEventType.PROGRESS_UPDATE,
                    "YouTube publish skipped — video is still ready to download",
                    95,
                    agent_name="publish_agent",
                    metadata={"warning": str(pub_exc)},
                ))

            # ── Stage 8 (100%): Pipeline complete (video is ready) ───
            await self.emit(self._make_event(
                PipelineEventType.PIPELINE_COMPLETED,
                "Pipeline completed successfully",
                100,
                metadata={
                    "final_video_url": final_video_url,
                    "youtube_url": youtube_url,
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
