"""Segmentation agent for concept extraction."""
from agents.base import BaseAgent


class SegmentationAgent(BaseAgent):
    """Segment transcript into structured concept spans."""

    name = "segmentation"

    async def run(self, lecture_id: str) -> None:
        # TODO: call LLM to segment transcript
        pass
