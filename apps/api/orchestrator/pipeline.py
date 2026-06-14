"""Agent orchestration logic for the lecture pipeline."""
import asyncio
import logging
from typing import Any, Dict

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from agents.ingest_agent import IngestAgent
from agents.transcription_agent import TranscriptionAgent
from agents.segmentation_agent import SegmentationAgent
from agents.codegen_agent import CodeGenAgent
from agents.composition_agent import CompositionAgent
from agents.rag_indexing_agent import RagIndexingAgent
from agents.publish_agent import PublishAgent
from models.lecture import Lecture, LectureStatus
from orchestrator.events import PipelineEvent, PipelineEventType, publish_event

logger = logging.getLogger(__name__)


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

            # ── Stage 4 (30→70%): CodeGen — parallelized ─────────────
            await self.emit(self._make_event(
                PipelineEventType.AGENT_STARTED,
                f"Starting codegen for {len(concepts)} concepts",
                30,
                agent_name="codegen_agent",
            ))

            sem = asyncio.Semaphore(3)
            codegen_results: list[dict] = []

            # Collect the transcript segments per concept for the coder
            segments = transcript.get("segments", [])

            async def _gen_one(concept: dict, idx: int) -> dict:
                async with sem:
                    # Gather transcript text that falls within this concept
                    ts_s = concept.get("ts_start", 0)
                    ts_e = concept.get("ts_end", 0)
                    seg_texts = [
                        s.get("text", "")
                        for s in segments
                        if ts_s <= (s.get("start", 0) + s.get("end", 0)) / 2 <= ts_e
                    ]
                    transcript_segment = " ".join(seg_texts)

                    # Create a fresh database session for this concurrent task to avoid InterfaceError
                    from db.session import async_session_maker
                    async with async_session_maker() as task_db:
                        result = await self.agents["codegen"].execute_with_retry(
                            self.lecture_id,
                            task_db,
                            concept=concept,
                            transcript_segment=transcript_segment,
                        )

                    # Emit a per-concept progress update
                    pct = 30 + int((idx + 1) / len(concepts) * 40)
                    await self.emit(self._make_event(
                        PipelineEventType.PROGRESS_UPDATE,
                        f"Rendered concept {idx + 1}/{len(concepts)}: "
                        f"{concept.get('concept', '')}",
                        pct,
                        agent_name="codegen_agent",
                    ))
                    return result

            tasks = [
                _gen_one(c, i) for i, c in enumerate(concepts)
            ]

            try:
                codegen_results = await asyncio.gather(*tasks)
            except Exception as exc:
                await self.emit(self._make_event(
                    PipelineEventType.AGENT_FAILED,
                    f"codegen_agent failed: {exc}",
                    50,
                    agent_name="codegen_agent",
                    metadata={"error": str(exc)},
                ))
                raise

            # Merge clip_url back into concepts list for composition
            clip_lookup = {r["concept_id"]: r["clip_url"] for r in codegen_results}
            for c in concepts:
                c["clip_url"] = clip_lookup.get(c["id"], c.get("clip_url"))

            await self.emit(self._make_event(
                PipelineEventType.AGENT_COMPLETED,
                f"codegen_agent completed — {len(concepts)} concepts rendered",
                70,
                agent_name="codegen_agent",
            ))

            # ── Stage 5 (70→80%): Composition ────────────────────────
            composition_result = await self._run_stage(
                "composition", 70, 80,
                concepts=concepts,
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
