"""Chat request and response schemas."""
from pydantic import BaseModel


class ChatRequest(BaseModel):
    """Chat request payload."""

    # TODO: add message and lecture reference
    pass


class ChatResponse(BaseModel):
    """Chat response payload."""

    # TODO: add answer and citations
    pass
