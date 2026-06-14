"""Embedding model for pgvector storage."""

from pgvector.sqlalchemy import Vector
from sqlalchemy import Column, ForeignKey, Float, Text
from sqlalchemy.orm import relationship

from models.base import Base, TimestampMixin, UUIDMixin


class Embedding(UUIDMixin, TimestampMixin, Base):
    """Embedding entity linked to lecture and concept chunks."""
    __allow_unmapped__ = True

    __tablename__ = "embeddings"

    lecture_id = Column(ForeignKey("lectures.id", ondelete="CASCADE"), nullable=False, index=True)
    concept_id = Column(ForeignKey("concepts.id", ondelete="CASCADE"), nullable=True, index=True)
    chunk_text = Column(Text, nullable=False)
    vector = Column(Vector(384), nullable=False)
    ts_start = Column(Float, nullable=True)
    ts_end = Column(Float, nullable=True)

    lecture = relationship("Lecture")
    concept = relationship("Concept")
