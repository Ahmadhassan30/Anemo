"""Code generation agent using the Planner-Coder-Critic pattern.

Generates Manim Community Edition scene code for a single concept, reviews
it with a critic LLM pass, renders via Manim subprocess, and persists the
result.  Failed render errors are injected into the next retry's CODER
prompt so the LLM can self-correct.
"""
import logging
import re
from typing import Any, Dict, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from agents.base import BaseAgent
from config import settings
from models.concept import Concept, RenderStatus
from services.llm_service import llm_service, LLMError
from services.manim_service import render_scene, ManimRenderError
from utils.prompts import (
    MANIM_PLANNER_SYSTEM,
    MANIM_PLANNER_USER,
    MANIM_CODER_SYSTEM,
    MANIM_CODER_USER,
    MANIM_CODER_USER_WITH_ERROR,
    MANIM_CRITIC_SYSTEM,
    MANIM_CRITIC_USER,
)

logger = logging.getLogger(__name__)


class CodeGenError(Exception):
    """Raised when code generation or rendering fails within a retry cycle."""
    pass


def _sanitize_class_name(concept_id: str) -> str:
    """Derive a valid Python class name from a concept UUID.

    Strips hyphens, takes the first 8 hex chars, title-cases, and prefixes
    with ``Concept`` / suffixes with ``Scene``.
    """
    hex_part = concept_id.replace("-", "")[:8]
    # Ensure the hex portion starts with a letter after title-casing
    titled = hex_part.title()
    return f"Concept{titled}Scene"


class CodeGenAgent(BaseAgent):
    """Generate Manim scenes with Planner → Coder → Critic retries."""

    name = "codegen_agent"
    max_retries = 5  # override BaseAgent default of 3

    def __init__(self) -> None:
        super().__init__()
        # Persisted between retries so attempt N+1 can see attempt N's error
        self._last_error: Optional[str] = None

    # ------------------------------------------------------------------
    # BaseAgent.run implementation
    # ------------------------------------------------------------------

    async def run(
        self,
        lecture_id: str,
        db: AsyncSession,
        *,
        concept: Dict[str, Any],
        transcript_segment: str,
        **kwargs,
    ) -> dict:
        concept_id: str = concept["id"]
        concept_title: str = concept["concept"]
        visual_type: str = concept["visual_type"]
        summary: str = concept["summary"]

        # ── STEP 1: PLANNER ──────────────────────────────────────────
        logger.debug("[%s] PLANNER — concept: %s", self.name, concept_title)

        planner_user = MANIM_PLANNER_USER.format(
            title=concept_title,
            visual_type=visual_type,
            summary=summary,
            transcript_segment=transcript_segment,
        )
        plan: dict = await llm_service.chat_json(
            system=MANIM_PLANNER_SYSTEM,
            user=planner_user,
        )

        animation_plan: str = plan.get("animation_plan", "")
        key_visuals = plan.get("key_visuals", [])
        color_scheme = plan.get("color_scheme", [])
        estimated_duration: int = plan.get("estimated_duration_seconds", 60)

        logger.debug(
            "[%s] Plan received — visuals=%d, duration=%ds",
            self.name,
            len(key_visuals),
            estimated_duration,
        )

        # ── STEP 2: CODER ────────────────────────────────────────────
        logger.debug("[%s] CODER — concept: %s", self.name, concept_title)

        class_name = _sanitize_class_name(concept_id)

        coder_system = MANIM_CODER_SYSTEM.format(
            class_name=class_name,
            duration=estimated_duration,
        )

        # Inject the previous render error if this is a retry
        if self._last_error:
            coder_user = MANIM_CODER_USER_WITH_ERROR.format(
                animation_plan=animation_plan,
                key_visuals=key_visuals,
                color_scheme=color_scheme,
                previous_error=self._last_error,
            )
        else:
            coder_user = MANIM_CODER_USER.format(
                animation_plan=animation_plan,
                key_visuals=key_visuals,
                color_scheme=color_scheme,
            )

        raw_code: str = await llm_service.chat(
            system=coder_system,
            user=coder_user,
        )

        # Strip markdown fences if the LLM ignored our instruction
        manim_code = _strip_markdown_fences(raw_code)

        # ── STEP 3: CRITIC ───────────────────────────────────────────
        logger.debug("[%s] CRITIC — concept: %s", self.name, concept_title)

        critic_user = MANIM_CRITIC_USER.format(code=manim_code)
        try:
            review: dict = await llm_service.chat_json(
                system=MANIM_CRITIC_SYSTEM,
                user=critic_user,
            )
        except LLMError:
            # If the critic itself fails to return valid JSON, skip the
            # review step and let the render attempt be the ground truth.
            review = {"valid": True, "issues": [], "fixed_code": None}

        if not review.get("valid", True):
            issues = review.get("issues", [])
            fixed_code = review.get("fixed_code")
            if fixed_code:
                logger.debug(
                    "[%s] Critic found %d issues. Ignoring fixed_code due to hallucination risks, letting Manim test original code.",
                    self.name,
                    len(issues),
                )
                # manim_code = _strip_markdown_fences(fixed_code)
            else:
                # Issues are unfixable by the critic - but the critic might be hallucinating.
                # We will log the issues and let Manim try to render anyway. 
                # If Manim fails, the real error will trigger the retry.
                logger.warning(
                    "[%s] Critic flagged unfixable issues but we will attempt render anyway: %s",
                    self.name,
                    issues,
                )

        # ── STEP 4: RENDER ATTEMPT ───────────────────────────────────
        logger.debug("[%s] RENDER — concept: %s", self.name, concept_title)

        # Mark concept as rendering
        concept_row = await db.get(Concept, concept_id)
        if concept_row:
            concept_row.render_status = RenderStatus.rendering
            await db.commit()

        try:
            clip_path = await render_scene(
                manim_code=manim_code,
                class_name=class_name,
                output_dir=settings.MANIM_OUTPUT_DIR,
                concept_id=concept_id,
            )
        except ManimRenderError as exc:
            # Store error for next attempt's CODER prompt
            self._last_error = str(exc)

            # Mark concept as failed if this was the last retry
            # (BaseAgent.execute_with_retry will re-raise after max_retries)
            if concept_row:
                concept_row.render_status = RenderStatus.failed
                await db.commit()

            raise CodeGenError(
                f"Manim render failed: {exc}"
            ) from exc

        # Clear the error state on success
        self._last_error = None

        # ── STEP 5: PERSIST ──────────────────────────────────────────
        if concept_row:
            concept_row.manim_code = manim_code
            concept_row.clip_url = clip_path
            concept_row.render_status = RenderStatus.done
            await db.commit()

        logger.info(
            "[%s] Concept '%s' rendered successfully → %s",
            self.name,
            concept_title,
            clip_path,
        )

        return {
            "concept_id": concept_id,
            "clip_url": clip_path,
            "class_name": class_name,
        }


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_FENCE_RE = re.compile(
    r"^```(?:python)?\s*\n(.*?)```\s*$", re.DOTALL | re.MULTILINE
)


def _strip_markdown_fences(text: str) -> str:
    """Remove ```python ... ``` wrappers if present."""
    m = _FENCE_RE.search(text)
    if m:
        return m.group(1).strip()
    return text.strip()
