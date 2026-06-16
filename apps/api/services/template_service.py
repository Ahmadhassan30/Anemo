"""Template-based Manim code generation.

A tiny LLM call extracts per-concept parameters (title-relevant labels,
formulas, bullet text…); the heavy lifting — the actual animation source — is a
premium hand-authored template assembled by ``manim_templates.render_template``.
No LLM ever writes Manim code, so there is no rate-limit pressure and the output
is consistently styled and renderable.
"""
import logging

from services.llm_service import llm_service
from services.manim_templates import (
    PARAM_PROMPTS,
    BULLETS_PARAMS_PROMPT,
    render_template,
)

logger = logging.getLogger(__name__)


class TemplateService:

    async def generate_code(
        self,
        visual_type: str,
        concept: dict,
        transcript_segment: str,
        class_name: str,
        target_duration: float = 45.0,
    ) -> str:
        concept_title = (
            concept.get("concept")
            or concept.get("title")
            or "Key Concept"
        )
        prompt_template = PARAM_PROMPTS.get(visual_type, BULLETS_PARAMS_PROMPT)

        params: dict = {}
        try:
            prompt = prompt_template.format(
                concept_title=concept_title,
                transcript=(transcript_segment or "")[:1200],
            )
            params = await llm_service.chat_json(
                system=(
                    "You are a parameter extractor for an educational "
                    "animation engine. Return ONLY the requested JSON. "
                    "No markdown. No explanation."
                ),
                user=prompt,
            )
            if not isinstance(params, dict):
                params = {}
            logger.info(
                "Params extracted for %s '%s': %s",
                visual_type, concept_title, list(params.keys()),
            )
        except Exception as exc:  # noqa: BLE001 — never let extraction abort codegen
            logger.warning(
                "Param extraction failed for %s '%s' (using defaults): %s",
                visual_type, concept_title, exc,
            )

        code = render_template(
            visual_type=visual_type,
            params=params,
            class_name=class_name,
            title=concept_title,
            target_duration=target_duration,
            # Stable per-concept seed → distinct-but-reproducible visual variety.
            seed=str(concept.get("id") or class_name),
        )
        logger.info(
            "Generated %s scene for %s (%d chars)",
            visual_type, class_name, len(code),
        )
        return code


template_service = TemplateService()
