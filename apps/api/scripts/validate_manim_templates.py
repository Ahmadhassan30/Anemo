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
VARIANTS = _mt.VARIANTS
DEFAULT_PARAMS = _mt.DEFAULT_PARAMS
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


def _safe_params(vtype: str, cls: str) -> dict:
    d = dict(DEFAULT_PARAMS[vtype])
    d.update(class_name=cls, kicker="K", title="T", hold=1.2, pal_index=0, bg_style=0, intro=0)
    if vtype == "graph_animation":
        xr, yr = d["x_range"], d["y_range"]
        d.update(x_min=xr[0], x_max=xr[1], y_min=yr[0], y_max=yr[1])
    return d


def main() -> int:
    failures = []
    cls = "ConceptAbc12345Scene"
    n = 0

    # 1. Every variant string must compile on its own (guarantees full coverage).
    for vtype, variants in VARIANTS.items():
        safe = _safe_params(vtype, cls)
        for i, variant in enumerate(variants):
            try:
                compile(variant.format(**safe), f"<variant:{vtype}:{i}>", "exec")
                n += 1
            except (SyntaxError, KeyError, IndexError, ValueError) as exc:
                failures.append(f"{vtype} variant#{i}: {type(exc).__name__}: {exc}")
        print(f"  OK  {vtype:18s}  ({len(variants)} variant(s))")

    # 2. Fuzz render_template across seeds (variant×palette×backdrop×intro) and
    #    adversarial params — the full assembly + sanitation path.
    for vtype in VARIANTS:
        for seed in range(0, 40):
            for params in (None, ADVERSARIAL[vtype]):
                code = render_template(vtype, params, cls, 'Tricky "Title"\n2', 12.0 + seed, seed=str(seed))
                n += 1
                try:
                    compile(code, f"<render:{vtype}:{seed}>", "exec")
                except SyntaxError as exc:
                    failures.append(f"{vtype} seed={seed} SYNTAX: {exc}")
                    continue
                if f"class {cls}(StudioScene)" not in code:
                    failures.append(f"{vtype} seed={seed}: class definition missing")
                if "exec('evil')" in code:
                    failures.append(f"{vtype} seed={seed}: unsafe shape_code leaked through")

    if failures:
        print("\nFAILURES:")
        for f in failures[:40]:
            print("  ✗", f)
        return 1
    print(f"\nAll {n} generated scenes compiled cleanly (variants + seeded fuzz).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
