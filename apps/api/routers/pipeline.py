"""Pipeline trigger and SSE stream routes."""
from fastapi import APIRouter

router = APIRouter(prefix="/pipeline", tags=["pipeline"])


@router.post("/{lecture_id}/trigger")
async def trigger_pipeline(lecture_id: str):
    # TODO: enqueue pipeline execution
    pass


@router.get("/{lecture_id}/stream")
async def stream_pipeline(lecture_id: str):
    # TODO: stream SSE events for lecture pipeline
    pass
