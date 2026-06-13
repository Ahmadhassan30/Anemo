"""Base class for all agent implementations."""
import asyncio
import logging
from abc import ABC, abstractmethod
from typing import Any, Dict

from sqlalchemy.ext.asyncio import AsyncSession
from models.agent_run import AgentRun, AgentRunStatus
from orchestrator.events import publish_event

logger = logging.getLogger(__name__)


class BaseAgent(ABC):
    """Abstract base for pipeline agents."""

    name: str = "base"
    max_retries: int = 3

    @abstractmethod
    async def run(self, lecture_id: str, db: AsyncSession, **kwargs) -> dict:
        """Execute the agent's core logic. Must be implemented by subclasses."""
        pass

    async def execute_with_retry(self, lecture_id: str, db: AsyncSession, **kwargs) -> dict:
        """Run the agent logic with exponential backoff on failure."""
        attempt = 1
        
        while attempt <= self.max_retries:
            # 1. Insert agent_run row
            run_log = AgentRun(
                lecture_id=lecture_id,
                agent_name=self.name,
                status=AgentRunStatus.started,
                attempt=attempt,
            )
            db.add(run_log)
            await db.commit()
            
            await self.emit_event(lecture_id, "started", attempt)

            try:
                # 2. Await run()
                result = await self.run(lecture_id, db, **kwargs)
                
                # 3. On success
                run_log.status = AgentRunStatus.success
                await db.commit()
                await self.emit_event(lecture_id, "success", attempt)
                return result

            except Exception as e:
                # 4. On exception
                logger.error("Agent %s failed on attempt %d: %s", self.name, attempt, e)
                
                is_last_attempt = attempt == self.max_retries
                run_log.status = AgentRunStatus.failed if is_last_attempt else AgentRunStatus.retrying
                run_log.error_message = str(e)
                await db.commit()
                
                status_str = "failed" if is_last_attempt else "retrying"
                await self.emit_event(lecture_id, status_str, attempt, str(e))

                if is_last_attempt:
                    raise  # Propagate the error after max retries
                
                # Wait 2^attempt seconds
                await asyncio.sleep(2 ** attempt)
                attempt += 1

    async def emit_event(self, lecture_id: str, status: str, attempt: int, error: str | None = None) -> None:
        """Publish progress event to the pipeline event bus."""
        event: Dict[str, Any] = {
            "type": "agent_status",
            "lecture_id": lecture_id,
            "agent": self.name,
            "status": status,
            "attempt": attempt,
        }
        if error:
            event["error"] = error
            
        await publish_event(event)
