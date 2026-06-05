"""Ingest agent for validating uploads and extracting audio."""
from agents.base import BaseAgent


class IngestAgent(BaseAgent):
    """Validate uploads, extract audio, and push to storage."""

    name = "ingest"

    async def run(self, lecture_id: str) -> None:
        # TODO: validate upload and extract audio track
        pass
