"""Code generation agent using Planner-Coder-Critic pattern."""
from agents.base import BaseAgent


class CodeGenAgent(BaseAgent):
    """Generate Manim scenes with retries and error context."""

    name = "codegen"

    async def run(self, lecture_id: str) -> None:
        # TODO: generate Manim code per concept
        pass
