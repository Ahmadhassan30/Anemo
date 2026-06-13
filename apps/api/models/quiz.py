"""Quiz model for lecture assessments."""

from sqlalchemy import Column, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from models.base import Base, TimestampMixin, UUIDMixin


class Quiz(UUIDMixin, TimestampMixin, Base):
    """Quiz entity with question and answer data."""

    __tablename__ = "quizzes"

    lecture_id = Column(ForeignKey("lectures.id", ondelete="CASCADE"), nullable=False, index=True)
    question = Column(Text, nullable=False)
    choices = Column(JSONB, nullable=False)
    answer = Column(String(255), nullable=False)
    explanation = Column(Text, nullable=True)

    lecture = relationship("Lecture")
