"""LLM service — Groq for all LLM calls."""
import asyncio
import json
import logging

from openai import AsyncOpenAI
from config import settings

logger = logging.getLogger(__name__)

_groq_client = AsyncOpenAI(
    api_key=settings.GROQ_API_KEY,
    base_url="https://api.groq.com/openai/v1",
)


class LLMError(Exception):
    pass


DEFAULT_MODELS = [
    "openai/gpt-oss-20b",
    "qwen/qwen3-32b",
    "meta-llama/llama-4-scout-17b-16e-instruct",
    "openai/gpt-oss-120b",
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
]


class LLMService:

    async def chat(
        self,
        system: str,
        user: str,
        model: str = None,
        temperature: float = 0.2,
        max_tokens: int = 4096,
    ) -> str:
        # Prepare list of models to try in sequence
        models_to_try = []
        if model and model != "mistral-saba-24b":
            models_to_try.append(model)
        for m in DEFAULT_MODELS:
            if m not in models_to_try:
                models_to_try.append(m)

        last_error = None
        for current_model in models_to_try:
            for attempt in range(3):
                try:
                    logger.info(f"Attempting chat with model: {current_model} (attempt {attempt + 1})")
                    response = await _groq_client.chat.completions.create(
                        model=current_model,
                        temperature=temperature,
                        max_tokens=max_tokens,
                        messages=[
                            {"role": "system", "content": system},
                            {"role": "user", "content": user},
                        ],
                    )
                    return response.choices[0].message.content
                except Exception as e:
                    err_msg = str(e).lower()
                    last_error = e
                    
                    # If decommissioned or bad request, don't bother retrying this model
                    if "decommissioned" in err_msg or "not found" in err_msg or "400" in err_msg:
                        logger.warning(f"Model {current_model} is decommissioned or unavailable. Error: {e}. Trying next model.")
                        break
                    
                    # If rate limit, wait or fall back
                    if "rate_limit" in err_msg or "429" in err_msg:
                        wait = 2 ** attempt
                        logger.warning(
                            f"Groq rate limit for {current_model}, waiting {wait}s "
                            f"(attempt {attempt + 1}/3). Error: {e}"
                        )
                        await asyncio.sleep(wait)
                        continue
                    
                    logger.warning(f"Error calling {current_model}: {e}. Retrying...")
                    await asyncio.sleep(0.5)
            
            logger.warning(f"Model {current_model} failed all attempts. Trying next model.")

        raise LLMError(f"All models failed. Last error: {last_error}")

    async def chat_json(
        self,
        system: str,
        user: str,
        **kwargs,
    ) -> dict:
        result = await self.chat(
            system,
            user + (
                "\n\nReturn ONLY valid JSON. "
                "No markdown fences. No explanation."
            ),
            **kwargs,
        )
        clean = (
            result.strip()
            .removeprefix("```json")
            .removeprefix("```")
            .removesuffix("```")
            .strip()
        )
        return json.loads(clean)


llm_service = LLMService()
