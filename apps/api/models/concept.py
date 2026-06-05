"""Concept model for segmented lecture units."""
from sqlalchemy import Column, Float, ForeignKey, String, Text

from models.base import Base


class Concept(Base):
    """Concept entity for timestamps and Manim code."""

    __tablename__ = "concepts"

    # TODO: define columns: id, lecture_id, title, ts_start, ts_end, manim_code
    pass
