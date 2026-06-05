"""Render agent that runs Manim and collects clips."""
from agents.base import BaseAgent


class RenderAgent(BaseAgent):
    """Render Manim scenes and collect output clips."""

    name = "render"

    async def run(self, lecture_id: str) -> None:
        # TODO: invoke Manim render for each scene
        pass
