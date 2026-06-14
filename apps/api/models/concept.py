"""Concept model for segmented lecture units."""
import enum

from sqlalchemy import Column, Enum as SAEnum, Float, ForeignKey, String, Text
from sqlalchemy.orm import relationship

from models.base import Base, TimestampMixin, UUIDMixin


class RenderStatus(enum.Enum):
    """Render status for a concept clip."""

    pending = "pending"
    rendering = "rendering"
    done = "done"
    failed = "failed"


class Concept(UUIDMixin, TimestampMixin, Base):
    """Concept entity for timestamps and Manim code."""
    __allow_unmapped__ = True

    __tablename__ = "concepts"

    lecture_id = Column(ForeignKey("lectures.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    ts_start = Column(Float, nullable=False)
    ts_end = Column(Float, nullable=False)
    visual_type = Column(String(100), nullable=False)
    summary = Column(Text, nullable=True)
    manim_code = Column(Text, nullable=True)
    clip_url = Column(Text, nullable=True)
    render_status = Column(
        SAEnum(RenderStatus, name="render_status"),
        nullable=False,
        default=RenderStatus.pending,
        server_default="pending",
        index=True,
    )

    lecture = relationship(
        "Lecture",
        back_populates="concepts",
    )
