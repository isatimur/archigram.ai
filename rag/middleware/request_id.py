"""Request ID middleware for request tracing."""

import uuid
from contextvars import ContextVar
from typing import Callable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

# Context variable for request ID propagation
request_id_ctx: ContextVar[str | None] = ContextVar("request_id", default=None)


def get_request_id() -> str | None:
    """Get the current request ID from context."""
    return request_id_ctx.get()


class RequestIDMiddleware(BaseHTTPMiddleware):
    """Middleware to generate and propagate request IDs."""

    HEADER_NAME = "X-Request-ID"

    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Response],
    ) -> Response:
        """Generate or use existing request ID and add to response."""
        # Get existing request ID or generate new one
        request_id = request.headers.get(self.HEADER_NAME) or str(uuid.uuid4())

        # Set in context for logging
        token = request_id_ctx.set(request_id)

        try:
            # Store in request state for access in routes
            request.state.request_id = request_id

            # Process request
            response = await call_next(request)

            # Add request ID to response headers
            response.headers[self.HEADER_NAME] = request_id

            return response
        finally:
            # Reset context
            request_id_ctx.reset(token)
