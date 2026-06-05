"""Pipeline event schemas for SSE updates."""
from pydantic import BaseModel


class PipelineEvent(BaseModel):
    """Pipeline SSE event payload."""

    # TODO: add agent status fields
    pass
