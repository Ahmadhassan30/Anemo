"""Premium, varied Manim scene templates + safe code assembly.

Each visual type has SEVERAL compositional variants. A deterministic per-concept
seed selects the variant plus a palette / backdrop / intro-motion, so two
concepts (even of the same type) look clearly different, while re-renders of the
same concept stay stable. All variants subclass ``StudioScene`` (from the inlined
``PREAMBLE``) and use only well-established Manim CE 0.18 APIs.

``render_template`` is a pure function and sanitizes every interpolated value, so
the generated source is always valid Python regardless of upstream LLM output.
Imports only ``PREAMBLE`` (a string) — safe for offline AST validation.
"""
from __future__ import annotations

import re

from services.manim_studio import PREAMBLE

_NUM_PALETTES = 9   # keep in sync with PALETTES in manim_studio
_NUM_BG_STYLES = 4  # keep in sync with make_backdrop styles in manim_studio
_NUM_INTROS = 3     # keep in sync with title_block intro motions in manim_studio
_HEADER = (
    "\nclass {class_name}(StudioScene):\n"
    "    PAL_INDEX = {pal_index}\n"
    "    BG_STYLE = {bg_style}\n"
    "    INTRO = {intro}\n\n"
    "    def construct(self):\n"
    "        p = self.pal\n"
    '        self.title_block("{kicker}", "{title}")\n'
)

# ---------------------------------------------------------------------------
# GRAPH — variant A: curve + shaded area under the curve
# ---------------------------------------------------------------------------
GRAPH_AREA = _HEADER + '''
        axes, labels = studio_axes(p, {x_range}, {y_range}, "{x_label}", "{y_label}")
        plot = VGroup(axes, labels)
        fit(plot, w=11.4, h=4.3, center=DOWN * 0.45)
        self.play(Create(axes), FadeIn(labels), run_time=1.6)

        f = lambda x: max(min(float({formula}), {y_max}), {y_min})
        curve = axes.plot(f, color=self.acc(0), stroke_width=5)
        self.play(Create(curve), run_time=2.3, rate_func=smooth)
        try:
            lo, hi = sorted((float({x_min}), float({highlight_x})))
            if hi - lo > 0.05:
                area = axes.get_area(curve, x_range=(lo, hi), color=self.acc(0), opacity=0.28)
                self.play(FadeIn(area), run_time=1.0)
        except Exception:
            pass

        dot = Dot(axes.c2p({highlight_x}, {formula_at_point}), color=self.acc(3), radius=0.13)
        lbl = caption("{point_label}", self.acc(3)).scale(0.8)
        lbl.next_to(dot, UR, buff=0.16)
        self.play(GrowFromCenter(dot), Write(lbl), run_time=1.2)

        self.lower_third("{explanation}", self.acc(2))
        self.outro(focus=curve, hold={hold})
'''

# GRAPH — variant B: Riemann rectangles (integral / accumulation intuition)
GRAPH_RIEMANN = _HEADER + '''
        axes, labels = studio_axes(p, {x_range}, {y_range}, "{x_label}", "{y_label}")
        plot = VGroup(axes, labels)
        fit(plot, w=11.4, h=4.3, center=DOWN * 0.45)
        self.play(Create(axes), FadeIn(labels), run_time=1.6)

        f = lambda x: max(min(float({formula}), {y_max}), {y_min})
        curve = axes.plot(f, color=self.acc(0), stroke_width=5)
        self.play(Create(curve), run_time=2.1, rate_func=smooth)
        try:
            rects = axes.get_riemann_rectangles(
                curve, x_range=[float({x_min}), float({x_max})], dx=0.36,
                color=[self.acc(1), self.acc(3)], fill_opacity=0.55, stroke_width=0.5,
            )
            self.play(Create(rects), run_time=1.9)
        except Exception:
            pass

        dot = Dot(axes.c2p({highlight_x}, {formula_at_point}), color=self.acc(3), radius=0.12)
        self.play(GrowFromCenter(dot), run_time=0.7)
        self.lower_third("{explanation}", self.acc(2))
        self.outro(focus=curve, hold={hold})
'''

# GRAPH — variant C: a dot + vertical tracking line sweeping the curve (3b1b)
GRAPH_TRACE = _HEADER + '''
        axes, labels = studio_axes(p, {x_range}, {y_range}, "{x_label}", "{y_label}")
        plot = VGroup(axes, labels)
        fit(plot, w=11.4, h=4.3, center=DOWN * 0.45)
        self.play(Create(axes), FadeIn(labels), run_time=1.4)

        f = lambda x: max(min(float({formula}), {y_max}), {y_min})
        curve = axes.plot(f, color=self.acc(0), stroke_width=5)
        self.play(Create(curve), run_time=1.8, rate_func=smooth)

        t = ValueTracker(float({x_min}))
        dot = always_redraw(lambda: Dot(axes.c2p(t.get_value(), f(t.get_value())),
                                        color=self.acc(3), radius=0.12))
        vline = always_redraw(lambda: axes.get_vertical_line(
            axes.c2p(t.get_value(), f(t.get_value())), color=self.acc(1), stroke_width=2))
        self.add(vline, dot)
        self.play(t.animate.set_value(float({x_max})), run_time=3.0, rate_func=linear)

        self.lower_third("{explanation}", self.acc(2))
        self.outro(focus=curve, hold={hold})
'''

# ---------------------------------------------------------------------------
# EQUATION — variant A: stepwise derivation with arrows
# ---------------------------------------------------------------------------
EQUATION_STEPS = _HEADER + '''
        eq1 = MathTex(r"{equation_main}", color=p["ink"]).scale(1.3)
        eq2 = MathTex(r"{equation_step1}", color=self.acc(0))
        eq3 = MathTex(r"{equation_step2}", color=self.acc(2))
        steps = VGroup(eq1, eq2, eq3).arrange(DOWN, buff=0.75)
        fit(steps, w=10.5, h=4.0, center=DOWN * 0.15)
        a1 = Arrow(eq1.get_bottom(), eq2.get_top(), buff=0.1, color=self.acc(3), stroke_width=3)
        a2 = Arrow(eq2.get_bottom(), eq3.get_top(), buff=0.1, color=self.acc(3), stroke_width=3)
        self.play(Write(eq1), run_time=1.6)
        self.play(GrowArrow(a1), run_time=0.5)
        self.play(Write(eq2), run_time=1.4)
        self.play(GrowArrow(a2), run_time=0.5)
        self.play(Write(eq3), run_time=1.4)
        box = SurroundingRectangle(eq3, color=self.acc(2), buff=0.22)
        self.play(Create(box), run_time=0.9)
        self.lower_third("{explanation}", self.acc(1))
        self.outro(focus=box, hold={hold})
'''

# EQUATION — variant B: transform one form into the next
EQUATION_TRANSFORM = _HEADER + '''
        eq1 = MathTex(r"{equation_main}", color=p["ink"]).scale(1.3)
        fit(eq1, w=10.0, h=2.0, center=UP * 0.7)
        self.play(Write(eq1), run_time=1.8)
        eq2 = MathTex(r"{equation_step1}", color=self.acc(0)).scale(1.15).move_to(DOWN * 0.1)
        self.play(TransformFromCopy(eq1, eq2), run_time=1.6)
        eq3 = MathTex(r"{equation_step2}", color=self.acc(2)).scale(1.15)
        eq3.next_to(eq2, DOWN, buff=0.6)
        self.play(TransformFromCopy(eq2, eq3), run_time=1.6)
        box = SurroundingRectangle(eq3, color=self.acc(2), buff=0.22)
        self.play(Create(box), run_time=0.8)
        self.lower_third("{explanation}", self.acc(3))
        self.outro(focus=box, hold={hold})
'''

# ---------------------------------------------------------------------------
# DIAGRAM — variant A: left-to-right pipeline
# ---------------------------------------------------------------------------
DIAGRAM_ROW = _HEADER + '''
        labels = ["{step1}", "{step2}", "{step3}", "{step4}"]
        nodes = VGroup(*[chip(lbl, self.acc(i), p["ink"]) for i, lbl in enumerate(labels)])
        nodes.arrange(RIGHT, buff=0.7)
        fit(nodes, w=12.6, h=2.4, center=UP * 0.1)
        arrows = VGroup()
        for i in range(len(nodes) - 1):
            arrows.add(Arrow(nodes[i].get_right(), nodes[i + 1].get_left(),
                             buff=0.12, color=p["muted"], stroke_width=3))
        for i, node in enumerate(nodes):
            self.play(DrawBorderThenFill(node[0]), Write(node[1]), run_time=0.7)
            if i < len(arrows):
                self.play(GrowArrow(arrows[i]), run_time=0.45)
        self.play(Indicate(nodes[-1], color=self.acc(2), scale_factor=1.08), run_time=0.8)
        self.lower_third("{description}", self.acc(1))
        self.outro(hold={hold})
'''

# DIAGRAM — variant B: circular cycle with curved arrows
DIAGRAM_CYCLE = _HEADER + '''
        labels = ["{step1}", "{step2}", "{step3}", "{step4}"]
        n = len(labels)
        R = 2.25
        nodes = VGroup()
        for i, lbl in enumerate(labels):
            ang = PI / 2 - i * TAU / n
            c = chip(lbl, self.acc(i), p["ink"], w=2.5, h=1.0)
            c.move_to([R * np.cos(ang), R * np.sin(ang) - 0.25, 0])
            nodes.add(c)
        for node in nodes:
            self.play(DrawBorderThenFill(node[0]), Write(node[1]), run_time=0.6)
        arrows = VGroup()
        for i in range(n):
            a = nodes[i].get_center()
            b = nodes[(i + 1) % n].get_center()
            arrows.add(CurvedArrow(a + (b - a) * 0.3, b + (a - b) * 0.3,
                                   color=p["muted"], angle=-0.55, stroke_width=3))
        self.play(LaggedStart(*[Create(x) for x in arrows], lag_ratio=0.3, run_time=2.0))
        self.lower_third("{description}", self.acc(2))
        self.outro(hold={hold})
'''

# ---------------------------------------------------------------------------
# BULLETS — variant A: marked list
# ---------------------------------------------------------------------------
BULLETS_LIST = _HEADER + '''
        items = ["{bullet1}", "{bullet2}", "{bullet3}", "{bullet4}"]
        rows = VGroup()
        for i, text in enumerate(items):
            marker = RoundedRectangle(width=0.16, height=0.44, corner_radius=0.06,
                                      stroke_width=0, fill_color=self.acc(i), fill_opacity=1)
            label = Text(text, font_size=28, color=p["ink"])
            if label.width > 10.4:
                label.scale_to_fit_width(10.4)
            rows.add(VGroup(marker, label).arrange(RIGHT, buff=0.32))
        rows.arrange(DOWN, aligned_edge=LEFT, buff=0.45)
        fit(rows, w=12.0, h=4.2, center=DOWN * 0.25)
        self.play(LaggedStart(*[FadeIn(r, shift=RIGHT * 0.3) for r in rows],
                              lag_ratio=0.5, run_time=3.2))
        self.lower_third("{summary}", self.acc(2))
        self.outro(focus=rows[0], hold={hold})
'''

# BULLETS — variant B: 2x2 numbered cards
BULLETS_CARDS = _HEADER + '''
        items = ["{bullet1}", "{bullet2}", "{bullet3}", "{bullet4}"]
        cards = VGroup()
        for i, text in enumerate(items):
            card = RoundedRectangle(width=5.6, height=1.7, corner_radius=0.16,
                                    stroke_color=self.acc(i), stroke_width=2,
                                    fill_color=self.acc(i), fill_opacity=0.09)
            num = Text(str(i + 1), font_size=26, color=self.acc(i), weight=BOLD)
            lab = Text(text, font_size=22, color=p["ink"])
            if lab.width > 4.1:
                lab.scale_to_fit_width(4.1)
            inner = VGroup(num, lab).arrange(RIGHT, buff=0.3).move_to(card.get_center())
            cards.add(VGroup(card, inner))
        cards.arrange_in_grid(rows=2, cols=2, buff=0.4)
        fit(cards, w=12.0, h=4.4, center=DOWN * 0.25)
        self.play(LaggedStart(*[FadeIn(c, scale=0.85) for c in cards],
                              lag_ratio=0.4, run_time=2.8))
        self.lower_third("{summary}", self.acc(2))
        self.outro(focus=cards[0], hold={hold})
'''

# ---------------------------------------------------------------------------
# CODE — IDE panel with highlighted line + annotation
# ---------------------------------------------------------------------------
CODE_PANEL = _HEADER + '''
        lines = [
            ("{line1}", self.acc(1)),
            ("{line2}", p["ink"]),
            ("{line3}", self.acc(3)),
            ("{line4}", p["ink"]),
            ("{line5}", self.acc(2)),
        ]
        panel, rows = code_panel(p, lines)
        fit(panel, w=11.2, h=4.9, center=DOWN * 0.2)
        self.play(FadeIn(panel[0]), FadeIn(panel[1]), run_time=0.9)
        self.play(LaggedStart(*[FadeIn(r, shift=RIGHT * 0.25) for r in rows],
                              lag_ratio=0.55, run_time=3.0))
        hl = SurroundingRectangle(rows[{highlight_line}], color=self.acc(4), buff=0.12)
        self.play(Create(hl), run_time=0.9)
        ann = caption("{annotation}", self.acc(4)).scale(0.82)
        if ann.width > 12.0:
            ann.scale_to_fit_width(12.0)
        ann.next_to(panel, DOWN, buff=0.25)
        self.play(FadeIn(ann, shift=UP * 0.15), run_time=1.2)
        self.outro(focus=hl, hold={hold})
'''

# ---------------------------------------------------------------------------
# GEOMETRY — variant A: shape + formula linked by an arrow
# ---------------------------------------------------------------------------
GEOMETRY_LINK = _HEADER + '''
        shape = {shape_code}
        shape.set_stroke(self.acc(0), 3).set_fill(self.acc(0), 0.16)
        shape.scale(1.15).move_to(LEFT * 3.0 + DOWN * 0.2)
        slabel = caption("{shape_label}", self.acc(0)).scale(0.9)
        slabel.next_to(shape, DOWN, buff=0.3)
        self.play(DrawBorderThenFill(shape), run_time=1.6)
        self.play(Write(slabel), run_time=0.8)
        formula = MathTex(r"{key_formula}", color=self.acc(2)).scale(1.2)
        formula.move_to(RIGHT * 3.0 + UP * 0.4)
        arrow = Arrow(shape.get_right(), formula.get_left(), buff=0.3, color=self.acc(3), stroke_width=3)
        self.play(GrowArrow(arrow), run_time=0.8)
        self.play(Write(formula), run_time=1.6)
        box = SurroundingRectangle(formula, color=self.acc(2), buff=0.22)
        self.play(Create(box), run_time=0.8)
        self.lower_third("{proof_step}", self.acc(1))
        self.outro(focus=formula, hold={hold})
'''

# GEOMETRY — variant B: shape with a brace measurement + formula below
GEOMETRY_BRACE = _HEADER + '''
        shape = {shape_code}
        shape.set_stroke(self.acc(0), 3).set_fill(self.acc(0), 0.16)
        shape.scale(1.25).move_to(UP * 0.5)
        self.play(DrawBorderThenFill(shape), run_time=1.6)
        brace = Brace(shape, DOWN, color=p["muted"])
        blabel = caption("{shape_label}", self.acc(0)).scale(0.8)
        blabel.next_to(brace, DOWN, buff=0.15)
        self.play(GrowFromCenter(brace), Write(blabel), run_time=1.0)
        formula = MathTex(r"{key_formula}", color=self.acc(2)).scale(1.2)
        formula.to_edge(DOWN, buff=1.1)
        self.play(Write(formula), run_time=1.5)
        self.lower_third("{proof_step}", self.acc(1))
        self.outro(focus=formula, hold={hold})
'''

VARIANTS = {
    "graph_animation": [GRAPH_AREA, GRAPH_RIEMANN, GRAPH_TRACE],
    "equation_display": [EQUATION_STEPS, EQUATION_TRANSFORM],
    "diagram_flow": [DIAGRAM_ROW, DIAGRAM_CYCLE],
    "text_bullets": [BULLETS_LIST, BULLETS_CARDS],
    "code_walkthrough": [CODE_PANEL],
    "geometric_proof": [GEOMETRY_LINK, GEOMETRY_BRACE],
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
Pick the formula/labels that match the relationship described in the transcript;
only use x**2 if the lecture is genuinely about a quadratic.
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
Derive the equations from the transcript; do NOT output E = mc^2 unless the
lecture is actually about mass-energy equivalence.
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
_NUM_FIELDS = {"pal_index", "bg_style", "intro", "hold", "highlight_line",
               "y_min", "y_max", "x_min", "x_max", "highlight_x", "formula_at_point"}
_TEXT_MAXLEN = {"title": 64}
_DEFAULT_MAXLEN = 90

_ALLOWED_SHAPES = ("Circle", "Square", "Triangle", "Rectangle", "RegularPolygon")


def _clean_text(value: str, maxlen: int) -> str:
    s = str(value).replace("\\", "\\\\").replace('"', "'")
    s = re.sub(r"\s+", " ", s).strip()
    if len(s) > maxlen:
        s = s[: maxlen - 1].rstrip() + "…"
    return s


def _clean_math(value: str) -> str:
    s = str(value).replace('"', "'").replace("\n", " ").replace("\r", " ").strip()
    return s or "x"


def _coerce_float(value, fallback: float) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return float(fallback)


def _sanitize(visual_type: str, merged: dict, defaults: dict) -> None:
    if visual_type == "graph_animation":
        for key in ("x_range", "y_range"):
            val = merged.get(key)
            if not (isinstance(val, (list, tuple)) and len(val) == 3
                    and all(isinstance(n, (int, float)) for n in val)):
                merged[key] = defaults[key]
            else:
                merged[key] = list(val)
        xr, yr = merged["x_range"], merged["y_range"]
        merged["x_min"], merged["x_max"] = xr[0], xr[1]
        merged["y_min"], merged["y_max"] = yr[0], yr[1]
        hx = _coerce_float(merged.get("highlight_x"), defaults["highlight_x"])
        fp = _coerce_float(merged.get("formula_at_point"), defaults["formula_at_point"])
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

    for key, val in list(merged.items()):
        if key in _RAW_FIELDS or key in _NUM_FIELDS or key in ("x_range", "y_range"):
            continue
        if key in _MATH_FIELDS:
            merged[key] = _clean_math(val)
        elif isinstance(val, str):
            merged[key] = _clean_text(val, _TEXT_MAXLEN.get(key, _DEFAULT_MAXLEN))


def _hold_for(target_duration: float) -> float:
    return round(min(max(float(target_duration) * 0.12, 0.8), 2.2), 1)


def _seed_int(seed: str) -> int:
    h = 2166136261
    for ch in str(seed):
        h = (h * 16777619 + ord(ch)) & 0xFFFFFFFF
    return h


def render_template(
    visual_type: str,
    params: dict | None,
    class_name: str,
    title: str,
    target_duration: float = 45.0,
    seed: str | None = None,
    variety_index: int | None = None,
) -> str:
    """Assemble a complete, syntactically-valid Manim scene file.

    Picks the compositional variant + palette + backdrop + intro motion so
    different concepts look distinct while re-renders stay stable.

    When the orchestrator supplies a 0-based ``variety_index`` (the concept's
    position in the lecture), selection is SPREAD by index so consecutive
    concepts never collide on the same look — the old ``si//7``/``si//13``/
    ``si//17`` cycles collided badly within a 4-16 concept lecture, which is
    why every video looked the same. Falls back to a well-distributed hash.
    """
    variants = VARIANTS.get(visual_type) or VARIANTS["text_bullets"]
    defaults = DEFAULT_PARAMS.get(visual_type) or DEFAULT_PARAMS["text_bullets"]

    si = _seed_int(seed or class_name)
    if variety_index is not None:
        vi = int(variety_index)
        template = variants[vi % len(variants)]
        pal_index = vi % _NUM_PALETTES
        bg_style = (vi * 3 + 1) % _NUM_BG_STYLES
        intro = (vi * 2) % _NUM_INTROS
    else:
        template = variants[si % len(variants)]
        pal_index = si % _NUM_PALETTES
        bg_style = (si // 9) % _NUM_BG_STYLES
        intro = (si // 11) % _NUM_INTROS

    merged = {**defaults, **(params or {})}
    merged["class_name"] = class_name
    merged["title"] = title or "Key Concept"
    merged["kicker"] = KICKERS.get(visual_type, "Concept")
    merged["hold"] = _hold_for(target_duration)
    merged["pal_index"] = pal_index
    merged["bg_style"] = bg_style
    merged["intro"] = intro
    _sanitize(visual_type, merged, defaults)

    try:
        return PREAMBLE + "\n\n" + template.format(**merged)
    except (KeyError, ValueError, IndexError):
        # Ultimate fallback: the simplest, guaranteed-valid bullet list.
        safe = {
            **DEFAULT_PARAMS["text_bullets"],
            "class_name": class_name,
            "title": _clean_text(title or "Key Concept", 64),
            "kicker": KICKERS.get(visual_type, "Concept"),
            "hold": merged["hold"],
            "pal_index": merged["pal_index"],
            "bg_style": merged["bg_style"],
            "intro": merged["intro"],
        }
        _sanitize("text_bullets", safe, DEFAULT_PARAMS["text_bullets"])
        return PREAMBLE + "\n\n" + BULLETS_LIST.format(**safe)
