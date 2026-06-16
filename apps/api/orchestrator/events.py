"""Event bus: PipelineEvent dataclass, enum, and Redis pub-sub bridge."""
import asyncio
import enum
import json
import logging
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, Optional

import redis.asyncio as aioredis

from config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Redis connection, keyed by event loop.
# redis.asyncio binds its connection pool to the loop that created it. Each
# Celery task runs in a FRESH event loop (asyncio.new_event_loop), so a single
# cached client would be bound to a closed loop on the 2nd+ task — every
# publish() would then fail silently and the SSE/live terminal would show
# nothing. We therefore (re)create the client whenever the running loop changes.
# ---------------------------------------------------------------------------
_redis: Optional[aioredis.Redis] = None
_redis_loop: Optional[asyncio.AbstractEventLoop] = None


async def _get_redis() -> aioredis.Redis:
    global _redis, _redis_loop
    loop = asyncio.get_running_loop()
    if _redis is None or _redis_loop is not loop:
        _redis = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
        _redis_loop = loop
    return _redis


# ---------------------------------------------------------------------------
# Event types
# ---------------------------------------------------------------------------


class PipelineEventType(str, enum.Enum):
    """All event types emitted during a pipeline run."""

    AGENT_STARTED = "AGENT_STARTED"
    AGENT_COMPLETED = "AGENT_COMPLETED"
    AGENT_FAILED = "AGENT_FAILED"
    AGENT_RETRYING = "AGENT_RETRYING"
    PIPELINE_COMPLETED = "PIPELINE_COMPLETED"
    PIPELINE_FAILED = "PIPELINE_FAILED"
    PROGRESS_UPDATE = "PROGRESS_UPDATE"


# ---------------------------------------------------------------------------
# Event payload
# ---------------------------------------------------------------------------


def _json_serial(obj: Any) -> str:
    """JSON serializer for objects not serializable by default."""
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")


@dataclass
class PipelineEvent:
    """Immutable event emitted at every pipeline status change."""

    event_type: PipelineEventType
    lecture_id: str
    agent_name: Optional[str]
    message: str
    progress_pct: int  # 0-100
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    metadata: Dict[str, Any] = field(default_factory=dict)

    # ── serialisation helpers ────────────────────────────────────────
    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        d["event_type"] = self.event_type.value
        d["timestamp"] = self.timestamp.isoformat()
        return d

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), default=_json_serial)

    def to_sse(self) -> str:
        """Format as a server-sent event string."""
        return f"event: {self.event_type.value}\ndata: {self.to_json()}\n\n"


# ---------------------------------------------------------------------------
# Publishing
# ---------------------------------------------------------------------------


def _channel_name(lecture_id: str) -> str:
    return f"lecture:{lecture_id}:events"


async def publish_event(event: Dict[str, Any] | PipelineEvent) -> None:
    """Publish an event to the Redis channel for the given lecture.

    Accepts either a raw dict (from BaseAgent.emit_event) or a PipelineEvent.
    """
    try:
        r = await _get_redis()

        if isinstance(event, PipelineEvent):
            channel = _channel_name(event.lecture_id)
            payload = event.to_json()
        else:
            # Legacy dict path used by BaseAgent.emit_event
            lecture_id = event.get("lecture_id", "unknown")
            channel = _channel_name(lecture_id)
            payload = json.dumps(event, default=_json_serial)

        await r.publish(channel, payload)
    except Exception:
        # Fire-and-forget: never let a pub-sub failure crash the pipeline
        logger.exception("Failed to publish event to Redis")


# ---------------------------------------------------------------------------
# Subscribing (used by the SSE endpoint)
# ---------------------------------------------------------------------------


async def subscribe_events(lecture_id: str):
    """Async generator that yields JSON strings from the Redis channel.

    Yields PipelineEvent JSON payloads until the channel is unsubscribed
    or the caller breaks out of the loop.
    """
    r = await _get_redis()
    pubsub = r.pubsub()
    channel = _channel_name(lecture_id)

    await pubsub.subscribe(channel)
    try:
        async for msg in pubsub.listen():
            if msg["type"] == "message":
                yield msg["data"]
    finally:
        await pubsub.unsubscribe(channel)
        await pubsub.close()
