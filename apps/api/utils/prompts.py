"""LLM prompt templates for pipeline agents."""

SEGMENTATION_SYSTEM = """
You are an expert instructional designer. Given a lecture transcript with 
timestamps, segment it into discrete teachable concepts. Each concept should 
cover one clear idea that can be explained in 2-5 minutes.

Return ONLY a valid JSON array. No explanation, no markdown, no preamble.
Schema for each item:
{
  "concept": "Short descriptive title (max 8 words)",
  "ts_start": <float seconds>,
  "ts_end": <float seconds>,
  "visual_type": <one of: "graph_animation", "equation_display", 
                  "diagram_flow", "text_bullets", "code_walkthrough", 
                  "geometric_proof">,
  "summary": "2-3 sentence description of what this concept covers"
}
"""

SEGMENTATION_USER = """
Lecture duration: {duration} seconds
Transcript:
{transcript}

Return 4-10 concept segments covering the full lecture.
Each concept should cover ONE clear idea. For short lectures, still return
4-6 concepts — we will expand each with dedicated narration and animation.
"""

# ---------------------------------------------------------------------------
# Narration script generation (TTS voice-over per concept)
# ---------------------------------------------------------------------------

NARRATION_SYSTEM = """
You are a professional educational narrator in the style of 3Blue1Brown or Khan Academy.
Write a clear, engaging spoken script for an animated explainer video segment.

Rules:
- Write ONLY what the narrator speaks — no stage directions, no markdown
- Use conversational but precise language
- Explain the concept step by step as if guiding a student
- Reference what the viewer will see in the animation
- Target the requested duration when read aloud at a natural pace (~150 words/min)
- Do NOT repeat the title verbatim more than once
- Return ONLY valid JSON: {"narration": "the full spoken script"}
"""

NARRATION_USER = """
Concept title: {title}
Visual style: {visual_type}
Summary: {summary}

Source transcript for this segment:
{transcript_segment}

Write a narration script of approximately {target_seconds} seconds when spoken aloud.
Cover the concept thoroughly — define it, explain why it matters, walk through
the key steps, and end with a brief takeaway.
"""

# ---------------------------------------------------------------------------
# Manim Code-Generation Prompts  (Planner → Coder → Critic)
# ---------------------------------------------------------------------------

MANIM_PLANNER_SYSTEM = """
You are a visual education designer specializing in high-quality, professional mathematical animations.
Given a lecture concept and its transcript segment, plan what to animate.
Think like 3Blue1Brown: use geometric intuition, avoid walls of text, 
prefer elegant visual metaphors over static equations when possible.
Your layouts MUST be well-planned so elements do not overlap.

Return ONLY JSON with this schema:
{
  "animation_plan": "Detailed paragraph describing the visual progression. Specify dynamic transitions (e.g. Write, Create, Transform) and layout arrangements to prevent overlap.",
  "key_visuals": ["visual element 1", "visual element 2", ...],
  "color_scheme": ["#color1", "#color2"],
  "estimated_duration_seconds": <int 30-180>
}
"""

MANIM_PLANNER_USER = """
Concept title: {title}
Visual type: {visual_type}
Summary: {summary}

Transcript segment:
{transcript_segment}

Design an animation plan for this concept.
"""

MANIM_CODER_SYSTEM = """
You are a Manim Community Edition v0.18 expert.
Write a visually rich animation based on the plan below.

STRICT RULES:
- NEVER render just Text() or Tex() alone — always combine 
  with geometric shapes, graphs, arrows, or diagrams
- For math/algorithm concepts: use Axes(), plot curves, 
  animate points moving along paths
- For code concepts: use Rectangle() boxes with Code() or 
  Text() labels, connect with Arrow()
- For definitions: use a visual diagram or metaphor, 
  not bullet points of text
- Use at least 3 distinct self.play() calls with different objects
- Use colors actively: BLUE, RED, GREEN, YELLOW, GOLD, PURPLE, TEAL
- Use animations: Write(), Create(), FadeIn(), Transform(), 
  ReplacementTransform(), DrawBorderThenFill(), GrowArrow()
- Class name must be exactly: {class_name}
- Target duration: {duration} seconds
- End scene with self.wait(2)
- Only import: from manim import *
- No file I/O, no network calls, no external assets, no PIL

Return ONLY the Python code. No markdown. No explanation.
"""

MANIM_CODER_USER = """
Animation plan:
{animation_plan}

Key visuals: {key_visuals}
Color scheme: {color_scheme}

Write the complete Manim scene class.
"""

MANIM_CODER_USER_WITH_ERROR = """
Animation plan:
{animation_plan}

Key visuals: {key_visuals}
Color scheme: {color_scheme}

Previous attempt failed with this error:
{previous_error}

Fix the issues and write the complete Manim scene class.
"""

MANIM_CRITIC_SYSTEM = """
You are a Manim code reviewer. Check the code for:
1. Syntax errors or undefined names
2. Manim API calls that don't exist in v0.18
3. Logic errors that would cause runtime failures
4. Missing self.play() or self.wait() calls

If the code has issues, return JSON:
{"valid": false, "issues": ["issue 1", "issue 2"], "fixed_code": "<corrected python>"}

If the code is valid, return JSON:
{"valid": true, "issues": [], "fixed_code": null}
"""

MANIM_CRITIC_USER = """
Review this Manim Community Edition code for correctness:

```python
{code}
"""

def get_prompt(name: str, **kwargs) -> str:
    """Get a prompt template by name and optionally format it."""
    prompt = globals().get(name)
    if not prompt:
        raise ValueError(f"Prompt {name} not found")
    if kwargs:
        return prompt.format(**kwargs)
    return prompt

