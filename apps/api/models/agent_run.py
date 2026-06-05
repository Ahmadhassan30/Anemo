"""AgentRun model for pipeline audit logs."""
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text

from models.base import Base


class AgentRun(Base):
    """Audit log of agent execution attempts."""

    __tablename__ = "agent_runs"

    # TODO: define columns: id, lecture_id, agent_name, status, error, retry_count
    pass
