"""AgentRun model for pipeline audit logs."""
import enum

from sqlalchemy import Column, DateTime, Enum as SAEnum, ForeignKey, Integer, JSON, String, Text, func
from sqlalchemy.orm import relationship

from models.base import Base, TimestampMixin, UUIDMixin


class AgentRunStatus(enum.Enum):
    """Execution states for an agent attempt."""

    started = "started"
    success = "success"
    failed = "failed"
    retrying = "retrying"


class AgentRun(UUIDMixin, TimestampMixin, Base):
    """Audit log of agent execution attempts."""
    __allow_unmapped__ = True

    __tablename__ = "agent_runs"

    lecture_id = Column(ForeignKey("lectures.id", ondelete="CASCADE"), nullable=False, index=True)
    agent_name = Column(String(255), nullable=False)
    status = Column(
        SAEnum(AgentRunStatus, name="agent_run_status"),
        nullable=False,
        default=AgentRunStatus.started,
        server_default="started",
        index=True,
    )
    attempt = Column(Integer, nullable=False, default=1, server_default="1")
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=False,
                        default=func.now(), server_default=func.now())
    finished_at = Column(DateTime(timezone=True), nullable=True)
    metadata_ = Column("metadata", JSON, nullable=True)

    lecture = relationship("Lecture")
