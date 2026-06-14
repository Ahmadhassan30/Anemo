"""Celery tasks for pipeline execution."""
import asyncio
import logging

from sqlalchemy import select

from tasks.celery_app import celery_app
from db.session import async_session_maker
from models.lecture import Lecture, LectureStatus
from orchestrator.pipeline import LectureOSPipeline

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, max_retries=0, name="tasks.run_pipeline")
def run_pipeline_task(self, lecture_id: str) -> None:
    """Celery entry point — bridges sync Celery into async pipeline.

    Creates a fresh asyncio event loop, opens its own DB session, and
    runs ``LectureOSPipeline.run()`` synchronously to completion.
    """
    logger.info("Celery task started for lecture %s", lecture_id)

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    try:
        loop.run_until_complete(_run_async(lecture_id))
    except Exception as exc:
        logger.exception("Pipeline task failed for lecture %s", lecture_id)
        # Mark lecture as failed in a new sync event loop call
        loop.run_until_complete(_mark_failed(lecture_id))
        raise
    finally:
        try:
            from db.session import engine
            loop.run_until_complete(engine.dispose())
        except Exception:
            logger.exception("Failed to dispose database engine")
        loop.close()


async def _run_async(lecture_id: str) -> None:
    """Async wrapper that creates a DB session and runs the pipeline."""
    async with async_session_maker() as db:
        pipeline = LectureOSPipeline(lecture_id, db)
        await pipeline.run()


async def _mark_failed(lecture_id: str) -> None:
    """Mark a lecture as failed when the pipeline raises."""
    try:
        async with async_session_maker() as db:
            result = await db.execute(
                select(Lecture).where(Lecture.id == lecture_id)
            )
            lecture = result.scalar_one_or_none()
            if lecture and lecture.status != LectureStatus.failed:
                lecture.status = LectureStatus.failed
                await db.commit()
    except Exception:
        logger.exception("Could not mark lecture %s as failed", lecture_id)
