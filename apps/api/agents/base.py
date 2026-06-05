"""Base class for all agent implementations."""
from abc import ABC, abstractmethod
from typing import Any, Dict


class BaseAgent(ABC):
    """Abstract base for pipeline agents."""

    name: str = "base"

    @abstractmethod
    async def run(self, lecture_id: str) -> None:
        # TODO: implement agent execution
        pass

    async def retry(self, lecture_id: str, error: Exception) -> None:
        # TODO: implement retry strategy
        pass

    async def emit_event(self, event: Dict[str, Any]) -> None:
        # TODO: publish progress event to SSE bus
        pass
