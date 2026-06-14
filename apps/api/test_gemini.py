import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

async def main():
    print("Testing Gemini integration...")
    
    # Test 1: config loads
    from config import settings
    assert settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "your_gemini_key_here", \
        "GEMINI_API_KEY is not set in .env"
    print(f"  ✓ GEMINI_API_KEY loaded ({settings.GEMINI_API_KEY[:8]}...)")
    
    # Test 2: SDK initializes
    import google.generativeai as genai
    genai.configure(api_key=settings.GEMINI_API_KEY)
    print("  ✓ Gemini SDK initialized")
    
    # Test 3: basic text response
    from services.llm_service import llm_service
    result = await llm_service.chat_strong(
        system="You are a helpful assistant.",
        user="Reply with exactly: GEMINI_WORKS"
    )
    assert "GEMINI_WORKS" in result, f"Unexpected response: {result}"
    print(f"  ✓ chat_strong() works: {result.strip()}")
    
    # Test 4: JSON response
    result_json = await llm_service.chat_json_strong(
        system="You are a JSON generator.",
        user='Return this exact JSON: {"status": "ok", "model": "gemini"}'
    )
    assert result_json.get("status") == "ok", f"Bad JSON: {result_json}"
    print(f"  ✓ chat_json_strong() works: {result_json}")
    
    # Test 5: Manim code generation (real test)
    from utils.prompts import MANIM_CODER_SYSTEM
    test_plan = """
    Animation plan: Show a simple sine wave being drawn on axes.
    Draw x and y axes, then animate a sine curve being traced from 
    left to right using a moving dot.
    """
    code = await llm_service.chat_strong(
        system=MANIM_CODER_SYSTEM.format(
            class_name="TestSineScene",
            duration=15
        ),
        user=test_plan
    )
    assert "class TestSineScene" in code, "Class name missing from generated code"
    assert "from manim import" in code, "Manim import missing"
    assert "self.play" in code, "No animations in generated code"
    print(f"  ✓ Manim code generation works ({len(code)} chars)")
    print()
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("  All Gemini tests passed!")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

if __name__ == "__main__":
    asyncio.run(main())
