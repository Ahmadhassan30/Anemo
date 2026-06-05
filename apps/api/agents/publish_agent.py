"""Publish agent for YouTube uploads and metadata."""
from agents.base import BaseAgent


class PublishAgent(BaseAgent):
    """Publish final video to YouTube with SEO metadata."""

    name = "publish"

    async def run(self, lecture_id: str) -> None:
        # TODO: upload to YouTube Data API
        pass
