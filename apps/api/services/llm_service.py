"""LLM service wrapping the DeepSeek-V3 API via OpenAI compatibility layer."""
import json
import logging
from typing import Any, Dict, Optional

from openai import AsyncOpenAI
from config import settings

logger = logging.getLogger(__name__)


class LLMError(Exception):
    """Raised when the LLM API fails or returns invalid structured output."""
    pass


class LLMService:
    """Provides a unified async interface to DeepSeek-V3."""

    def __init__(self) -> None:
        self.client = AsyncOpenAI(
            api_key=settings.GROQ_API_KEY,
            base_url="https://api.groq.com/openai/v1"
        )

    async def chat(
        self,
        system: str,
        user: str,
        model: str = "llama-3.1-8b-instant",
        temperature: float = 0.2,
        max_tokens: int = 4096,
        response_format: Optional[Dict[str, str]] = None,
    ) -> str:
        """Call the LLM and return the raw string content.

        Enforces a 60-second timeout.
        """
        try:
            kwargs: Dict[str, Any] = {
                "model": model,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                "temperature": temperature,
                "max_tokens": max_tokens,
                "timeout": 60.0,
            }
            if response_format:
                kwargs["response_format"] = response_format

            logger.debug("Calling LLM API (model=%s, timeout=60s)", model)
            response = await self.client.chat.completions.create(**kwargs)
            
            content = response.choices[0].message.content
            if content is None:
                raise LLMError("LLM returned None content.")
                
            return content
        except Exception as e:
            logger.error("LLM API call failed: %s", e)
            raise LLMError(f"LLM API failure: {str(e)}") from e

    async def chat_json(
        self,
        system: str,
        user: str,
        model: str = "llama-3.1-8b-instant",
        temperature: float = 0.2,
        max_tokens: int = 4096,
    ) -> dict:
        """Call the LLM and parse the response as a JSON object.

        Raises:
            LLMError: If the API fails or the response cannot be parsed as JSON.
        """
        raw_text = await self.chat(
            system=system,
            user=user,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            response_format={"type": "json_object"},
        )
        
        try:
            return json.loads(raw_text)
        except json.JSONDecodeError as e:
            logger.error("Failed to parse LLM JSON response: %s\nRaw output: %s", e, raw_text)
            raise LLMError(f"Invalid JSON response: {str(e)}") from e


# Singleton
llm_service = LLMService()
