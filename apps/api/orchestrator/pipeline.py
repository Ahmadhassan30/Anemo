"""Agent orchestration logic for the lecture pipeline."""
from typing import Sequence

from agents.base import BaseAgent


class AgentOrchestrator:
    """Sequence agents and handle failures."""

    def __init__(self, agents: Sequence[BaseAgent], max_retries: int = 5) -> None:
        # TODO: store agent list and retry configuration
        self.agents = list(agents)
        self.max_retries = max_retries

    async def run(self, lecture_id: str) -> None:
        # TODO: orchestrate agent execution order
        pass

    async def on_agent_fail(self, agent: BaseAgent, error: Exception) -> None:
        # TODO: handle failures and trigger retries
        pass
