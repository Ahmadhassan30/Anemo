"""Retry helpers with exponential backoff."""
from typing import Callable


async def with_backoff(task: Callable[[], None], attempts: int = 3) -> None:
    # TODO: implement exponential backoff and retry
    pass
