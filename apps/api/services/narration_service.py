"""Generate professional narration scripts for animated concept segments."""
import logging

from services.llm_service import llm_service
from utils.prompts import NARRATION_SYSTEM, NARRATION_USER

logger = logging.getLogger(__name__)

DEFAULT_TARGET_SECONDS = 45


class NarrationService:
    """Create spoken narration tailored to each concept's animation."""

    async def generate_script(
        self,
        concept: dict,
        transcript_segment: str,
        *,
        target_seconds: int = DEFAULT_TARGET_SECONDS,
    ) -> str:
        title = concept.get("concept") or concept.get("title") or "this concept"
        summary = concept.get("summary", "")
        visual_type = concept.get("visual_type", "text_bullets")

        user_prompt = NARRATION_USER.format(
            title=title,
            summary=summary,
            visual_type=visual_type,
            transcript_segment=transcript_segment or summary,
            target_seconds=target_seconds,
        )

        try:
            result = await llm_service.chat_json(
                system=NARRATION_SYSTEM,
                user=user_prompt,
            )
            script = (result.get("narration") or result.get("script") or "").strip()
            if script:
                logger.info("Narration generated for '%s' (%d chars)", title, len(script))
                return script
        except Exception as exc:
            logger.warning("Narration LLM failed for '%s': %s", title, exc)

        # Fallback: expand transcript into a fuller narration
        base = transcript_segment.strip() or summary.strip() or title
        return (
            f"Let's explore {title}. {base} "
            f"This is a key idea in our lecture, and understanding it will help you "
            f"see how {title.lower()} fits into the bigger picture. "
            f"Pay attention to how the animation illustrates each step of the process."
        )


narration_service = NarrationService()
