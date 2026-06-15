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


class LLMService:

    async def chat(
        self,
        system: str,
        user: str,
        model: str = "mistral-saba-24b",
        temperature: float = 0.2,
        max_tokens: int = 4096,
    ) -> str:
        for attempt in range(5):
            try:
                response = await _groq_client.chat.completions.create(
                    model=model,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    messages=[
                        {"role": "system", "content": system},
                        {"role": "user", "content": user},
                    ],
                )
                return response.choices[0].message.content
            except Exception as e:
                if "rate_limit" in str(e).lower() or "429" in str(e):
                    wait = 2 ** attempt
                    logger.warning(
                        f"Groq rate limit, waiting {wait}s "
                        f"(attempt {attempt + 1})"
                    )
                    await asyncio.sleep(wait)
                    continue
                raise LLMError(str(e)) from e
        raise LLMError("Max retries exceeded")

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
