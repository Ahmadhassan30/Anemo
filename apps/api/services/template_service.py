"""Template-based Manim code generation.

A tiny LLM call extracts per-concept parameters (title-relevant labels,
formulas, bullet text…); the heavy lifting — the actual animation source — is a
premium hand-authored template assembled by ``manim_templates.render_template``.
No LLM ever writes Manim code, so there is no rate-limit pressure and the output
is consistently styled and renderable.
"""
import asyncio
import logging
import re

from services.llm_service import llm_service
from services.manim_templates import (
    PARAM_PROMPTS,
    BULLETS_PARAMS_PROMPT,
    render_template,
)

logger = logging.getLogger(__name__)

_EXTRACT_ATTEMPTS = 3  # one initial try + retries before falling back


def _topic_aware_fallback(visual_type: str, title: str, summary: str) -> dict:
    """Build TEXT params from the concept's own title/summary.

    Used as a base under any extracted params so a failed/partial extraction
    never injects unrelated canonical content (the old generic defaults like
    'x**2', 'E = mc^2', 'First key idea from the lecture'). Structural/math
    fields (formula, equation, shape) still fall back to the engine's neutral
    DEFAULT_PARAMS downstream — best-effort grounding, never a hard stop.
    """
    text = (summary or "").strip()
    phrases = [p.strip() for p in re.split(r"[.;\n]+", text) if len(p.strip()) > 2]
    t = (title or "Key concept").strip()

    def phrase(i: int, n: int) -> str:
        src = phrases[i] if i < len(phrases) else t
        return " ".join(str(src).split()[:n])

    if visual_type == "diagram_flow":
        return {
            "step1": phrase(0, 3), "step2": phrase(1, 3),
            "step3": phrase(2, 3), "step4": phrase(3, 3),
            "description": " ".join((text or t).split()[:12]),
        }
    if visual_type == "graph_animation":
        return {"point_label": " ".join(t.split()[:4]), "explanation": phrase(0, 9)}
    if visual_type == "equation_display":
        return {"explanation": phrase(0, 9)}
    if visual_type == "code_walkthrough":
        return {"annotation": " ".join(t.split()[:8])}
    if visual_type == "geometric_proof":
        return {"shape_label": " ".join(t.split()[:3]), "proof_step": phrase(0, 10)}
    # text_bullets (and any unknown type) → bullet list from the summary
    return {
        "bullet1": phrase(0, 8), "bullet2": phrase(1, 8),
        "bullet3": phrase(2, 8), "bullet4": phrase(3, 8),
        "summary": " ".join(t.split()[:12]),
    }


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
        summary = concept.get("summary") or concept.get("description") or ""
        prompt_template = PARAM_PROMPTS.get(visual_type, BULLETS_PARAMS_PROMPT)

        prompt = prompt_template.format(
            concept_title=concept_title,
            transcript=(transcript_segment or "")[:1200],
        )

        # Extract params, retrying transient LLM failures before falling back.
        extracted: dict = {}
        for attempt in range(_EXTRACT_ATTEMPTS):
            try:
                result = await llm_service.chat_json(
                    system=(
                        "You are a parameter extractor for an educational "
                        "animation engine. Ground every value in the provided "
                        "transcript — use the lecture's own terms, symbols and "
                        "numbers; never substitute a famous canonical example. "
                        "Return ONLY the requested JSON. No markdown."
                    ),
                    user=prompt,
                )
                if isinstance(result, dict) and result:
                    extracted = result
                    logger.info(
                        "Params extracted for %s '%s': %s",
                        visual_type, concept_title, list(extracted.keys()),
                    )
                    break
            except Exception as exc:  # noqa: BLE001 — never let extraction abort codegen
                logger.warning(
                    "Param extraction attempt %d/%d failed for %s '%s': %s",
                    attempt + 1, _EXTRACT_ATTEMPTS, visual_type, concept_title, exc,
                )
                if attempt + 1 < _EXTRACT_ATTEMPTS:
                    await asyncio.sleep(0.6 * (attempt + 1))

        if not extracted:
            logger.warning(
                "Param extraction empty for %s '%s' — using topic-aware fallback",
                visual_type, concept_title,
            )

        # Topic-aware base ⊕ extracted (extracted wins). This enriches partial
        # extractions and guarantees on-screen text relates to THIS concept.
        params = {**_topic_aware_fallback(visual_type, concept_title, summary), **extracted}

        code = render_template(
            visual_type=visual_type,
            params=params,
            class_name=class_name,
            title=concept_title,
            target_duration=target_duration,
            # Stable per-concept seed → reproducible; variety_index spreads the
            # look across the lecture so no two scenes share the same style.
            seed=str(concept.get("id") or class_name),
            variety_index=concept.get("variety_index"),
        )
        logger.info(
            "Generated %s scene for %s (%d chars)",
            visual_type, class_name, len(code),
        )
        return code


template_service = TemplateService()
