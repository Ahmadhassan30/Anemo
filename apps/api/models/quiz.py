"""Quiz model for lecture assessments."""
from sqlalchemy import Column, ForeignKey, String

from models.base import Base


class Quiz(Base):
    """Quiz entity with question and answer data."""

    __tablename__ = "quizzes"

    # TODO: define columns: id, lecture_id, question, choices, answer
    pass
