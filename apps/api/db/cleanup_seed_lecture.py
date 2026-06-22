"""One-time cleanup: remove the ghost seeded lecture 'Introduction to Machine Learning & Neural Networks'
and its associated enrollments and concepts from the database.

Run this once inside the API container:
    docker compose -f infra/docker-compose.yml exec api python db/cleanup_seed_lecture.py
"""
import asyncio
import logging

from sqlalchemy import delete, select

from db.session import async_session_maker, engine
from models import Lecture, Concept, enrollments

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

GHOST_TITLE = "Introduction to Machine Learning & Neural Networks"


async def cleanup() -> None:
    async with async_session_maker() as db:
        # Find the ghost lecture(s) by title
        result = await db.execute(
            select(Lecture).where(Lecture.title == GHOST_TITLE)
        )
        ghost_lectures = result.scalars().all()

        if not ghost_lectures:
            logger.info("No ghost lecture found — database is already clean.")
            return

        for lec in ghost_lectures:
            logger.info("Deleting ghost lecture: %s (id=%s)", lec.title, lec.id)

            # Delete enrollments
            await db.execute(
                delete(enrollments).where(enrollments.c.lecture_id == lec.id)
            )
            # Delete concepts
            await db.execute(
                delete(Concept).where(Concept.lecture_id == lec.id)
            )
            # Delete the lecture itself
            await db.delete(lec)

        await db.commit()
        logger.info("Cleanup complete — %d ghost lecture(s) removed.", len(ghost_lectures))

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(cleanup())
