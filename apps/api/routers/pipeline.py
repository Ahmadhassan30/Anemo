"""Pipeline trigger and SSE stream routes."""
import asyncio
import json
import logging
from uuid import UUID, UUID as PyUUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import StreamingResponse
from jose import jwt as jose_jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from db.session import get_db
from middleware.auth_middleware import require_professor
from models import Lecture, LectureStatus, User
from orchestrator.events import subscribe_events
from tasks.pipeline_tasks import run_pipeline_task

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/pipeline", tags=["pipeline"])


# ---------------------------------------------------------------------------
# POST /pipeline/{lecture_id}/trigger
# ---------------------------------------------------------------------------


@router.post("/{lecture_id}/trigger")
async def trigger_pipeline(
    lecture_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_professor),
):
    """Kick off the full lecture→animation→publish pipeline."""
    # 1. Verify lecture exists
    result = await db.execute(select(Lecture).where(Lecture.id == lecture_id))
    lecture = result.scalar_one_or_none()
    if not lecture:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lecture not found",
        )

    # 2. Verify ownership
    if lecture.professor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to trigger pipeline for this lecture",
        )

    # 3. Verify video was uploaded
    if not lecture.raw_video_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Video has not been uploaded yet. Upload a video first.",
        )

    # 4. Verify not already running
    if lecture.status != LectureStatus.pending:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Pipeline cannot be triggered: lecture status is '{lecture.status.value}'",
        )

    # 5. Dispatch Celery task
    run_pipeline_task.delay(str(lecture_id))

    # 6. Mark as processing
    lecture.status = LectureStatus.processing
    await db.commit()

    return {"message": "Pipeline started", "lecture_id": str(lecture_id)}


# ---------------------------------------------------------------------------
# GET /pipeline/{lecture_id}/status  (SSE)
# ---------------------------------------------------------------------------


@router.get("/{lecture_id}/status")
async def stream_pipeline_status(
    lecture_id: UUID,
    request: Request,
    token: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    """Stream real-time pipeline events via Server-Sent Events.

    Subscribes to the Redis pub/sub channel ``lecture:{id}:events`` and
    forwards every PipelineEvent JSON to the client as an SSE.

    Includes a 15-second heartbeat to keep the connection alive through
    proxies/load balancers.
    """
    # Resolve token from query param OR Authorization header
    auth_token = token
    if not auth_token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            auth_token = auth_header[7:]

    if not auth_token:
        raise HTTPException(status_code=401, detail="Missing token")

    try:
        payload = jose_jwt.decode(
            auth_token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
        user_id = PyUUID(str(payload.get("sub")))
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    result = await db.execute(select(User).where(User.id == user_id))
    current_user = result.scalar_one_or_none()
    if not current_user or current_user.role.value != "professor":
        raise HTTPException(status_code=403, detail="Forbidden")

    result = await db.execute(
        select(Lecture).where(Lecture.id == lecture_id)
    )
    lecture = result.scalar_one_or_none()
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")
    if lecture.professor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    async def _event_generator():
        """Yield SSE-formatted strings from Redis pub/sub."""
        try:
            subscriber = subscribe_events(str(lecture_id))
            heartbeat_interval = 15  # seconds

            async for payload in _with_heartbeat(subscriber, heartbeat_interval):
                # Check for client disconnect
                if await request.is_disconnected():
                    logger.info("SSE client disconnected for lecture %s", lecture_id)
                    break

                if payload is None:
                    # Heartbeat
                    yield ":\n\n"
                    continue

                # payload is a JSON string from Redis
                try:
                    data = json.loads(payload)
                except json.JSONDecodeError:
                    continue

                event_type = data.get("event_type", "PROGRESS_UPDATE")
                yield f"event: {event_type}\ndata: {payload}\n\n"

                # Stop streaming on terminal events
                if event_type in ("PIPELINE_COMPLETED", "PIPELINE_FAILED"):
                    break

        except GeneratorExit:
            logger.info("SSE generator closed for lecture %s", lecture_id)
        except Exception:
            logger.exception("SSE stream error for lecture %s", lecture_id)

    return StreamingResponse(
        _event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


# ---------------------------------------------------------------------------
# Heartbeat wrapper
# ---------------------------------------------------------------------------


async def _with_heartbeat(subscriber, interval: float):
    """Wrap an async generator to inject None (heartbeat) every *interval* seconds.

    Yields:
        The original payload string, or ``None`` when the heartbeat fires.
    """
    aiter = subscriber.__aiter__()

    while True:
        try:
            payload = await asyncio.wait_for(aiter.__anext__(), timeout=interval)
            yield payload
        except asyncio.TimeoutError:
            # No message for `interval` seconds — send heartbeat
            yield None
        except StopAsyncIteration:
            break
