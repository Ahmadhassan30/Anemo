"""Composition agent for concatenation and audio sync."""
from uuid import UUID
from sqlalchemy import select
from agents.base import BaseAgent
from db.session import async_session_maker
from models import Lecture, LectureStatus


class CompositionAgent(BaseAgent):
    """Compose final video with voice sync and captions."""

    name = "composition"

    async def run(self, lecture_id: str) -> None:
        # Resolve UUID from string
        lecture_uuid = UUID(lecture_id) if isinstance(lecture_id, str) else lecture_id
        
        async with async_session_maker() as session:
            async with session.begin():
                result = await session.execute(select(Lecture).where(Lecture.id == lecture_uuid))
                lecture = result.scalar_one_or_none()
                if lecture:
                    # TODO: upload to S3/Cloudflare R2 in production
                    lecture.raw_video_url = f"http://localhost:8000/static/{lecture_id}/final.mp4"
                    lecture.status = LectureStatus.completed

