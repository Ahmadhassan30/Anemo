"""Lecture request and response schemas."""
from pydantic import BaseModel


class LectureCreate(BaseModel):
    """Create lecture payload."""

    # TODO: add lecture title and metadata fields
    pass


class LectureRead(BaseModel):
    """Lecture read model."""

    # TODO: add lecture response fields
    pass
