"""Schemas for student-facing RAG chat."""

from typing import List, Optional
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    """Payload to send a question to the lecture's RAG system."""
    question: str = Field(..., max_length=500)
    lecture_id: str


class CitationSchema(BaseModel):
    """Citation linking a RAG answer to a specific video segment."""
    ts_start: float
    chunk_text: str
    concept_id: Optional[str] = None
    similarity: Optional[float] = None


class ChatResponse(BaseModel):
    """Response from the RAG system."""
    answer: str
    citations: List[CitationSchema]
    lecture_id: str
    question: str
