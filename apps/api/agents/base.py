"""Base class for all agent implementations."""
import asyncio
import logging
import time
from abc import ABC, abstractmethod
from datetime import datetime, timezone
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
            _t0 = time.monotonic()

            try:
                # 2. Await run()
                result = await self.run(lecture_id, db, **kwargs)

                # 3. On success
                _dur = time.monotonic() - _t0
                run_log.status = AgentRunStatus.success
                run_log.finished_at = datetime.now(timezone.utc)
                await db.commit()
                await self.emit_event(lecture_id, "success", attempt, duration=_dur)
                return result

            except Exception as e:
                # 4. On exception
                _dur = time.monotonic() - _t0
                logger.error("Agent %s failed on attempt %d: %s", self.name, attempt, e)

                is_last_attempt = attempt == self.max_retries
                run_log.status = AgentRunStatus.failed if is_last_attempt else AgentRunStatus.retrying
                run_log.error_message = str(e)
                run_log.finished_at = datetime.now(timezone.utc)
                await db.commit()

                status_str = "failed" if is_last_attempt else "retrying"
                await self.emit_event(lecture_id, status_str, attempt, str(e), duration=_dur)

                if is_last_attempt:
                    raise  # Propagate the error after max retries
                
                # Wait 2^attempt seconds
                await asyncio.sleep(2 ** attempt)
                attempt += 1

    async def emit_event(
        self,
        lecture_id: str,
        status: str,
        attempt: int,
        error: str | None = None,
        duration: float | None = None,
    ) -> None:
        """Publish a richly-formatted progress event to the pipeline event bus."""
        dur = f" in {duration:.1f}s" if duration is not None else ""
        if status == "started":
            msg = f"▸ {self.name} started" + (f" (retry {attempt})" if attempt > 1 else "")
        elif status == "success":
            msg = f"✓ {self.name} completed{dur}"
        elif status == "retrying":
            msg = f"⟳ {self.name} retrying (attempt {attempt}){dur}"
        elif status == "failed":
            msg = f"✗ {self.name} failed (attempt {attempt}){dur}"
        else:
            msg = f"{self.name}: {status}"
        if error:
            msg += f" — {error}"

        event: Dict[str, Any] = {
            "type": "agent_status",
            "event_type": f"AGENT_{status.upper()}" if status in ("started", "failed", "retrying") else "PROGRESS_UPDATE",
            "lecture_id": lecture_id,
            "agent": self.name,
            "agent_name": self.name,
            "status": status,
            "attempt": attempt,
            "message": msg,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "metadata": {"duration_s": round(duration, 2) if duration is not None else None},
        }
        if error:
            event["error"] = error

        await publish_event(event)
