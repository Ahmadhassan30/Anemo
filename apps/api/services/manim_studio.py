"""LectureOS Studio Kit.

Exports a single string, ``PREAMBLE``, prepended to every generated Manim scene.
It defines a cohesive-but-varied visual system: a set of curated palettes, several
backdrop styles, palette-aware layout/element helpers, and a ``StudioScene`` base
whose look is driven by per-scene class attributes (``PAL_INDEX``/``BG_STYLE``/
``INTRO``). Combined with multiple per-type template variants, this makes every
rendered clip look distinct while remaining 100% template-based (no LLM-written
code) and using only well-established Manim CE 0.18 APIs.

The preamble is *inlined* into each generated ``.py`` file (not imported), so the
render env only needs ``manim``. This module imports nothing heavy.
"""

PREAMBLE = '''from manim import *
import numpy as np

# ============================================================================
# LectureOS Studio Kit — varied, self-contained visual system
# ============================================================================

# Curated palettes. Each: deep/bg/surf backgrounds, ink/muted text, grid line,
# and a list of 5 accent colours. A per-scene seed picks one.
PALETTES = [
    dict(name="aurora", deep="#080b11", bg="#0d1117", surf="#161d29", ink="#E6EDF3",
         muted="#8b97a7", grid="#1b2330", acc=["#5aa2ff", "#2bd9c4", "#46d27f", "#ecc457", "#b98cff"]),
    dict(name="nebula", deep="#0a0613", bg="#140b22", surf="#241636", ink="#f4ecff",
         muted="#9a8bb5", grid="#241a3a", acc=["#b98cff", "#ff84d8", "#7c6cff", "#ffd166", "#67d8ff"]),
    dict(name="reef", deep="#04100f", bg="#08191b", surf="#103030", ink="#e6fffb",
         muted="#7fa7a3", grid="#123433", acc=["#2bd9c4", "#46d27f", "#5aa2ff", "#b6e85b", "#ffd166"]),
    dict(name="ember", deep="#120a06", bg="#1c0f08", surf="#2f1c10", ink="#fff1e6",
         muted="#bd9a82", grid="#2c1c12", acc=["#ff8c5a", "#ff5a7b", "#ffc14d", "#b98cff", "#5ad1c4"]),
    dict(name="graphite", deep="#0a0a0c", bg="#111114", surf="#1d1d22", ink="#f2f2f5",
         muted="#8a8a93", grid="#20202a", acc=["#7aa2ff", "#c0c4cc", "#ffd166", "#ff7b72", "#46d27f"]),
    dict(name="indigo", deep="#070a14", bg="#0c1020", surf="#161c34", ink="#eaf0ff",
         muted="#8893b5", grid="#18203a", acc=["#7c8cff", "#3fe0b0", "#ff9ad5", "#ffd166", "#6fb1ff"]),
]

config.background_color = PALETTES[0]["bg"]

SAFE_W = 12.6
SAFE_H = 4.6


def make_backdrop(pal, style=0):
    """Build one of several depth backgrounds in the given palette."""
    fw, fh = config.frame_width, config.frame_height
    deep, bg, grid_c = pal["deep"], pal["bg"], pal["grid"]

    strips = VGroup()
    n = 28
    sh = (fh + 0.6) / n
    for i in range(n):
        s = Rectangle(width=fw + 0.6, height=sh + 0.04, stroke_width=0)
        s.move_to([0, (fh + 0.6) / 2 - (i + 0.5) * sh, 0])
        strips.add(s)
    strips.set_fill(opacity=1).set_color_by_gradient(deep, bg, deep)

    overlay = VGroup()
    style = int(style) % 4
    if style == 0:
        # Engineering grid
        x = -fw / 2
        while x <= fw / 2 + 0.01:
            overlay.add(Line([x, -fh / 2, 0], [x, fh / 2, 0], stroke_width=0.6, color=grid_c))
            x += 0.95
        y = -fh / 2
        while y <= fh / 2 + 0.01:
            overlay.add(Line([-fw / 2, y, 0], [fw / 2, y, 0], stroke_width=0.6, color=grid_c))
            y += 0.95
        overlay.set_opacity(0.45)
    elif style == 1:
        # Dot matrix
        x = -fw / 2 + 0.4
        while x <= fw / 2:
            y = -fh / 2 + 0.4
            while y <= fh / 2:
                overlay.add(Dot([x, y, 0], radius=0.018, color=grid_c))
                y += 0.62
            x += 0.62
        overlay.set_opacity(0.5)
    elif style == 2:
        # Concentric radial glow
        for r in (1.4, 2.6, 3.8, 5.0):
            overlay.add(Circle(radius=r, stroke_width=1.0, color=pal["acc"][0]).move_to(ORIGIN))
        overlay.set_opacity(0.10)
    else:
        # Diagonal hatch
        d = -fw
        while d <= fw + fh:
            overlay.add(Line([d - fh, -fh / 2, 0], [d, fh / 2, 0], stroke_width=0.6, color=grid_c))
            d += 1.1
        overlay.set_opacity(0.32)

    return VGroup(strips, overlay)


def fit(group, w=SAFE_W, h=SAFE_H, center=None):
    """Scale a group down to fit a bounded box, then position it."""
    if group.width > w:
        group.scale_to_fit_width(w)
    if group.height > h:
        group.scale_to_fit_height(h)
    if center is not None:
        group.move_to(center)
    return group


def kicker(text, color):
    return Text(str(text).upper(), font_size=20, color=color, weight=BOLD)


def headline(text, color):
    return Text(str(text), font_size=40, color=color, weight=BOLD)


def caption(text, color):
    return Text(str(text), font_size=26, color=color)


def accent_rule(color, width=3.4):
    return Line(LEFT * width / 2, RIGHT * width / 2, stroke_width=4, color=color)


def studio_axes(pal, x_range, y_range, x_label="x", y_label="y"):
    axes = Axes(
        x_range=x_range, y_range=y_range,
        x_length=9.0, y_length=4.6,
        axis_config={"color": pal["muted"], "stroke_width": 2.2},
        tips=True,
    )
    xl = axes.get_x_axis_label(Text(str(x_label), font_size=24, color=pal["muted"]))
    yl = axes.get_y_axis_label(Text(str(y_label), font_size=24, color=pal["muted"]))
    return axes, VGroup(xl, yl)


def chip(label, color, ink, w=2.8, h=1.2):
    """A rounded, glowing node used in flow diagrams."""
    box = RoundedRectangle(
        width=w, height=h, corner_radius=0.22,
        stroke_color=color, stroke_width=2.5, fill_color=color, fill_opacity=0.15,
    )
    txt = Text(str(label), font_size=23, color=ink, weight=BOLD)
    if txt.width > w - 0.4:
        txt.scale_to_fit_width(w - 0.4)
    txt.move_to(box.get_center())
    return VGroup(box, txt)


def stat_card(value, label, color, ink, muted):
    """A bold value over a small label — used in card grids."""
    card = RoundedRectangle(width=3.0, height=2.0, corner_radius=0.18,
                            stroke_color=color, stroke_width=2, fill_color=color, fill_opacity=0.10)
    val = Text(str(value), font_size=30, color=color, weight=BOLD)
    lab = Text(str(label), font_size=20, color=ink)
    if lab.width > 2.6:
        lab.scale_to_fit_width(2.6)
    inner = VGroup(val, lab).arrange(DOWN, buff=0.18).move_to(card.get_center())
    return VGroup(card, inner)


def code_panel(pal, lines):
    """A dark IDE-style panel. ``lines`` is a list of (text, color) tuples."""
    panel = RoundedRectangle(
        width=10.8, height=5.0, corner_radius=0.18,
        stroke_color=pal["surf"], stroke_width=1.5, fill_color=pal["deep"], fill_opacity=0.97,
    )
    dots = VGroup(*[Dot(radius=0.08, color=c) for c in (pal["acc"][3], pal["acc"][0], pal["acc"][2])])
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
    """Shared base. Look is driven by per-scene class attributes:
    PAL_INDEX (palette), BG_STYLE (backdrop), INTRO (title motion)."""

    PAL_INDEX = 0
    BG_STYLE = 0
    INTRO = 0

    def setup(self):
        self.pal = PALETTES[int(self.PAL_INDEX) % len(PALETTES)]
        self.camera.background_color = self.pal["bg"]
        self.studio_bg = make_backdrop(self.pal, self.BG_STYLE)
        self.add(self.studio_bg)

    def acc(self, i):
        return self.pal["acc"][int(i) % len(self.pal["acc"])]

    def title_block(self, kicker_text, title_text):
        p = self.pal
        k = kicker(kicker_text, self.acc(0))
        h = headline(title_text, p["ink"])
        if h.width > 12.5:
            h.scale_to_fit_width(12.5)
        rule = accent_rule(self.acc(1))
        grp = VGroup(k, h, rule).arrange(DOWN, buff=0.2).to_edge(UP, buff=0.5)
        intro = int(self.INTRO) % 3
        if intro == 0:
            self.play(LaggedStart(FadeIn(k, shift=DOWN * 0.2), Write(h), GrowFromCenter(rule),
                                  lag_ratio=0.45, run_time=1.9))
        elif intro == 1:
            self.play(LaggedStart(FadeIn(k, scale=0.6), FadeIn(h, shift=UP * 0.3), Create(rule),
                                  lag_ratio=0.4, run_time=1.8))
        else:
            self.play(FadeIn(grp, shift=DOWN * 0.25, run_time=1.4))
        return grp

    def lower_third(self, text, color=None):
        c = color or self.acc(2)
        t = caption(text, c)
        if t.width > 12.6:
            t.scale_to_fit_width(12.6)
        t.to_edge(DOWN, buff=0.32)
        self.play(FadeIn(t, shift=UP * 0.2), run_time=1.2)
        return t

    def outro(self, focus=None, hold=1.2):
        if focus is not None:
            self.play(Indicate(focus, color=self.acc(1), scale_factor=1.06), run_time=0.9)
        self.wait(hold)
        if self.mobjects:
            self.play(FadeOut(*self.mobjects), run_time=0.6)
'''
