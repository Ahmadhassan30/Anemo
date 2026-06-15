"""Template-based Manim code generation."""
import logging
from services.llm_service import llm_service

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────
# TEMPLATE 1 — graph_animation
# ─────────────────────────────────────────
GRAPH_ANIMATION_TEMPLATE = '''from manim import *

class {class_name}(Scene):
    def construct(self):
        self.camera.background_color = "#0f1117"
        title = Text("{title}", font_size=40, color=BLUE)
        title.to_edge(UP, buff=0.4)
        self.play(Write(title), run_time=2)
        self.wait(1)

        axes = Axes(
            x_range={x_range},
            y_range={y_range},
            x_length=8,
            y_length=4.5,
            axis_config={{"color": WHITE, "stroke_width": 2}},
        )
        x_label = axes.get_x_axis_label("{x_label}")
        y_label = axes.get_y_axis_label("{y_label}")
        self.play(Create(axes), Write(x_label), Write(y_label), run_time=2.5)
        self.wait(1)

        curve = axes.plot(lambda x: {formula}, color=YELLOW, stroke_width=3)
        self.play(Create(curve), run_time=3.5)
        self.wait(1.5)

        dot = Dot(axes.c2p({highlight_x}, {formula_at_point}), color=RED, radius=0.12)
        dot_label = Text("{point_label}", font_size=22, color=RED)
        dot_label.next_to(dot, UR, buff=0.15)
        self.play(FadeIn(dot), Write(dot_label), run_time=1.5)
        self.wait(1)

        explanation = Text("{explanation}", font_size=26, color=GREEN)
        explanation.to_edge(DOWN, buff=0.4)
        self.play(FadeIn(explanation), run_time=2)
        self.wait({closing_wait})
'''

# ─────────────────────────────────────────
# TEMPLATE 2 — equation_display
# ─────────────────────────────────────────
EQUATION_DISPLAY_TEMPLATE = '''from manim import *

class {class_name}(Scene):
    def construct(self):
        self.camera.background_color = "#0f1117"
        title = Text("{title}", font_size=38, color=BLUE)
        title.to_edge(UP, buff=0.5)
        self.play(Write(title), run_time=2)
        self.wait(0.8)

        eq_main = MathTex(r"{equation_main}", font_size=64, color=YELLOW)
        eq_main.move_to(UP * 1.2)
        self.play(Write(eq_main), run_time=3)
        self.wait(1.5)

        arrow1 = Arrow(eq_main.get_bottom() + DOWN*0.1,
                       eq_main.get_bottom() + DOWN*0.9,
                       buff=0, color=GOLD)
        self.play(GrowArrow(arrow1), run_time=1)

        eq_step1 = MathTex(r"{equation_step1}", font_size=52, color=WHITE)
        eq_step1.next_to(arrow1, DOWN, buff=0.2)
        self.play(Write(eq_step1), run_time=2.5)
        self.wait(1.5)

        arrow2 = Arrow(eq_step1.get_bottom() + DOWN*0.1,
                       eq_step1.get_bottom() + DOWN*0.9,
                       buff=0, color=GOLD)
        self.play(GrowArrow(arrow2), run_time=1)

        eq_step2 = MathTex(r"{equation_step2}", font_size=52, color=GREEN)
        eq_step2.next_to(arrow2, DOWN, buff=0.2)
        self.play(Write(eq_step2), run_time=2.5)
        self.wait(1)

        box = SurroundingRectangle(eq_step2, color=RED, buff=0.2)
        self.play(Create(box), run_time=1.5)

        explanation = Text("{explanation}", font_size=24, color=TEAL)
        explanation.to_edge(DOWN, buff=0.4)
        self.play(FadeIn(explanation), run_time=2)
        self.wait({closing_wait})
'''

# ─────────────────────────────────────────
# TEMPLATE 3 — diagram_flow
# ─────────────────────────────────────────
DIAGRAM_FLOW_TEMPLATE = '''from manim import *

class {class_name}(Scene):
    def construct(self):
        self.camera.background_color = "#0f1117"
        title = Text("{title}", font_size=38, color=BLUE)
        title.to_edge(UP, buff=0.4)
        self.play(Write(title), run_time=2)
        self.wait(0.8)

        positions = [LEFT*4.5, LEFT*1.5, RIGHT*1.5, RIGHT*4.5]
        colors    = [BLUE, GREEN, YELLOW, RED]
        labels    = ["{step1}", "{step2}", "{step3}", "{step4}"]

        boxes = []
        for pos, color, label in zip(positions, colors, labels):
            box = RoundedRectangle(
                width=2.6, height=1.1,
                corner_radius=0.2,
                color=color,
                fill_color=color,
                fill_opacity=0.3,
                stroke_width=2,
            ).move_to(pos + DOWN*0.3)
            txt = Text(label, font_size=24, color=WHITE)
            txt.move_to(box.get_center())
            boxes.append(VGroup(box, txt))
            self.play(DrawBorderThenFill(box), Write(txt), run_time=1.2)
            self.wait(0.6)

        for i in range(len(boxes) - 1):
            arrow = Arrow(
                boxes[i][0].get_right(),
                boxes[i+1][0].get_left(),
                buff=0.1, color=GOLD, stroke_width=3,
            )
            self.play(GrowArrow(arrow), run_time=1)
            self.wait(0.3)

        desc = Text("{description}", font_size=26, color=GREEN)
        desc.to_edge(DOWN, buff=0.5)
        self.play(FadeIn(desc), run_time=1.5)
        self.wait(1)

        highlight = boxes[-1][0].copy()
        highlight.set_color(RED).set_fill(RED, 0.6)
        self.play(Transform(boxes[-1][0], highlight), run_time=2)
        self.wait({closing_wait})
'''

# ─────────────────────────────────────────
# TEMPLATE 4 — text_bullets (FIXED)
# ─────────────────────────────────────────
TEXT_BULLETS_TEMPLATE = '''from manim import *

class {class_name}(Scene):
    def construct(self):
        self.camera.background_color = "#0f1117"
        title = Text("{title}", font_size=40, color=BLUE)
        title.to_edge(UP, buff=0.5)
        self.play(Write(title), run_time=2)

        underline = Line(
            title.get_left(), title.get_right(),
            color=BLUE, stroke_width=2,
        ).next_to(title, DOWN, buff=0.1)
        self.play(Create(underline), run_time=0.8)
        self.wait(0.5)

        bullet_texts = [
            "{bullet1}",
            "{bullet2}",
            "{bullet3}",
            "{bullet4}",
        ]
        bullet_colors = [YELLOW, GREEN, TEAL, GOLD]

        all_bullets = VGroup()
        for text, color in zip(bullet_texts, bullet_colors):
            dot = Dot(color=color, radius=0.1)
            label = Text(text, font_size=28, color=WHITE)
            row = VGroup(dot, label)
            row.arrange(RIGHT, buff=0.25)
            all_bullets.add(row)

        all_bullets.arrange(DOWN, aligned_edge=LEFT, buff=0.45)
        all_bullets.move_to(ORIGIN + DOWN*0.2)

        for bullet in all_bullets:
            self.play(FadeIn(bullet, shift=RIGHT*0.3), run_time=1.2)
            self.wait(0.8)

        summary = Text("{summary}", font_size=24, color=GREEN)
        summary.to_edge(DOWN, buff=0.4)
        self.play(FadeIn(summary), run_time=2)
        self.wait({closing_wait})
'''

# ─────────────────────────────────────────
# TEMPLATE 5 — code_walkthrough
# ─────────────────────────────────────────
CODE_WALKTHROUGH_TEMPLATE = '''from manim import *

class {class_name}(Scene):
    def construct(self):
        self.camera.background_color = "#0f1117"
        title = Text("{title}", font_size=36, color=BLUE)
        title.to_edge(UP, buff=0.4)
        self.play(Write(title), run_time=2)
        self.wait(0.5)

        bg = Rectangle(
            width=11, height=5,
            color=DARK_GREY,
            fill_color=BLACK,
            fill_opacity=0.85,
            stroke_width=1,
        ).move_to(ORIGIN + DOWN*0.2)
        self.play(FadeIn(bg), run_time=0.8)

        line_data = [
            ("{line1}", TEAL),
            ("{line2}", WHITE),
            ("{line3}", YELLOW),
            ("{line4}", WHITE),
            ("{line5}", GREEN),
        ]

        line_mobs = VGroup()
        for text, color in line_data:
            t = Text(text, font_size=22, color=color)
            line_mobs.add(t)

        line_mobs.arrange(DOWN, aligned_edge=LEFT, buff=0.3)
        line_mobs.move_to(bg.get_center() + LEFT*0.5)

        for line in line_mobs:
            self.play(FadeIn(line, shift=LEFT*0.2), run_time=1.5)
            self.wait(0.4)

        self.wait(0.5)
        hl = SurroundingRectangle(
            line_mobs[{highlight_line}], color=RED, buff=0.1
        )
        self.play(Create(hl), run_time=1)

        annotation = Text("{annotation}", font_size=24, color=RED)
        annotation.to_edge(DOWN, buff=0.3)
        self.play(Write(annotation), run_time=2)
        self.wait({closing_wait})
'''

# ─────────────────────────────────────────
# TEMPLATE 6 — geometric_proof
# ─────────────────────────────────────────
GEOMETRIC_PROOF_TEMPLATE = '''from manim import *

class {class_name}(Scene):
    def construct(self):
        self.camera.background_color = "#0f1117"
        title = Text("{title}", font_size=38, color=BLUE)
        title.to_edge(UP, buff=0.4)
        self.play(Write(title), run_time=2)
        self.wait(0.8)

        shape = {shape_code}
        shape.move_to(LEFT*2.8)
        self.play(DrawBorderThenFill(shape), run_time=2.5)

        shape_label = Text("{shape_label}", font_size=28, color=YELLOW)
        shape_label.next_to(shape, DOWN, buff=0.35)
        self.play(Write(shape_label), run_time=1.2)
        self.wait(1)

        measure = MathTex(r"{key_formula}", font_size=52, color=GREEN)
        measure.move_to(RIGHT*2.5 + UP*0.5)
        self.play(Write(measure), run_time=2.5)
        self.wait(0.8)

        arrow = Arrow(shape.get_right(), measure.get_left(),
                      buff=0.2, color=GOLD)
        self.play(GrowArrow(arrow), run_time=1.2)
        self.wait(0.5)

        proof = Text("{proof_step}", font_size=26, color=TEAL)
        proof.to_edge(DOWN, buff=0.5)
        self.play(FadeIn(proof, shift=UP*0.2), run_time=1.5)

        box = SurroundingRectangle(measure, color=RED, buff=0.2)
        self.play(Create(box), run_time=2)
        self.wait({closing_wait})
'''

TEMPLATES = {
    "graph_animation":  GRAPH_ANIMATION_TEMPLATE,
    "equation_display": EQUATION_DISPLAY_TEMPLATE,
    "diagram_flow":     DIAGRAM_FLOW_TEMPLATE,
    "text_bullets":     TEXT_BULLETS_TEMPLATE,
    "code_walkthrough": CODE_WALKTHROUGH_TEMPLATE,
    "geometric_proof":  GEOMETRIC_PROOF_TEMPLATE,
}

# ─────────────────────────────────────────
# PARAM EXTRACTION PROMPTS
# ─────────────────────────────────────────
GRAPH_PARAMS_PROMPT = """
Extract animation parameters for a graph animation.
Concept: {concept_title}
Transcript: {transcript}

Return ONLY valid JSON, no markdown:
{{
  "title": "short title max 5 words",
  "x_label": "x",
  "y_label": "y",
  "x_range": [-3, 3, 1],
  "y_range": [-1, 5, 1],
  "formula": "x**2",
  "highlight_x": 1,
  "formula_at_point": 1,
  "point_label": "key point",
  "explanation": "one sentence max 10 words"
}}
Use a real relevant math formula. x_range and y_range must be
lists of exactly 3 numbers.
"""

EQUATION_PARAMS_PROMPT = """
Extract parameters for an equation derivation animation.
Concept: {concept_title}
Transcript: {transcript}

Return ONLY valid JSON, no markdown:
{{
  "title": "short title max 5 words",
  "equation_main": "E = mc^2",
  "equation_step1": "E = m \\\\cdot c^2",
  "equation_step2": "E \\\\propto m",
  "explanation": "one sentence max 10 words"
}}
Use real LaTeX notation relevant to the concept.
"""

DIAGRAM_PARAMS_PROMPT = """
Create a 4-step flow diagram for this educational concept.
Concept: {concept_title}
Transcript: {transcript}

Use REAL domain-specific words from the concept and transcript.
Do NOT use generic labels like "Step 1", "Input", "Output", "Process".

Return ONLY valid JSON, no markdown:
{{
  "title": "short title max 6 words",
  "step1": "Real first stage (max 4 words)",
  "step2": "Real second stage (max 4 words)",
  "step3": "Real third stage (max 4 words)",
  "step4": "Real fourth stage (max 4 words)",
  "description": "One clear sentence describing the full process, max 15 words"
}}
"""

BULLETS_PARAMS_PROMPT = """
Extract 4 key teaching points for an animated explainer slide.
Concept: {concept_title}
Transcript: {transcript}

Use REAL content from the transcript. No generic filler text.
Each bullet must teach something specific, max 10 words each.

Return ONLY valid JSON, no markdown:
{{
  "title": "short title max 6 words",
  "bullet1": "First teaching point max 10 words",
  "bullet2": "Second teaching point max 10 words",
  "bullet3": "Third teaching point max 10 words",
  "bullet4": "Fourth teaching point max 10 words",
  "summary": "One memorable takeaway max 15 words"
}}
"""

CODE_PARAMS_PROMPT = """
Extract parameters for a code walkthrough animation.
Concept: {concept_title}
Transcript: {transcript}

Return ONLY valid JSON, no markdown:
{{
  "title": "short title max 5 words",
  "line1": "# first line or comment",
  "line2": "second line of code",
  "line3": "third line of code",
  "line4": "fourth line of code",
  "line5": "fifth line of code",
  "highlight_line": 2,
  "annotation": "what this line does max 8 words"
}}
highlight_line must be integer 0, 1, 2, 3, or 4.
Keep each line under 44 characters.
"""

GEOMETRIC_PARAMS_PROMPT = """
Extract parameters for a geometric proof animation.
Concept: {concept_title}
Transcript: {transcript}

Return ONLY valid JSON, no markdown:
{{
  "title": "short title max 5 words",
  "shape_code": "Circle(radius=1.5, color=BLUE, fill_color=BLUE, fill_opacity=0.3)",
  "shape_label": "Circle",
  "key_formula": "A = \\\\pi r^2",
  "proof_step": "one sentence proof step max 10 words"
}}
shape_code must be valid Manim for one of:
Circle, Square, Triangle, Rectangle, RegularPolygon.
key_formula must be valid LaTeX.
"""

PARAM_PROMPTS = {
    "graph_animation":  GRAPH_PARAMS_PROMPT,
    "equation_display": EQUATION_PARAMS_PROMPT,
    "diagram_flow":     DIAGRAM_PARAMS_PROMPT,
    "text_bullets":     BULLETS_PARAMS_PROMPT,
    "code_walkthrough": CODE_PARAMS_PROMPT,
    "geometric_proof":  GEOMETRIC_PARAMS_PROMPT,
}

DEFAULT_PARAMS = {
    "graph_animation": {
        "title": "Function Graph",
        "x_label": "x", "y_label": "f(x)",
        "x_range": [-3, 3, 1], "y_range": [-1, 5, 1],
        "formula": "x**2", "highlight_x": 1,
        "formula_at_point": 1, "point_label": "key point",
        "explanation": "The curve shows the relationship",
    },
    "equation_display": {
        "title": "Key Equation",
        "equation_main": "E = mc^2",
        "equation_step1": "E = m \\cdot c^2",
        "equation_step2": "E \\propto m",
        "explanation": "Energy equals mass times speed squared",
    },
    "diagram_flow": {
        "title": "Process Flow",
        "step1": "Collect", "step2": "Process",
        "step3": "Analyze", "step4": "Output",
        "description": "Data flows through each stage sequentially",
    },
    "text_bullets": {
        "title": "Key Concepts",
        "bullet1": "First key idea from the lecture",
        "bullet2": "Second key idea from the lecture",
        "bullet3": "Third key idea from the lecture",
        "bullet4": "Fourth key idea from the lecture",
        "summary": "These points form the core concept",
    },
    "code_walkthrough": {
        "title": "Code Example",
        "line1": "# Initialize the system",
        "line2": "def process(data):",
        "line3": "    result = transform(data)",
        "line4": "    validate(result)",
        "line5": "    return result",
        "highlight_line": 2,
        "annotation": "This line performs the core transformation",
    },
    "geometric_proof": {
        "title": "Geometric Proof",
        "shape_code": "Circle(radius=1.5, color=BLUE, fill_color=BLUE, fill_opacity=0.3)",
        "shape_label": "Circle",
        "key_formula": "A = \\pi r^2",
        "proof_step": "Area scales with the square of radius",
    },
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
        template = TEMPLATES.get(visual_type, TEMPLATES["text_bullets"])
        prompt_t  = PARAM_PROMPTS.get(visual_type, PARAM_PROMPTS["text_bullets"])
        defaults  = DEFAULT_PARAMS.get(visual_type, DEFAULT_PARAMS["text_bullets"])
        concept_title = concept.get("concept") or concept.get("title") or "Key Concept"

        try:
            prompt = prompt_t.format(
                concept_title=concept_title,
                transcript=transcript_segment[:1200],
            )
            params = await llm_service.chat_json(
                system=(
                    "You are a parameter extractor. "
                    "Return ONLY the requested JSON. "
                    "No markdown. No explanation."
                ),
                user=prompt,
            )
            logger.info(f"Params extracted for {visual_type}: {list(params.keys())}")
        except Exception as e:
            logger.error(
                f"Param extraction FAILED [{visual_type}] "
                f"'{concept.get('title')}': {type(e).__name__}: {e}"
            )
            params = {}

        # Merge: defaults first, then LLM params override
        closing_wait = max(int(target_duration - 32), 10)
        merged = {
            **defaults,
            **params,
            "class_name": class_name,
            "title": concept_title,
            "closing_wait": closing_wait,
        }

        # Sanitize highlight_line
        if visual_type == "code_walkthrough":
            hl = merged.get("highlight_line", 2)
            if not isinstance(hl, int) or not 0 <= hl <= 4:
                merged["highlight_line"] = 2

        # Sanitize ranges for graph
        if visual_type == "graph_animation":
            for k in ["x_range", "y_range"]:
                v = merged.get(k)
                if not isinstance(v, list) or len(v) != 3:
                    merged[k] = defaults[k]

        try:
            return template.format(**merged)
        except (KeyError, ValueError) as e:
            logger.error(f"Template format error [{visual_type}]: {e}. Using defaults.")
            return template.format(**{**defaults, "class_name": class_name})


template_service = TemplateService()
