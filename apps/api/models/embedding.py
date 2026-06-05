"""Embedding model for pgvector storage."""
from sqlalchemy import Column, ForeignKey, Text

from models.base import Base


class Embedding(Base):
    """Embedding entity linked to concepts."""

    __tablename__ = "embeddings"

    # TODO: define columns: id, concept_id, vector, chunk_text
    pass
