"""Request and response logging middleware."""
from time import perf_counter
import logging

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger("lectureos.api")
logger.setLevel(logging.INFO)


class LoggingMiddleware(BaseHTTPMiddleware):
    """Log incoming requests and outgoing responses."""

    async def dispatch(self, request: Request, call_next) -> Response:
        if request.url.path in ("/health", "/api/v1/health"):
            return await call_next(request)

        start_time = perf_counter()
        status_code = 500
        try:
            response = await call_next(request)
            status_code = response.status_code
            return response
        finally:
            process_time_ms = (perf_counter() - start_time) * 1000
            logger.info(
                "%s %s %s %.2fms",
                request.method,
                request.url.path,
                status_code,
                process_time_ms,
            )
