"""Database seed helpers for local development."""
import asyncio
import logging
from passlib.context import CryptContext
from sqlalchemy import delete
from sqlalchemy.dialects.postgresql import insert

from db.session import async_session_maker
from models import User, UserRole, Lecture, LectureStatus, Concept, RenderStatus, enrollments

logger = logging.getLogger(__name__)

async def async_seed_data() -> None:
    """Async implementation of the database seeding logic."""
    logger.info("Starting database seed...")
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    hashed_password = pwd_context.hash("demo1234")

    async with async_session_maker() as db:
        # Delete existing demo users to ensure clean state and cascade delete lectures/concepts
        logger.info("Cleaning up existing demo data...")
        await db.execute(delete(User).where(User.email.in_(["professor@demo.com", "student@demo.com"])))
        await db.commit()

        logger.info("Creating demo user records...")
        prof = User(
            email="professor@demo.com",
            hashed_password=hashed_password,
            role=UserRole.professor,
            is_active=True,
        )
        student = User(
            email="student@demo.com",
            hashed_password=hashed_password,
            role=UserRole.student,
            is_active=True,
        )
        db.add(prof)
        db.add(student)
        await db.flush()

        logger.info("Seeding completed lecture...")
        lecture = Lecture(
            professor_id=prof.id,
            title="Introduction to Machine Learning & Neural Networks",
            raw_video_url="https://uploadthing-cdn.com/f/demo_raw_video.mp4",
            status=LectureStatus.completed,
            youtube_url="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        )
        db.add(lecture)
        await db.flush()

        logger.info("Enrolling student into seed lecture...")
        enroll_stmt = insert(enrollments).values(
            student_id=student.id,
            lecture_id=lecture.id
        ).on_conflict_do_nothing()
        await db.execute(enroll_stmt)

        logger.info("Seeding concept rows...")
        concepts = [
            Concept(
                lecture_id=lecture.id,
                title="1. What is a Neural Network?",
                ts_start=0.0,
                ts_end=15.5,
                visual_type="neural_network",
                manim_code="class ConceptScene(Scene):\n    def construct(self):\n        pass",
                clip_url="https://uploadthing-cdn.com/f/concept_1_clip.mp4",
                render_status=RenderStatus.done
            ),
            Concept(
                lecture_id=lecture.id,
                title="2. The Role of Activation Functions",
                ts_start=15.5,
                ts_end=45.0,
                visual_type="math_equations",
                manim_code="class ConceptScene(Scene):\n    def construct(self):\n        pass",
                clip_url="https://uploadthing-cdn.com/f/concept_2_clip.mp4",
                render_status=RenderStatus.done
            ),
            Concept(
                lecture_id=lecture.id,
                title="3. Optimization via Gradient Descent",
                ts_start=45.0,
                ts_end=90.0,
                visual_type="graph_plot",
                manim_code="class ConceptScene(Scene):\n    def construct(self):\n        pass",
                clip_url="https://uploadthing-cdn.com/f/concept_3_clip.mp4",
                render_status=RenderStatus.done
            ),
        ]
        db.add_all(concepts)
        await db.commit()
        logger.info("Seed completed successfully!")

def seed_data() -> None:
    """Sync wrapper function to trigger the seeding process."""
    logging.basicConfig(level=logging.INFO)
    asyncio.run(async_seed_data())

if __name__ == "__main__":
    seed_data()

