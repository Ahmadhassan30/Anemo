"""Code generation agent — template-based Manim code generation.

Uses pre-built Manim templates filled with LLM-extracted parameters.
No heavy LLM calls needed — only small param extraction via Groq chat().
Falls back to text_bullets template on render failure.
"""
import logging
from typing import Any, Dict

from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from agents.base import BaseAgent
from config import settings
from models.concept import Concept, RenderStatus
from services.template_service import template_service
from services.manim_service import render_scene, ManimRenderError

logger = logging.getLogger(__name__)


class CodeGenError(Exception):
    """Raised when code generation or rendering fails within a retry cycle."""
    pass


def _sanitize_class_name(concept_id: str) -> str:
    """Derive a valid Python class name from a concept UUID."""
    hex_part = concept_id.replace("-", "")[:8]
    titled = hex_part.title()
    return f"Concept{titled}Scene"


class CodeGenAgent(BaseAgent):
    """Generate Manim scenes with template-based codegen + param extraction."""

    name = "codegen_agent"
    max_retries = 5

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
        concept_id = str(concept.get("id", ""))
        concept_title = concept.get("title", "unknown")
        try:
            visual_type = concept.get("visual_type", "text_bullets")
            class_name = _sanitize_class_name(concept_id)

            logger.debug(
                f"[{self.name}] Generating code for concept: "
                f"{concept.get('concept', concept.get('title', ''))} "
                f"type: {visual_type}"
            )

            # ── STEP 1: Generate code from template (no heavy LLM) ───────
            manim_code = await template_service.generate_code(
                visual_type=visual_type,
                concept=concept,
                transcript_segment=transcript_segment,
                class_name=class_name,
                target_duration=float(concept.get("target_duration", 45.0)),
            )

            # ── STEP 2: Update concept status to rendering ───────────────
            concept_row = await db.get(Concept, concept_id)
            if concept_row:
                concept_row.render_status = RenderStatus.rendering
                concept_row.manim_code = manim_code
                await db.commit()

            # ── STEP 3: Render ───────────────────────────────────────────
            output_dir = f"/tmp/manim_output/{lecture_id}"
            try:
                clip_path = await render_scene(
                    manim_code=manim_code,
                    class_name=class_name,
                    output_dir=output_dir,
                    concept_id=concept_id,
                )
            except ManimRenderError as e:
                # On render failure, fall back to text_bullets template
                logger.warning(
                    f"[{self.name}] Render failed for {visual_type}, "
                    f"falling back to text_bullets: {e}"
                )
                manim_code = await template_service.generate_code(
                    visual_type="text_bullets",
                    concept=concept,
                    transcript_segment=transcript_segment,
                    class_name=class_name,
                    target_duration=float(concept.get("target_duration", 45.0)),
                )
                try:
                    clip_path = await render_scene(
                        manim_code=manim_code,
                        class_name=class_name,
                        output_dir=output_dir,
                        concept_id=concept_id,
                    )
                except ManimRenderError as fallback_exc:
                    if concept_row:
                        concept_row.render_status = RenderStatus.failed
                        await db.commit()
                    raise CodeGenError(
                        f"Manim render failed (even fallback): {fallback_exc}"
                    ) from fallback_exc

            # ── STEP 4: Persist result ───────────────────────────────────
            if concept_row:
                concept_row.clip_url = clip_path
                concept_row.render_status = RenderStatus.done
                concept_row.manim_code = manim_code
                await db.commit()

            logger.info(
                f"[{self.name}] Concept '{concept.get('concept', concept.get('title', ''))}' "
                f"rendered successfully → {clip_path}"
            )

            return {
                "concept_id": concept_id,
                "clip_url": clip_path,
                "class_name": class_name,
            }
        except Exception as e:
            logger.error(
                f"CodegenAgent.run FAILED for concept "
                f"'{concept_title}' ({concept_id}): "
                f"{type(e).__name__}: {e}",
                exc_info=True,
            )
            raise  # re-raise so pipeline marks it failed
