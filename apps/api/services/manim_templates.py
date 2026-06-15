"""Premium Manim scene templates + safe code assembly.

Each template subclasses ``StudioScene`` (defined in the inlined ``PREAMBLE``)
and is paced for a short, punchy explainer beat — no long frozen end-frames.

``render_template`` is a pure function: given a visual type, extracted params,
a class name and a target duration, it returns a complete, self-contained Manim
source file. It performs all sanitation (escaping interpolated text, coercing
numerics, validating ranges) so the generated source is always syntactically
valid Python, even when the upstream LLM returns messy values.

This module imports only ``PREAMBLE`` (a string), so it is safe to import for
offline validation without ``manim`` installed.
"""
from __future__ import annotations

import re

from services.manim_studio import PREAMBLE

# ---------------------------------------------------------------------------
# Scene templates — formatted with sanitized params. The ONLY braces in these
# strings are ``{placeholder}`` fields; all dicts/sets live in the PREAMBLE.
# ---------------------------------------------------------------------------

GRAPH_ANIMATION_TEMPLATE = '''
class {class_name}(StudioScene):
    accent = C_TEAL

    def construct(self):
        self.title_block("{kicker}", "{title}")

        axes, labels = studio_axes({x_range}, {y_range}, "{x_label}", "{y_label}")
        plot = VGroup(axes, labels)
        fit(plot, w=11.5, h=4.4, center=DOWN * 0.4)
        self.play(Create(axes), FadeIn(labels), run_time=1.8)

        curve = axes.plot(lambda x: max(min(float({formula}), {y_max}), {y_min}),
                          color=C_BLUE, stroke_width=5)
        self.play(Create(curve), run_time=2.6, rate_func=smooth)

        dot = Dot(axes.c2p({highlight_x}, {formula_at_point}), color=C_AMBER, radius=0.13)
        glow = dot.copy().scale(2.6).set_opacity(0.22)
        lbl = caption("{point_label}", C_AMBER).scale(0.82)
        lbl.next_to(dot, UR, buff=0.18)
        self.play(FadeIn(glow), GrowFromCenter(dot), Write(lbl), run_time=1.4)

        self.lower_third("{explanation}", C_GREEN)
        self.outro(focus=curve, hold={hold})
'''

EQUATION_DISPLAY_TEMPLATE = '''
class {class_name}(StudioScene):
    accent = C_VIOLET

    def construct(self):
        self.title_block("{kicker}", "{title}")

        eq1 = MathTex(r"{equation_main}", color=INK).scale(1.3)
        eq2 = MathTex(r"{equation_step1}", color=C_BLUE)
        eq3 = MathTex(r"{equation_step2}", color=C_GREEN)
        steps = VGroup(eq1, eq2, eq3).arrange(DOWN, buff=0.75)
        fit(steps, w=10.5, h=4.0, center=DOWN * 0.15)

        a1 = Arrow(eq1.get_bottom(), eq2.get_top(), buff=0.1, color=C_AMBER, stroke_width=3)
        a2 = Arrow(eq2.get_bottom(), eq3.get_top(), buff=0.1, color=C_AMBER, stroke_width=3)

        self.play(Write(eq1), run_time=1.7)
        self.play(GrowArrow(a1), run_time=0.6)
        self.play(Write(eq2), run_time=1.5)
        self.play(GrowArrow(a2), run_time=0.6)
        self.play(Write(eq3), run_time=1.5)

        box = SurroundingRectangle(eq3, color=C_GREEN, buff=0.22)
        self.play(Create(box), run_time=1.0)

        self.lower_third("{explanation}", C_TEAL)
        self.outro(focus=box, hold={hold})
'''

DIAGRAM_FLOW_TEMPLATE = '''
class {class_name}(StudioScene):
    accent = C_BLUE

    def construct(self):
        self.title_block("{kicker}", "{title}")

        labels = ["{step1}", "{step2}", "{step3}", "{step4}"]
        palette = [C_BLUE, C_TEAL, C_VIOLET, C_GREEN]
        nodes = VGroup(*[chip(lbl, palette[i]) for i, lbl in enumerate(labels)])
        nodes.arrange(RIGHT, buff=0.7)
        fit(nodes, w=12.6, h=2.4, center=UP * 0.1)

        arrows = VGroup()
        for i in range(len(nodes) - 1):
            arrows.add(Arrow(nodes[i].get_right(), nodes[i + 1].get_left(),
                             buff=0.12, color=MUTED, stroke_width=3))

        for i, node in enumerate(nodes):
            self.play(DrawBorderThenFill(node[0]), Write(node[1]), run_time=0.8)
            if i < len(arrows):
                self.play(GrowArrow(arrows[i]), run_time=0.5)

        self.play(Indicate(nodes[-1], color=C_GREEN, scale_factor=1.08), run_time=0.9)
        self.lower_third("{description}", C_TEAL)
        self.outro(hold={hold})
'''

TEXT_BULLETS_TEMPLATE = '''
class {class_name}(StudioScene):
    accent = C_AMBER

    def construct(self):
        self.title_block("{kicker}", "{title}")

        items = ["{bullet1}", "{bullet2}", "{bullet3}", "{bullet4}"]
        palette = [C_BLUE, C_TEAL, C_VIOLET, C_GREEN]
        rows = VGroup()
        for i, text in enumerate(items):
            marker = RoundedRectangle(width=0.16, height=0.44, corner_radius=0.06,
                                      stroke_width=0, fill_color=palette[i], fill_opacity=1)
            label = Text(text, font_size=28, color=INK)
            if label.width > 10.4:
                label.scale_to_fit_width(10.4)
            rows.add(VGroup(marker, label).arrange(RIGHT, buff=0.32))
        rows.arrange(DOWN, aligned_edge=LEFT, buff=0.45)
        fit(rows, w=12.0, h=4.2, center=DOWN * 0.25)

        self.play(LaggedStart(*[FadeIn(r, shift=RIGHT * 0.3) for r in rows],
                              lag_ratio=0.5, run_time=3.4))

        self.lower_third("{summary}", C_GREEN)
        self.outro(focus=rows[0], hold={hold})
'''

CODE_WALKTHROUGH_TEMPLATE = '''
class {class_name}(StudioScene):
    accent = C_GREEN

    def construct(self):
        self.title_block("{kicker}", "{title}")

        lines = [
            ("{line1}", C_TEAL),
            ("{line2}", INK),
            ("{line3}", C_AMBER),
            ("{line4}", INK),
            ("{line5}", C_GREEN),
        ]
        panel, rows = code_panel(lines)
        fit(panel, w=11.2, h=4.9, center=DOWN * 0.2)
        self.play(FadeIn(panel[0]), FadeIn(panel[1]), run_time=0.9)
        self.play(LaggedStart(*[FadeIn(r, shift=RIGHT * 0.25) for r in rows],
                              lag_ratio=0.55, run_time=3.0))

        hl = SurroundingRectangle(rows[{highlight_line}], color=C_CORAL, buff=0.12)
        self.play(Create(hl), run_time=0.9)
        ann = caption("{annotation}", C_CORAL).scale(0.82)
        if ann.width > 12.0:
            ann.scale_to_fit_width(12.0)
        ann.next_to(panel, DOWN, buff=0.25)
        self.play(FadeIn(ann, shift=UP * 0.15), run_time=1.2)
        self.outro(focus=hl, hold={hold})
'''

GEOMETRIC_PROOF_TEMPLATE = '''
class {class_name}(StudioScene):
    accent = C_CORAL

    def construct(self):
        self.title_block("{kicker}", "{title}")

        shape = {shape_code}
        shape.set_stroke(C_BLUE, 3).set_fill(C_BLUE, 0.16)
        shape.scale(1.05).move_to(LEFT * 3.2 + DOWN * 0.3)
        slabel = caption("{shape_label}", C_BLUE).scale(0.9)
        slabel.next_to(shape, DOWN, buff=0.3)

        self.play(DrawBorderThenFill(shape), run_time=1.8)
        self.play(Write(slabel), run_time=0.9)

        formula = MathTex(r"{key_formula}", color=C_GREEN).scale(1.2)
        formula.move_to(RIGHT * 3.0 + UP * 0.4)
        arrow = Arrow(shape.get_right(), formula.get_left(), buff=0.3, color=C_AMBER, stroke_width=3)
        self.play(GrowArrow(arrow), run_time=0.8)
        self.play(Write(formula), run_time=1.8)

        box = SurroundingRectangle(formula, color=C_GREEN, buff=0.22)
        self.play(Create(box), run_time=0.9)

        self.lower_third("{proof_step}", C_TEAL)
        self.outro(focus=formula, hold={hold})
'''

TEMPLATES = {
    "graph_animation": GRAPH_ANIMATION_TEMPLATE,
    "equation_display": EQUATION_DISPLAY_TEMPLATE,
    "diagram_flow": DIAGRAM_FLOW_TEMPLATE,
    "text_bullets": TEXT_BULLETS_TEMPLATE,
    "code_walkthrough": CODE_WALKTHROUGH_TEMPLATE,
    "geometric_proof": GEOMETRIC_PROOF_TEMPLATE,
}

KICKERS = {
    "graph_animation": "Function",
    "equation_display": "Derivation",
    "diagram_flow": "Process",
    "text_bullets": "Key Ideas",
    "code_walkthrough": "Walkthrough",
    "geometric_proof": "Geometry",
}

# ---------------------------------------------------------------------------
# Param-extraction prompts (one tiny Groq call fills these per concept)
# ---------------------------------------------------------------------------

GRAPH_PARAMS_PROMPT = """
Extract animation parameters for a graph that teaches this concept.
Concept: {concept_title}
Transcript: {transcript}

Return ONLY valid JSON, no markdown:
{{
  "x_label": "x axis label 1-2 words",
  "y_label": "y axis label 1-2 words",
  "x_range": [-3, 3, 1],
  "y_range": [-1, 5, 1],
  "formula": "x**2",
  "highlight_x": 1,
  "formula_at_point": 1,
  "point_label": "key point label",
  "explanation": "one crisp sentence, max 9 words"
}}
formula must be a valid Python expression in x (e.g. x**2, np.sin(x)).
x_range and y_range must each be a list of exactly 3 numbers [min, max, step].
"""

EQUATION_PARAMS_PROMPT = """
Extract a 3-line equation derivation for this concept.
Concept: {concept_title}
Transcript: {transcript}

Return ONLY valid JSON, no markdown:
{{
  "equation_main": "E = mc^2",
  "equation_step1": "E = m c^2",
  "equation_step2": "E \\\\propto m",
  "explanation": "one crisp sentence, max 9 words"
}}
Use real LaTeX math relevant to the concept. Keep each line short.
"""

DIAGRAM_PARAMS_PROMPT = """
Create a 4-step flow for this concept.
Concept: {concept_title}
Transcript: {transcript}

Use REAL domain words. Do NOT use generic labels like Step 1 / Input / Output.

Return ONLY valid JSON, no markdown:
{{
  "step1": "First stage, max 3 words",
  "step2": "Second stage, max 3 words",
  "step3": "Third stage, max 3 words",
  "step4": "Fourth stage, max 3 words",
  "description": "one sentence describing the flow, max 12 words"
}}
"""

BULLETS_PARAMS_PROMPT = """
Extract 4 specific teaching points for this concept.
Concept: {concept_title}
Transcript: {transcript}

Use REAL content from the transcript. No filler. Each bullet max 8 words.

Return ONLY valid JSON, no markdown:
{{
  "bullet1": "first point",
  "bullet2": "second point",
  "bullet3": "third point",
  "bullet4": "fourth point",
  "summary": "one memorable takeaway, max 12 words"
}}
"""

CODE_PARAMS_PROMPT = """
Extract a 5-line code snippet for this concept.
Concept: {concept_title}
Transcript: {transcript}

Return ONLY valid JSON, no markdown:
{{
  "line1": "# comment or first line",
  "line2": "second line of code",
  "line3": "third line of code",
  "line4": "fourth line of code",
  "line5": "fifth line of code",
  "highlight_line": 2,
  "annotation": "what the highlighted line does, max 8 words"
}}
highlight_line must be an integer 0-4. Keep each line under 42 characters.
"""

GEOMETRIC_PARAMS_PROMPT = """
Extract a geometric figure + key formula for this concept.
Concept: {concept_title}
Transcript: {transcript}

Return ONLY valid JSON, no markdown:
{{
  "shape_code": "Circle(radius=1.5)",
  "shape_label": "shape name",
  "key_formula": "A = \\\\pi r^2",
  "proof_step": "one sentence, max 10 words"
}}
shape_code must be a single valid Manim constructor call for ONE of:
Circle, Square, Triangle, Rectangle, RegularPolygon (e.g. RegularPolygon(n=6)).
Do not set color or fill — only geometry. key_formula must be valid LaTeX.
"""

PARAM_PROMPTS = {
    "graph_animation": GRAPH_PARAMS_PROMPT,
    "equation_display": EQUATION_PARAMS_PROMPT,
    "diagram_flow": DIAGRAM_PARAMS_PROMPT,
    "text_bullets": BULLETS_PARAMS_PROMPT,
    "code_walkthrough": CODE_PARAMS_PROMPT,
    "geometric_proof": GEOMETRIC_PARAMS_PROMPT,
}

DEFAULT_PARAMS = {
    "graph_animation": {
        "x_label": "x", "y_label": "f(x)",
        "x_range": [-3, 3, 1], "y_range": [-1, 5, 1],
        "formula": "x**2", "highlight_x": 1, "formula_at_point": 1,
        "point_label": "key point",
        "explanation": "The curve shows the relationship",
    },
    "equation_display": {
        "equation_main": "E = mc^2",
        "equation_step1": "E = m c^2",
        "equation_step2": "E \\propto m",
        "explanation": "Energy scales with mass",
    },
    "diagram_flow": {
        "step1": "Collect", "step2": "Process", "step3": "Analyze", "step4": "Output",
        "description": "Data flows through each stage in order",
    },
    "text_bullets": {
        "bullet1": "First key idea from the lecture",
        "bullet2": "Second key idea from the lecture",
        "bullet3": "Third key idea from the lecture",
        "bullet4": "Fourth key idea from the lecture",
        "summary": "These points form the core concept",
    },
    "code_walkthrough": {
        "line1": "# initialize the system",
        "line2": "def process(data):",
        "line3": "    result = transform(data)",
        "line4": "    validate(result)",
        "line5": "    return result",
        "highlight_line": 2,
        "annotation": "core transformation step",
    },
    "geometric_proof": {
        "shape_code": "Circle(radius=1.5)",
        "shape_label": "Circle",
        "key_formula": "A = \\pi r^2",
        "proof_step": "Area scales with the square of the radius",
    },
}

# ---------------------------------------------------------------------------
# Sanitation
# ---------------------------------------------------------------------------

_MATH_FIELDS = {"equation_main", "equation_step1", "equation_step2", "key_formula"}
_RAW_FIELDS = {"shape_code", "formula", "class_name", "kicker"}
_TEXT_MAXLEN = {"title": 64}
_DEFAULT_MAXLEN = 90

_ALLOWED_SHAPES = ("Circle", "Square", "Triangle", "Rectangle", "RegularPolygon")


def _clean_text(value: str, maxlen: int) -> str:
    """Escape a value so it is safe inside a double-quoted Python string literal."""
    s = str(value).replace("\\", "\\\\").replace('"', "'")
    s = re.sub(r"\s+", " ", s).strip()
    if len(s) > maxlen:
        s = s[: maxlen - 1].rstrip() + "…"
    return s


def _clean_math(value: str) -> str:
    """Keep LaTeX backslashes; only neutralize quotes/newlines."""
    s = str(value).replace('"', "'").replace("\n", " ").replace("\r", " ").strip()
    return s or "x"


def _coerce_float(value, fallback: float) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return float(fallback)


def _sanitize(visual_type: str, merged: dict, defaults: dict) -> None:
    """In-place: coerce numerics, validate ranges, escape interpolated text."""
    if visual_type == "graph_animation":
        for key in ("x_range", "y_range"):
            val = merged.get(key)
            if not (isinstance(val, (list, tuple)) and len(val) == 3
                    and all(isinstance(n, (int, float)) for n in val)):
                merged[key] = defaults[key]
            else:
                merged[key] = list(val)
        xr, yr = merged["x_range"], merged["y_range"]
        merged["y_min"], merged["y_max"] = yr[0], yr[1]
        hx = _coerce_float(merged.get("highlight_x"), defaults["highlight_x"])
        fp = _coerce_float(merged.get("formula_at_point"), defaults["formula_at_point"])
        # Keep the highlighted point inside the visible axes box.
        merged["highlight_x"] = min(max(hx, xr[0]), xr[1])
        merged["formula_at_point"] = min(max(fp, yr[0]), yr[1])

    if visual_type == "code_walkthrough":
        hl = merged.get("highlight_line", 2)
        try:
            hl = int(hl)
        except (TypeError, ValueError):
            hl = 2
        merged["highlight_line"] = hl if 0 <= hl <= 4 else 2

    if visual_type == "geometric_proof":
        code = str(merged.get("shape_code", "")).strip()
        if not code.startswith(_ALLOWED_SHAPES) or '"' in code or "\n" in code:
            merged["shape_code"] = defaults["shape_code"]

    # Escape every remaining string value destined for a "..." literal.
    for key, val in list(merged.items()):
        if key in _RAW_FIELDS or key in ("x_range", "y_range", "highlight_line"):
            continue
        if key in _MATH_FIELDS:
            merged[key] = _clean_math(val)
        elif isinstance(val, str):
            merged[key] = _clean_text(val, _TEXT_MAXLEN.get(key, _DEFAULT_MAXLEN))


def _hold_for(target_duration: float) -> float:
    """A short breathing beat at the end — never the old multi-second freeze."""
    return round(min(max(float(target_duration) * 0.12, 0.8), 2.2), 1)


def render_template(
    visual_type: str,
    params: dict | None,
    class_name: str,
    title: str,
    target_duration: float = 45.0,
) -> str:
    """Assemble a complete, syntactically-valid Manim scene file."""
    template = TEMPLATES.get(visual_type) or TEMPLATES["text_bullets"]
    defaults = DEFAULT_PARAMS.get(visual_type) or DEFAULT_PARAMS["text_bullets"]

    merged = {**defaults, **(params or {})}
    merged["class_name"] = class_name
    merged["title"] = title or "Key Concept"
    merged["kicker"] = KICKERS.get(visual_type, "Concept")
    merged["hold"] = _hold_for(target_duration)
    _sanitize(visual_type, merged, defaults)

    try:
        body = template.format(**merged)
    except (KeyError, ValueError, IndexError):
        safe = {**defaults, "class_name": class_name,
                "title": _clean_text(title or "Key Concept", 64),
                "kicker": KICKERS.get(visual_type, "Concept"),
                "hold": merged["hold"]}
        _sanitize(visual_type, safe, defaults)
        body = template.format(**safe)

    return PREAMBLE + "\n\n" + body
