"""Event bus bridge from Redis pub-sub to SSE clients."""
from typing import Any, Dict


async def publish_event(event: Dict[str, Any]) -> None:
    # TODO: push event to Redis or SSE channel
    pass
