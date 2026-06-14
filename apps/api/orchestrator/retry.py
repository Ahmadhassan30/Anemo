"""Retry helpers with exponential backoff."""
import asyncio
import logging
from dataclasses import dataclass

logger = logging.getLogger(__name__)

# We define a local alias in case openai.AuthenticationError or similar
# isn't installed; fall back to a sentinel.
try:
    from openai import AuthenticationError  # noqa: F811
except ImportError:
    class AuthenticationError(Exception):  # type: ignore[no-redef]
        pass

# Exceptions that indicate programmer errors — never retry these.
_NON_RETRYABLE = (ValueError, TypeError, AuthenticationError)


@dataclass
class RetryPolicy:
    """Configurable retry policy with capped exponential backoff."""

    max_attempts: int
    base_delay: float = 2.0

    async def wait(self, attempt: int) -> None:
        """Sleep with exponential backoff, capped at 60 seconds."""
        delay = min(self.base_delay ** attempt, 60.0)
        logger.debug("Retry backoff: sleeping %.1fs (attempt %d)", delay, attempt)
        await asyncio.sleep(delay)

    def should_retry(self, attempt: int, error: Exception) -> bool:
        """Return True if the operation should be retried.

        Always returns False for non-transient programmer errors
        (ValueError, TypeError, AuthenticationError).
        """
        if isinstance(error, _NON_RETRYABLE):
            return False
        return attempt < self.max_attempts
