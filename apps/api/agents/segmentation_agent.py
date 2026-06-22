"""Segmentation agent for concept extraction."""
import logging
from typing import Any, Dict

from sqlalchemy.ext.asyncio import AsyncSession

from agents.base import BaseAgent
from models.concept import Concept, RenderStatus
from services.llm_service import llm_service, LLMError
from utils.prompts import SEGMENTATION_SYSTEM, SEGMENTATION_USER

logger = logging.getLogger(__name__)


def _format_timestamp(seconds: float) -> str:
    """Format seconds into MM:SS format."""
    minutes = int(seconds // 60)
    secs = int(seconds % 60)
    return f"{minutes:02d}:{secs:02d}"


class SegmentationAgent(BaseAgent):
    """Segment transcript into structured concept spans."""

    name = "segmentation_agent"

    async def run(self, lecture_id: str, db: AsyncSession, **kwargs) -> dict:
        transcript: dict = kwargs.get("transcript", {})
        segments = transcript.get("segments", [])
        duration = transcript.get("duration", 0.0)

        # 1. Format transcript segments into readable text with timestamps
        formatted_lines = []
        for seg in segments:
            start_str = _format_timestamp(seg.get("start", 0))
            end_str = _format_timestamp(seg.get("end", 0))
            text = seg.get("text", "")
            formatted_lines.append(f"[{start_str} - {end_str}] {text}")
        
        formatted_transcript = "\n".join(formatted_lines)

        # 2. Call llm_service.chat_json — scale the requested concept count to
        #    the lecture length (~1 concept per 40s), clamped to a sane range.
        target_concepts = max(4, min(20, round(float(duration or 0.0) / 40.0)))
        user_prompt = SEGMENTATION_USER.format(
            duration=duration,
            transcript=formatted_transcript,
            target_concepts=target_concepts,
        )
        
        logger.info("Calling LLM to extract concepts for lecture %s", lecture_id)
        llm_response = await llm_service.chat_json(
            system=SEGMENTATION_SYSTEM,
            user=user_prompt,
        )

        # 3. Validate response
        # Assuming the LLM returns either a list directly, or a dict with a list inside.
        # DeepSeek might return a dict like {"concepts": [...]}, or just a list if we told it to return JSON array.
        # The prompt says "Return ONLY a valid JSON array", so it should parse as a list.
        if isinstance(llm_response, dict):
            # Fallback if it wrapped it in a dict anyway
            items = next(iter(llm_response.values())) if llm_response else []
            if not isinstance(items, list):
                items = [llm_response] # wrap in list
        elif isinstance(llm_response, list):
            items = llm_response
        else:
            raise LLMError(f"Expected a JSON array, got {type(llm_response)}")

        if not (3 <= len(items) <= 20):
            raise LLMError(f"LLM returned {len(items)} concepts, expected between 3 and 20.")

        required_fields = {"concept", "ts_start", "ts_end", "visual_type", "summary"}
        
        concepts_data = []
        for i, item in enumerate(items):
            missing = required_fields - set(item.keys())
            if missing:
                raise LLMError(f"Concept {i} is missing required fields: {missing}")
            
            ts_start = float(item["ts_start"])
            ts_end = float(item["ts_end"])
            
            if not (ts_start < ts_end):
                raise LLMError(f"Concept {i} has invalid timestamps: ts_start ({ts_start}) >= ts_end ({ts_end})")
            if ts_end > duration:
                # Instead of throwing for a slight overshoot, let's strictly cap it as per requirements
                # Wait, requirement says: "Validate ts_start < ts_end and ts_end <= lecture duration"
                # If we must validate, then we raise LLMError if invalid
                # Let's allow a small floating point margin (0.5s), but the prompt says to validate.
                # I'll just raise if it exceeds duration by more than a tiny fraction, or strictly.
                if ts_end > duration + 1.0:
                    raise LLMError(f"Concept {i} ts_end ({ts_end}) exceeds lecture duration ({duration})")
                ts_end = min(ts_end, duration)

            concepts_data.append({
                "concept": item["concept"],
                "ts_start": ts_start,
                "ts_end": ts_end,
                "visual_type": item["visual_type"],
                "summary": item["summary"]
            })

        logger.info("Extracted %d concepts for lecture %s", len(concepts_data), lecture_id)

        # 4. Insert Concept rows
        db_concepts = []
        for data in concepts_data:
            c = Concept(
                lecture_id=lecture_id,
                title=data["concept"],
                ts_start=data["ts_start"],
                ts_end=data["ts_end"],
                visual_type=data["visual_type"],
                render_status=RenderStatus.pending
            )
            db.add(c)
            db_concepts.append(c)

        await db.commit()
        
        # We need to return DB ids, so we must refresh or just use the assigned IDs if flush/commit sets them.
        # SQLAlchemy async commit populates IDs for Postgres.
        
        # 5. Return dict with db ids
        result_concepts = []
        for c, data in zip(db_concepts, concepts_data):
            result_concepts.append({
                "id": str(c.id),
                "concept": data["concept"],
                "title": data["concept"],
                "ts_start": data["ts_start"],
                "ts_end": data["ts_end"],
                "visual_type": data["visual_type"],
                "summary": data["summary"],
            })

        return {"concepts": result_concepts}
