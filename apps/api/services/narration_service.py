"""Generate professional narration scripts for animated concept segments."""
import logging

from services.llm_service import llm_service
from utils.prompts import NARRATION_SYSTEM, NARRATION_USER

logger = logging.getLogger(__name__)

DEFAULT_TARGET_SECONDS = 12
WORDS_PER_SECOND = 2.5  # ~150 wpm spoken pace


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
        word_budget = max(int(target_seconds * WORDS_PER_SECOND), 12)

        user_prompt = NARRATION_USER.format(
            title=title,
            summary=summary,
            visual_type=visual_type,
            transcript_segment=transcript_segment or summary,
            target_seconds=target_seconds,
            word_budget=word_budget,
        )

        try:
            result = await llm_service.chat_json(
                system=NARRATION_SYSTEM,
                user=user_prompt,
            )
            script = (result.get("narration") or result.get("script") or "").strip()
            if script:
                # Trim to the budget so the spoken clip stays within its slot.
                words = script.split()
                if len(words) > word_budget * 1.3:
                    script = " ".join(words[: int(word_budget * 1.3)]).rstrip(",;: ") + "."
                logger.info("Narration generated for '%s' (%d words)", title, len(script.split()))
                return script
        except Exception as exc:
            logger.warning("Narration LLM failed for '%s': %s", title, exc)

        # Concise fallback sized to the budget.
        base = (transcript_segment or summary or title).strip()
        words = base.split()
        trimmed = " ".join(words[:word_budget]) if words else str(title)
        return f"Let's look at {title}. {trimmed}".strip()


narration_service = NarrationService()
