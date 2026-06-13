"""Service for executing Manim renders as subprocesses."""
import asyncio
import glob
import logging
from pathlib import Path

logger = logging.getLogger(__name__)


class ManimRenderError(Exception):
    """Raised when a Manim render subprocess fails."""
    pass


async def render_scene(
    manim_code: str,
    class_name: str,
    output_dir: str,
    concept_id: str,
) -> str:
    """Write Manim code to a file and render it, returning the output MP4 path.

    Args:
        manim_code: Full Python source code containing a Scene subclass.
        class_name: The exact Scene class name to render.
        output_dir: Root directory for Manim outputs.
        concept_id: Unique identifier used for the source file name.

    Returns:
        Absolute path to the rendered MP4 file.

    Raises:
        ManimRenderError: If the Manim subprocess exits with a non-zero code
            or the expected output MP4 cannot be found.
    """
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)

    # 1. Write manim code to a temp .py file
    scene_file = out / f"{concept_id}.py"
    scene_file.write_text(manim_code, encoding="utf-8")
    logger.debug("Wrote Manim source to %s", scene_file)

    # 2. Run Manim render (-ql = low quality for dev speed)
    cmd = [
        "manim",
        "render",
        "-ql",
        str(scene_file),
        class_name,
        "--media_dir",
        str(out),
    ]
    logger.info("Running Manim: %s", " ".join(cmd))

    process = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )

    # 3. Communicate with a 5-minute timeout
    try:
        stdout, stderr = await asyncio.wait_for(
            process.communicate(), timeout=300
        )
    except asyncio.TimeoutError:
        process.kill()
        raise ManimRenderError(
            f"Manim render timed out after 300 seconds for {class_name}"
        )

    # 4. Check return code
    if process.returncode != 0:
        stderr_text = stderr.decode(errors="replace")
        logger.error("Manim render failed:\n%s", stderr_text)
        raise ManimRenderError(stderr_text)

    logger.debug("Manim stdout:\n%s", stdout.decode(errors="replace"))

    # 5. Locate the output MP4
    #    Manim places output at:
    #      {media_dir}/videos/{source_stem}/{quality}/{ClassName}.mp4
    #    With -ql the quality folder is 480p15.
    expected = out / "videos" / concept_id / "480p15" / f"{class_name}.mp4"
    if expected.is_file():
        logger.info("Rendered MP4: %s", expected)
        return str(expected.resolve())

    # Fallback: search for any .mp4 with the class_name in the output tree
    pattern = str(out / "videos" / "**" / f"{class_name}.mp4")
    matches = glob.glob(pattern, recursive=True)
    if matches:
        found = matches[0]
        logger.info("Rendered MP4 (fallback search): %s", found)
        return str(Path(found).resolve())

    raise ManimRenderError(
        f"Render completed but could not find output MP4 for {class_name} "
        f"under {out / 'videos'}"
    )


class ManimService:
    """Thin façade kept for backwards-compat with services/__init__.py."""

    async def render_scene(
        self,
        manim_code: str,
        class_name: str,
        output_dir: str,
        concept_id: str,
    ) -> str:
        return await render_scene(manim_code, class_name, output_dir, concept_id)
