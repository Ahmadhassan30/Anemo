"""Lecture request and response schemas."""
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class LectureCreate(BaseModel):
    """Create lecture payload."""
    title: str


class LectureCreateResponse(BaseModel):
    """Response payload after creating a lecture record."""
    lecture_id: UUID
    title: str


class LectureConfirmUpload(BaseModel):
    """Payload to confirm upload of a video to UploadThing."""
    video_url: str


class LectureRead(BaseModel):
    """Lecture read model."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    professor_id: UUID
    title: str
    raw_video_url: str
    status: str
    youtube_url: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

