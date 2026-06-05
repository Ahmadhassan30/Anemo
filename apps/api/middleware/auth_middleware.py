"""JWT bearer authentication middleware."""
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class AuthMiddleware(BaseHTTPMiddleware):
    """Verify JWT tokens on protected routes."""

    async def dispatch(self, request: Request, call_next) -> Response:
        # TODO: implement JWT verification and user context
        return await call_next(request)
