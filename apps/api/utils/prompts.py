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
"""
