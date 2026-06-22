"""Database seed helpers for local development.

Only seeds demo user accounts. No lecture data is seeded — lectures must be
created by professors through the real upload flow so students see accurate,
real content on their dashboard.
"""
import asyncio
import logging
import bcrypt
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert

from db.session import async_session_maker
from models import User, UserRole

logger = logging.getLogger(__name__)


async def async_seed_data() -> None:
    """Async implementation of the database seeding logic."""
    logger.info("Starting database seed — creating demo user accounts only...")
    hashed_password = bcrypt.hashpw("demo1234".encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    async with async_session_maker() as db:
        # Create demo professor account
        prof_stmt = insert(User).values(
            email="professor@demo.com",
            hashed_password=hashed_password,
            role=UserRole.professor,
            is_active=True,
        ).on_conflict_do_nothing(index_elements=["email"])
        await db.execute(prof_stmt)

        # Create demo student account
        student_stmt = insert(User).values(
            email="student@demo.com",
            hashed_password=hashed_password,
            role=UserRole.student,
            is_active=True,
        ).on_conflict_do_nothing(index_elements=["email"])
        await db.execute(student_stmt)

        await db.commit()
        logger.info("Seed complete. Demo accounts ready (professor@demo.com / student@demo.com, password: demo1234)")


def seed_data() -> None:
    """Sync wrapper function to trigger the seeding process."""
    logging.basicConfig(level=logging.INFO)
    asyncio.run(async_seed_data())


if __name__ == "__main__":
    seed_data()

