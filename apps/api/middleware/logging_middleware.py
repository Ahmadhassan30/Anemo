"""Request and response logging middleware."""
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class LoggingMiddleware(BaseHTTPMiddleware):
    """Log incoming requests and outgoing responses."""

    async def dispatch(self, request: Request, call_next) -> Response:
        # TODO: implement structured logging
        return await call_next(request)
