"""Lecture model for upload and publishing metadata."""
import enum

from sqlalchemy import Column, Enum as SAEnum, ForeignKey, String, Table, Text
from sqlalchemy.orm import relationship

from models.base import Base, TimestampMixin, UUIDMixin


class LectureStatus(enum.Enum):
    """Lifecycle states for a lecture pipeline run."""

    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"


enrollments = Table(
    "enrollments",
    Base.metadata,
    Column("student_id", ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("lecture_id", ForeignKey("lectures.id", ondelete="CASCADE"), primary_key=True),
)


class Lecture(UUIDMixin, TimestampMixin, Base):
    """Lecture entity linked to professor uploads."""

    __tablename__ = "lectures"

    professor_id = Column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    raw_video_url = Column(Text, nullable=False)
    status = Column(
        SAEnum(LectureStatus, name="lecture_status"),
        nullable=False,
        default=LectureStatus.pending,
        server_default="pending",
        index=True,
    )
    youtube_url = Column(Text, nullable=True)

    professor = relationship(
        "User",
        back_populates="lectures",
    )
    concepts = relationship(
        "Concept",
        back_populates="lecture",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    students = relationship(
        "User",
        secondary="enrollments",
        back_populates="enrollments",
    )
