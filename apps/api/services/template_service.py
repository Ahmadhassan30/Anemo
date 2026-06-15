"""Template-based Manim code generation — no LLM needed for codegen."""
import json
import logging
from services.llm_service import llm_service

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────
# TEMPLATE 1 — graph_animation
# ─────────────────────────────────────────
GRAPH_ANIMATION_TEMPLATE = '''from manim import *

class {class_name}(Scene):
    def construct(self):
        # Title
        title = Text("{title}", font_size=40, color=BLUE)
        title.to_edge(UP, buff=0.4)
        self.play(Write(title), run_time=1.5)
        self.wait(0.5)

        # Axes
        axes = Axes(
            x_range={x_range},
            y_range={y_range},
            x_length=8,
            y_length=5,
            axis_config={{"color": WHITE, "stroke_width": 2}},
            tips=True,
        )
        x_label = axes.get_x_axis_label("{x_label}")
        y_label = axes.get_y_axis_label("{y_label}")
        self.play(Create(axes), Write(x_label), Write(y_label), run_time=2)

        # Plot curve
        curve = axes.plot(lambda x: {formula}, color=YELLOW, stroke_width=3)
        self.play(Create(curve), run_time=2.5)

        # Highlight a point
        point_x = {highlight_x}
        dot = Dot(axes.c2p(point_x, {formula_at_point}), color=RED, radius=0.12)
        dot_label = Text("{point_label}", font_size=22, color=RED)
        dot_label.next_to(dot, UR, buff=0.15)
        self.play(FadeIn(dot), Write(dot_label), run_time=1)
        self.wait(0.5)

        # Explanation
        explanation = Text("{explanation}", font_size=26, color=GREEN)
        explanation.to_edge(DOWN, buff=0.4)
        self.play(FadeIn(explanation), run_time=1)
        self.wait(2)
'''

# ─────────────────────────────────────────
# TEMPLATE 2 — equation_display
# ─────────────────────────────────────────
EQUATION_DISPLAY_TEMPLATE = '''from manim import *

class {class_name}(Scene):
    def construct(self):
        # Title
        title = Text("{title}", font_size=38, color=BLUE)
        title.to_edge(UP, buff=0.5)
        self.play(Write(title), run_time=1.5)
        self.wait(0.3)

        # Main equation
        eq_main = MathTex(r"{equation_main}", font_size=64, color=YELLOW)
        eq_main.move_to(ORIGIN + UP * 0.5)
        self.play(Write(eq_main), run_time=2)
        self.wait(0.5)

        # Step 1 transformation
        eq_step1 = MathTex(r"{equation_step1}", font_size=52, color=WHITE)
        eq_step1.next_to(eq_main, DOWN, buff=0.7)
        arrow1 = Arrow(eq_main.get_bottom(), eq_step1.get_top(),
                      buff=0.1, color=GOLD)
        self.play(GrowArrow(arrow1), run_time=0.8)
        self.play(Write(eq_step1), run_time=1.5)
        self.wait(0.3)

        # Step 2 transformation
        eq_step2 = MathTex(r"{equation_step2}", font_size=52, color=GREEN)
        eq_step2.next_to(eq_step1, DOWN, buff=0.7)
        arrow2 = Arrow(eq_step1.get_bottom(), eq_step2.get_top(),
                      buff=0.1, color=GOLD)
        self.play(GrowArrow(arrow2), run_time=0.8)
        self.play(Write(eq_step2), run_time=1.5)
        self.wait(0.5)

        # Box the final result
        box = SurroundingRectangle(eq_step2, color=RED, buff=0.2)
        self.play(Create(box), run_time=1)

        # Explanation
        explanation = Text("{explanation}", font_size=24, color=TEAL)
        explanation.to_edge(DOWN, buff=0.4)
        self.play(FadeIn(explanation), run_time=1)
        self.wait(2)
'''

# ─────────────────────────────────────────
# TEMPLATE 3 — diagram_flow
# ─────────────────────────────────────────
DIAGRAM_FLOW_TEMPLATE = '''from manim import *

class {class_name}(Scene):
    def construct(self):
        # Title
        title = Text("{title}", font_size=38, color=BLUE)
        title.to_edge(UP, buff=0.4)
        self.play(Write(title), run_time=1.5)
        self.wait(0.3)

        # Node positions
        positions = [LEFT * 4, LEFT * 1.3, RIGHT * 1.3, RIGHT * 4]
        colors = [BLUE, GREEN, YELLOW, RED]
        labels = ["{step1}", "{step2}", "{step3}", "{step4}"]

        boxes = []
        texts = []
        for i, (pos, color, label) in enumerate(
                zip(positions, colors, labels)):
            box = RoundedRectangle(
                width=2.4, height=1.0,
                corner_radius=0.2,
                color=color,
                fill_color=color,
                fill_opacity=0.25,
                stroke_width=2,
            ).move_to(pos)
            text = Text(label, font_size=22, color=WHITE)
            text.move_to(pos)
            boxes.append(box)
            texts.append(text)
            self.play(
                DrawBorderThenFill(box),
                Write(text),
                run_time=0.8,
            )

        # Arrows between boxes
        for i in range(len(boxes) - 1):
            arrow = Arrow(
                boxes[i].get_right(),
                boxes[i + 1].get_left(),
                buff=0.1,
                color=GOLD,
                stroke_width=3,
            )
            self.play(GrowArrow(arrow), run_time=0.6)

        self.wait(0.5)

        # Description below
        desc = Text("{description}", font_size=26, color=GREEN)
        desc.to_edge(DOWN, buff=0.6)
        self.play(FadeIn(desc), run_time=1)

        # Highlight final step
        highlight = boxes[-1].copy().set_color(RED).set_fill(RED, 0.5)
        self.play(Transform(boxes[-1], highlight), run_time=1)
        self.wait(2)
'''

# ─────────────────────────────────────────
# TEMPLATE 4 — text_bullets
# ─────────────────────────────────────────
TEXT_BULLETS_TEMPLATE = '''from manim import *

class {class_name}(Scene):
    def construct(self):
        # Title
        title = Text("{title}", font_size=40, color=BLUE)
        title.to_edge(UP, buff=0.5)
        self.play(Write(title), run_time=1.5)

        # Underline
        underline = Line(
            title.get_left(), title.get_right(),
            color=BLUE, stroke_width=2
        ).next_to(title, DOWN, buff=0.1)
        self.play(Create(underline), run_time=0.5)
        self.wait(0.3)

        # Bullet points — animate one by one
        bullet_data = [
            ("{bullet1}", YELLOW),
            ("{bullet2}", GREEN),
            ("{bullet3}", TEAL),
            ("{bullet4}", GOLD),
        ]

        bullets = VGroup()
        for i, (text, color) in enumerate(bullet_data):
            dot = Dot(color=color, radius=0.08)
            line = Text(text, font_size=28, color=WHITE)
            line.next_to(dot, RIGHT, buff=0.2)
            row = VGroup(dot, line).arrange(RIGHT, buff=0.2)
            bullets.add(row)

        bullets.arrange(DOWN, aligned_edge=LEFT, buff=0.4)
        bullets.move_to(ORIGIN + DOWN * 0.3)

        for i, bullet in enumerate(bullets):
            self.play(FadeIn(bullet, shift=RIGHT * 0.3), run_time=0.7)
            self.wait(0.3)

        # Summary
        summary = Text("{summary}", font_size=24, color=GREEN)
        summary.to_edge(DOWN, buff=0.4)
        self.play(FadeIn(summary), run_time=1)
        self.wait(2)
'''

# ─────────────────────────────────────────
# TEMPLATE 5 — code_walkthrough
# ─────────────────────────────────────────
CODE_WALKTHROUGH_TEMPLATE = '''from manim import *

class {class_name}(Scene):
    def construct(self):
        # Title
        title = Text("{title}", font_size=36, color=BLUE)
        title.to_edge(UP, buff=0.4)
        self.play(Write(title), run_time=1.5)
        self.wait(0.3)

        # Code block background
        bg = Rectangle(
            width=11, height=5,
            color=DARK_GREY,
            fill_color="#1e1e1e",
            fill_opacity=0.95,
            stroke_width=1,
        ).move_to(ORIGIN + DOWN * 0.2)
        self.play(FadeIn(bg), run_time=0.5)

        # Code lines
        code_lines = [
            ("{line1}", TEAL),
            ("{line2}", WHITE),
            ("{line3}", YELLOW),
            ("{line4}", WHITE),
            ("{line5}", GREEN),
        ]

        line_group = VGroup()
        for text, color in code_lines:
            t = Text(text, font_size=22, color=color,
                    font="Courier New")
            line_group.add(t)

        line_group.arrange(DOWN, aligned_edge=LEFT, buff=0.28)
        line_group.move_to(bg.get_center())

        for line in line_group:
            self.play(AddTextLetterByLetter(line), run_time=0.8)

        self.wait(0.5)

        # Highlight key line
        highlight_box = SurroundingRectangle(
            line_group[{highlight_line}],
            color=RED, buff=0.1, stroke_width=2
        )
        self.play(Create(highlight_box), run_time=0.8)

        # Annotation
        annotation = Text("{annotation}", font_size=24, color=RED)
        annotation.to_edge(DOWN, buff=0.3)
        self.play(Write(annotation), run_time=1)
        self.wait(2)
'''

# ─────────────────────────────────────────
# TEMPLATE 6 — geometric_proof
# ─────────────────────────────────────────
GEOMETRIC_PROOF_TEMPLATE = '''from manim import *

class {class_name}(Scene):
    def construct(self):
        # Title
        title = Text("{title}", font_size=38, color=BLUE)
        title.to_edge(UP, buff=0.4)
        self.play(Write(title), run_time=1.5)
        self.wait(0.3)

        # Main shape
        shape = {shape_code}
        shape.move_to(LEFT * 2.5)
        self.play(DrawBorderThenFill(shape), run_time=1.5)

        # Label the shape
        shape_label = Text("{shape_label}", font_size=28, color=YELLOW)
        shape_label.next_to(shape, DOWN, buff=0.3)
        self.play(Write(shape_label), run_time=0.8)
        self.wait(0.3)

        # Key measurement
        measure = MathTex(r"{key_formula}", font_size=48, color=GREEN)
        measure.move_to(RIGHT * 2.5 + UP * 0.5)
        self.play(Write(measure), run_time=1.5)

        # Supporting explanation
        arrow = Arrow(
            shape.get_right(), measure.get_left(),
            buff=0.2, color=GOLD
        )
        self.play(GrowArrow(arrow), run_time=0.8)
        self.wait(0.3)

        # Proof step
        proof = Text("{proof_step}", font_size=26, color=TEAL)
        proof.to_edge(DOWN, buff=0.5)
        self.play(FadeIn(proof, shift=UP * 0.2), run_time=1)

        # Final highlight
        box = SurroundingRectangle(measure, color=RED, buff=0.2)
        self.play(Create(box), run_time=1)
        self.wait(2)
'''

TEMPLATES = {
    "graph_animation": GRAPH_ANIMATION_TEMPLATE,
    "equation_display": EQUATION_DISPLAY_TEMPLATE,
    "diagram_flow": DIAGRAM_FLOW_TEMPLATE,
    "text_bullets": TEXT_BULLETS_TEMPLATE,
    "code_walkthrough": CODE_WALKTHROUGH_TEMPLATE,
    "geometric_proof": GEOMETRIC_PROOF_TEMPLATE,
}

# ─────────────────────────────────────────
# PARAM EXTRACTION PROMPTS (one per type)
# ─────────────────────────────────────────

GRAPH_PARAMS_PROMPT = """
Extract animation parameters for a graph animation about this concept.
Concept: {concept_title}
Transcript: {transcript}

Return ONLY valid JSON, no markdown:
{{
  "title": "short display title max 6 words",
  "x_label": "x axis label 1-3 words",
  "y_label": "y axis label 1-3 words",
  "x_range": [-3, 3, 1],
  "y_range": [-2, 5, 1],
  "formula": "x**2",
  "highlight_x": 1,
  "formula_at_point": 1,
  "point_label": "key point label",
  "explanation": "one sentence max 10 words"
}}
Use a real math formula relevant to the concept.
x_range and y_range must be lists of 3 numbers [min, max, step].
"""

EQUATION_PARAMS_PROMPT = """
Extract parameters for an equation derivation animation.
Concept: {concept_title}
Transcript: {transcript}

Return ONLY valid JSON, no markdown:
{{
  "title": "short title max 6 words",
  "equation_main": "E = mc^2",
  "equation_step1": "E = m \\\\cdot c^2",
  "equation_step2": "E \\\\propto m",
  "explanation": "one sentence explanation max 10 words"
}}
Use LaTeX math notation. Use real equations relevant to the concept.
"""

DIAGRAM_PARAMS_PROMPT = """
Extract parameters for a flow diagram animation.
Concept: {concept_title}
Transcript: {transcript}

Return ONLY valid JSON, no markdown:
{{
  "title": "short title max 6 words",
  "step1": "Step 1 label",
  "step2": "Step 2 label",
  "step3": "Step 3 label",
  "step4": "Step 4 label",
  "description": "one sentence describing the flow max 10 words"
}}
Each step label must be max 3 words. Make them relevant to the concept.
"""

BULLETS_PARAMS_PROMPT = """
Extract parameters for a bullet points animation.
Concept: {concept_title}
Transcript: {transcript}

Return ONLY valid JSON, no markdown:
{{
  "title": "short title max 6 words",
  "bullet1": "first key point max 6 words",
  "bullet2": "second key point max 6 words",
  "bullet3": "third key point max 6 words",
  "bullet4": "fourth key point max 6 words",
  "summary": "one sentence summary max 10 words"
}}
"""

CODE_PARAMS_PROMPT = """
Extract parameters for a code walkthrough animation.
Concept: {concept_title}
Transcript: {transcript}

Return ONLY valid JSON, no markdown:
{{
  "title": "short title max 6 words",
  "line1": "# comment or first line of code",
  "line2": "second line of code",
  "line3": "third line of code",
  "line4": "fourth line of code",
  "line5": "fifth line of code",
  "highlight_line": 2,
  "annotation": "what this highlighted line does max 8 words"
}}
highlight_line must be 0, 1, 2, 3, or 4 (index).
Write real code relevant to the concept, keep lines under 45 chars.
"""

GEOMETRIC_PARAMS_PROMPT = """
Extract parameters for a geometric proof animation.
Concept: {concept_title}
Transcript: {transcript}

Return ONLY valid JSON, no markdown:
{{
  "title": "short title max 6 words",
  "shape_code": "Circle(radius=1.5, color=BLUE, fill_color=BLUE, fill_opacity=0.3)",
  "shape_label": "shape name",
  "key_formula": "A = \\\\pi r^2",
  "proof_step": "one sentence proof step max 10 words"
}}
shape_code must be valid Manim Python for one of:
Circle, Square, Triangle, Rectangle, RegularPolygon.
key_formula must be valid LaTeX.
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
        "title": "Function Graph",
        "x_label": "x",
        "y_label": "f(x)",
        "x_range": [-3, 3, 1],
        "y_range": [-1, 5, 1],
        "formula": "x**2",
        "highlight_x": 1,
        "formula_at_point": 1,
        "point_label": "key point",
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
        "step1": "Input",
        "step2": "Process",
        "step3": "Output",
        "step4": "Result",
        "description": "Data flows through each stage sequentially",
    },
    "text_bullets": {
        "title": "Key Concepts",
        "bullet1": "First key point",
        "bullet2": "Second key point",
        "bullet3": "Third key point",
        "bullet4": "Fourth key point",
        "summary": "These points form the core concept",
    },
    "code_walkthrough": {
        "title": "Code Example",
        "line1": "# Initialize the system",
        "line2": "def process(data):",
        "line3": "    result = transform(data)",
        "line4": "    return result",
        "line5": "output = process(input)",
        "highlight_line": 2,
        "annotation": "This line does the core transformation",
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
    """
    Generates Manim code from templates + LLM param extraction.
    No LLM needed for the actual code — only for filling in values.
    Uses cheap Groq chat() not chat_strong() — tiny requests only.
    """

    async def generate_code(
        self,
        visual_type: str,
        concept: dict,
        transcript_segment: str,
        class_name: str,
    ) -> str:
        # Get the right template and prompt
        template = TEMPLATES.get(
            visual_type,
            TEMPLATES["text_bullets"]
        )
        prompt_template = PARAM_PROMPTS.get(
            visual_type,
            BULLETS_PARAMS_PROMPT
        )
        defaults = DEFAULT_PARAMS.get(
            visual_type,
            DEFAULT_PARAMS["text_bullets"]
        )

        # Extract params with one small LLM call
        try:
            prompt = prompt_template.format(
                concept_title=concept.get("title", ""),
                transcript=transcript_segment[:600],
            )
            params = await llm_service.chat_json(
                system=(
                    "You are a parameter extractor. "
                    "Return ONLY the requested JSON. "
                    "No explanation. No markdown."
                ),
                user=prompt,
            )
            logger.info(
                f"Extracted params for {visual_type}: "
                f"{list(params.keys())}"
            )
        except Exception as e:
            logger.warning(
                f"Param extraction failed for {visual_type}, "
                f"using defaults: {e}"
            )
            params = defaults.copy()

        # Merge with defaults for any missing keys
        merged = defaults.copy()
        merged.update(params)
        merged["class_name"] = class_name

        # Validate highlight_line for code_walkthrough
        if visual_type == "code_walkthrough":
            hl = merged.get("highlight_line", 2)
            if not isinstance(hl, int) or not (0 <= hl <= 4):
                merged["highlight_line"] = 2

        # Validate x_range and y_range for graph_animation
        if visual_type == "graph_animation":
            for key in ["x_range", "y_range"]:
                val = merged.get(key)
                if not isinstance(val, list) or len(val) != 3:
                    merged[key] = defaults[key]

        try:
            code = template.format(**merged)
            logger.info(
                f"Generated {visual_type} code for "
                f"{class_name} ({len(code)} chars)"
            )
            return code
        except KeyError as e:
            logger.error(
                f"Template key error for {visual_type}: {e}. "
                f"Using defaults."
            )
            defaults["class_name"] = class_name
            return template.format(**defaults)


template_service = TemplateService()
