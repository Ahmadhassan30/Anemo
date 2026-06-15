"""LectureOS Studio Kit.

This module exports a single string, ``PREAMBLE``, which is prepended to every
generated Manim scene file. It defines a cohesive premium visual system —
palette, typography, depth background, layout helpers and a ``StudioScene`` base
class — so each rendered clip looks like part of one polished production.

The preamble is *inlined* into the generated ``.py`` scene file (not imported),
so the render environment only ever needs ``manim`` itself on the path. This
module deliberately imports nothing heavy: it is just text, which keeps it safe
to import for offline AST-validation of generated scenes.
"""

PREAMBLE = '''from manim import *
import numpy as np

# ============================================================================
# LectureOS Studio Kit — premium, self-contained visual system
# ============================================================================
BG_DEEP  = "#080b11"
BG_COLOR = "#0d1117"
SURFACE  = "#161d29"
INK      = "#E6EDF3"
MUTED    = "#8b97a7"
GRIDCLR  = "#161d29"

C_BLUE   = "#5aa2ff"
C_TEAL   = "#2bd9c4"
C_GREEN  = "#46d27f"
C_AMBER  = "#ecc457"
C_VIOLET = "#b98cff"
C_CORAL  = "#ff7b72"
ACCENTS  = [C_BLUE, C_TEAL, C_AMBER, C_VIOLET, C_GREEN, C_CORAL]

config.background_color = BG_COLOR

# Safe interior box so content never collides with title or lower-thirds.
SAFE_W = 12.6
SAFE_H = 4.6


def studio_backdrop():
    """A subtle gradient field + faint grid for depth — never flat color."""
    fw, fh = config.frame_width, config.frame_height
    # Real vertical gradient: a stack of thin strips, so the gradient actually
    # distributes across submobjects (a single Rectangle collapses to one color).
    bg = VGroup()
    n_strips = 32
    strip_h = (fh + 0.6) / n_strips
    for i in range(n_strips):
        s = Rectangle(width=fw + 0.6, height=strip_h + 0.03, stroke_width=0)
        s.move_to([0, (fh + 0.6) / 2 - (i + 0.5) * strip_h, 0])
        bg.add(s)
    bg.set_fill(opacity=1).set_color_by_gradient(BG_DEEP, BG_COLOR, BG_DEEP)
    grid = VGroup()
    step = 0.9
    x = -fw / 2
    while x <= fw / 2 + 0.01:
        grid.add(Line([x, -fh / 2, 0], [x, fh / 2, 0], stroke_width=0.6, color=GRIDCLR))
        x += step
    y = -fh / 2
    while y <= fh / 2 + 0.01:
        grid.add(Line([-fw / 2, y, 0], [fw / 2, y, 0], stroke_width=0.6, color=GRIDCLR))
        y += step
    grid.set_opacity(0.4)
    return VGroup(bg, grid)


def fit(group, w=SAFE_W, h=SAFE_H, center=None):
    """Scale a group down to fit a bounded box, then position it."""
    if group.width > w:
        group.scale_to_fit_width(w)
    if group.height > h:
        group.scale_to_fit_height(h)
    if center is not None:
        group.move_to(center)
    return group


def kicker(text, color=C_TEAL):
    return Text(str(text).upper(), font_size=20, color=color, weight=BOLD)


def headline(text, color=INK):
    return Text(str(text), font_size=40, color=color, weight=BOLD)


def caption(text, color=MUTED):
    return Text(str(text), font_size=26, color=color)


def accent_rule(width=3.4, color=C_TEAL):
    return Line(LEFT * width / 2, RIGHT * width / 2, stroke_width=4, color=color)


def studio_axes(x_range, y_range, x_label="x", y_label="y"):
    axes = Axes(
        x_range=x_range, y_range=y_range,
        x_length=9.0, y_length=4.6,
        axis_config={"color": MUTED, "stroke_width": 2.2},
        tips=True,
    )
    xl = axes.get_x_axis_label(Text(str(x_label), font_size=24, color=MUTED))
    yl = axes.get_y_axis_label(Text(str(y_label), font_size=24, color=MUTED))
    return axes, VGroup(xl, yl)


def chip(label, color):
    """A rounded, glowing node used in flow diagrams."""
    box = RoundedRectangle(
        width=2.8, height=1.2, corner_radius=0.24,
        stroke_color=color, stroke_width=2.5,
        fill_color=color, fill_opacity=0.15,
    )
    txt = Text(str(label), font_size=23, color=INK, weight=BOLD)
    if txt.width > 2.4:
        txt.scale_to_fit_width(2.4)
    txt.move_to(box.get_center())
    return VGroup(box, txt)


def code_panel(lines):
    """A dark IDE-style panel. ``lines`` is a list of (text, color) tuples."""
    panel = RoundedRectangle(
        width=10.8, height=5.0, corner_radius=0.18,
        stroke_color=SURFACE, stroke_width=1.5,
        fill_color=BG_DEEP, fill_opacity=0.96,
    )
    dots = VGroup(*[Dot(radius=0.08, color=c) for c in (C_CORAL, C_AMBER, C_GREEN)])
    dots.arrange(RIGHT, buff=0.18).move_to(panel.get_corner(UL) + RIGHT * 0.5 + DOWN * 0.4)
    rows = VGroup()
    for text, color in lines:
        rows.add(Text(str(text), font="DejaVu Sans Mono", font_size=22, color=color))
    rows.arrange(DOWN, aligned_edge=LEFT, buff=0.32)
    if rows.width > 9.6:
        rows.scale_to_fit_width(9.6)
    rows.next_to(dots, DOWN, aligned_edge=LEFT, buff=0.45)
    return VGroup(panel, dots, rows), rows


class StudioScene(Scene):
    """Shared base: consistent backdrop, intro title and clean outro."""

    accent = C_TEAL

    def setup(self):
        self.camera.background_color = BG_COLOR
        self.studio_bg = studio_backdrop()
        self.add(self.studio_bg)

    def title_block(self, kicker_text, title_text):
        k = kicker(kicker_text, self.accent)
        h = headline(title_text)
        if h.width > 12.5:
            h.scale_to_fit_width(12.5)
        rule = accent_rule(color=self.accent)
        grp = VGroup(k, h, rule).arrange(DOWN, buff=0.2)
        grp.to_edge(UP, buff=0.5)
        self.play(
            LaggedStart(
                FadeIn(k, shift=DOWN * 0.2),
                Write(h),
                GrowFromCenter(rule),
                lag_ratio=0.45, run_time=1.9,
            )
        )
        return grp

    def lower_third(self, text, color=None):
        c = color or MUTED
        t = caption(text, c)
        if t.width > 12.6:
            t.scale_to_fit_width(12.6)
        t.to_edge(DOWN, buff=0.32)
        self.play(FadeIn(t, shift=UP * 0.2), run_time=1.2)
        return t

    def outro(self, focus=None, hold=1.2):
        if focus is not None:
            self.play(Indicate(focus, color=self.accent, scale_factor=1.06), run_time=0.9)
        self.wait(hold)
        if self.mobjects:
            self.play(FadeOut(*self.mobjects), run_time=0.6)
'''
