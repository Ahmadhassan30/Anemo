"""Lecture model for upload and publishing metadata."""
from sqlalchemy import Column, DateTime, Enum, ForeignKey, String

from models.base import Base


class Lecture(Base):
    """Lecture entity linked to professor uploads."""

    __tablename__ = "lectures"

    # TODO: define columns: id, professor_id, title, status, youtube_url
    pass
