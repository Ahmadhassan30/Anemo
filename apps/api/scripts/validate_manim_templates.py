"""Offline validation of generated Manim scenes.

Compiles the source produced by ``render_template`` for every visual type —
with clean defaults AND with adversarial params (quotes, LaTeX braces, junk
numerics) — to guarantee the codegen layer never emits invalid Python. Runs
without ``manim`` installed (PREAMBLE/templates are plain strings).

Usage (from apps/api):
    PYTHONPATH=. python3 scripts/validate_manim_templates.py
"""
import importlib.util
import os
import sys
import types


def _load_templates():
    """Load manim_studio + manim_templates directly, bypassing services/__init__.

    services/__init__.py pulls in sqlalchemy and other heavy deps; the codegen
    string layer needs none of them, so we load the two modules by file path
    under a stub 'services' package.
    """
    api_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    stub = types.ModuleType("services")
    stub.__path__ = [os.path.join(api_dir, "services")]
    sys.modules.setdefault("services", stub)

    def _load(name):
        spec = importlib.util.spec_from_file_location(
            f"services.{name}", os.path.join(api_dir, "services", f"{name}.py")
        )
        mod = importlib.util.module_from_spec(spec)
        sys.modules[f"services.{name}"] = mod
        spec.loader.exec_module(mod)
        return mod

    _load("manim_studio")
    return _load("manim_templates")


_mt = _load_templates()
TEMPLATES = _mt.TEMPLATES
render_template = _mt.render_template

ADVERSARIAL = {
    "graph_animation": {
        "x_label": 'velocity "v"', "y_label": "energy",
        "x_range": "bad", "y_range": [0, 10],  # invalid → must fall back
        "formula": "x**2 - 2*x", "highlight_x": "1.5", "formula_at_point": "n/a",
        "point_label": 'peak "max"', "explanation": 'It "spikes" here\nsharply',
    },
    "equation_display": {
        "equation_main": r"\frac{dy}{dx} = 2x",
        "equation_step1": r"\int x^2 \, dx = \frac{x^3}{3}",
        "equation_step2": 'broken " quote', "explanation": "line\nbreak",
    },
    "diagram_flow": {
        "step1": 'a "b"', "step2": "c\nd", "step3": "e", "step4": "f",
        "description": "flows through stages",
    },
    "text_bullets": {
        "bullet1": 'has "quotes"', "bullet2": "back\\slash", "bullet3": "x" * 200,
        "bullet4": "ok", "summary": "done",
    },
    "code_walkthrough": {
        "line1": 'print("hi")', "line2": "x = 1", "line3": "y = 2",
        "line4": "z = 3", "line5": "return z", "highlight_line": "99",
        "annotation": 'the "key" line',
    },
    "geometric_proof": {
        "shape_code": "exec('evil')", "shape_label": 'tri "angle"',
        "key_formula": r"A = \frac{1}{2} b h", "proof_step": "half base times height",
    },
}


def main() -> int:
    failures = []
    cls = "ConceptAbc12345Scene"
    for vtype in TEMPLATES:
        for tag, params, dur in (
            ("defaults", None, 12.0),
            ("adversarial", ADVERSARIAL[vtype], 55.0),
        ):
            code = render_template(vtype, params, cls, 'Tricky "Title"\n2', dur)
            try:
                compile(code, f"<{vtype}:{tag}>", "exec")
            except SyntaxError as exc:
                failures.append(f"{vtype} [{tag}] SYNTAX: {exc}")
                continue
            if f"class {cls}(StudioScene)" not in code:
                failures.append(f"{vtype} [{tag}]: class definition missing")
            if "exec(" in code.split("class ")[0] or "exec('evil')" in code:
                failures.append(f"{vtype} [{tag}]: unsafe shape_code leaked through")
            print(f"  OK  {vtype:18s} [{tag}]  ({len(code)} chars)")

    if failures:
        print("\nFAILURES:")
        for f in failures:
            print("  ✗", f)
        return 1
    print(f"\nAll {len(TEMPLATES) * 2} scene variants compiled cleanly.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
