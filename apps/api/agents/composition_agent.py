"""Composition agent for concatenation and audio sync."""
from agents.base import BaseAgent


class CompositionAgent(BaseAgent):
    """Compose final video with voice sync and captions."""

    name = "composition"

    async def run(self, lecture_id: str) -> None:
        # TODO: run ffmpeg composition workflow
        pass
