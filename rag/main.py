"""ArchiGram.ai RAG Service - FastAPI Application."""

import time
from contextlib import asynccontextmanager
from typing import Any, AsyncGenerator

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from config import Settings, get_settings
from middleware import RequestIDMiddleware, setup_logging
from middleware.logging import get_logger

# Initialize settings and logging
settings = get_settings()
setup_logging(log_level=settings.log_level, json_logs=True)
logger = get_logger(__name__)

# Rate limiter
limiter = Limiter(key_func=get_remote_address)


# Application state for lazy-loaded resources
class AppState:
    """Application state container for shared resources."""

    embedding_provider: Any = None
    vector_store: Any = None
    is_ready: bool = False


app_state = AppState()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan manager for startup and shutdown."""
    logger.info("starting_rag_service", settings=settings.model_dump(exclude={"ingest_api_key", "gemini_api_key"}))

    # Lazy initialization - resources are loaded on first request
    # This allows the service to start quickly and report healthy
    # while heavy resources (embedding model) load in background

    yield

    # Shutdown
    logger.info("shutting_down_rag_service")
    app_state.is_ready = False


# Create FastAPI application
app = FastAPI(
    title="ArchiGram.ai RAG Service",
    description="Enterprise knowledge base for AI-powered diagram generation",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# Add rate limit error handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Add middlewares
app.add_middleware(RequestIDMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next: Any) -> Response:
    """Log all requests with timing information."""
    start_time = time.perf_counter()

    response = await call_next(request)

    duration_ms = (time.perf_counter() - start_time) * 1000
    logger.info(
        "http_request",
        method=request.method,
        path=request.url.path,
        status_code=response.status_code,
        duration_ms=round(duration_ms, 2),
    )

    return response


# ======================
# Health Check Endpoints
# ======================


@app.get("/health", tags=["Health"])
async def health_check() -> dict[str, str]:
    """Liveness probe - check if the service is running.

    This endpoint returns 200 as long as the process is up.
    Use for Kubernetes/Docker liveness probes.
    """
    return {"status": "healthy"}


@app.get("/health/ready", tags=["Health"])
async def readiness_check() -> dict[str, Any]:
    """Readiness probe - check if the service is ready to accept requests.

    This endpoint checks:
    - Embedding model is loaded (or can be loaded)
    - Qdrant connection is available

    Use for Kubernetes/Docker readiness probes.
    """
    from embeddings import get_embedding_provider
    from search.store import get_vector_store

    checks: dict[str, bool] = {}
    all_ready = True

    # Check embedding provider
    try:
        provider = get_embedding_provider()
        # Test with a simple embedding (this will lazy-load the model)
        _ = await provider.embed_query("test")
        checks["embeddings"] = True
    except Exception as e:
        logger.error("readiness_check_embeddings_failed", error=str(e))
        checks["embeddings"] = False
        all_ready = False

    # Check Qdrant connection
    try:
        store = get_vector_store()
        await store.health_check()
        checks["qdrant"] = True
    except Exception as e:
        logger.error("readiness_check_qdrant_failed", error=str(e))
        checks["qdrant"] = False
        all_ready = False

    app_state.is_ready = all_ready

    return {
        "status": "ready" if all_ready else "not_ready",
        "checks": checks,
    }


# ======================
# Include Routers
# ======================

from ingest.routes import router as ingest_router
from search.routes import router as search_router

app.include_router(ingest_router, prefix="/api/v1/rag", tags=["Ingest"])
app.include_router(search_router, prefix="/api/v1/rag", tags=["Search"])


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level=settings.log_level.lower(),
    )
