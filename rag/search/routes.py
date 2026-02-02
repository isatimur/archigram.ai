"""Search API routes for RAG retrieval."""

import asyncio
from typing import Any

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from slowapi import Limiter
from slowapi.util import get_remote_address

from config import get_settings
from embeddings import get_embedding_provider
from middleware.logging import get_logger

from .store import VectorStoreError, get_vector_store

logger = get_logger(__name__)
router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


class SearchRequest(BaseModel):
    """Request model for search endpoint."""

    query: str = Field(
        ...,
        min_length=1,
        max_length=1000,
        description="Search query text",
    )
    top_k: int = Field(
        default=5,
        ge=1,
        le=20,
        description="Number of results to return",
    )
    company_id: str | None = Field(
        default=None,
        description="Optional company ID for filtering",
    )
    doc_type: str | None = Field(
        default=None,
        description="Optional document type filter",
    )
    score_threshold: float = Field(
        default=0.5,
        ge=0.0,
        le=1.0,
        description="Minimum similarity score threshold",
    )


class SearchChunk(BaseModel):
    """A single search result chunk."""

    text: str
    source: str
    score: float
    doc_type: str = ""


class SearchResponse(BaseModel):
    """Response model for search endpoint."""

    chunks: list[SearchChunk]
    query: str


class SearchError(BaseModel):
    """Error response model."""

    detail: str


@router.post(
    "/search",
    response_model=SearchResponse,
    responses={
        400: {"model": SearchError, "description": "Invalid request"},
        429: {"model": SearchError, "description": "Rate limit exceeded"},
        503: {"model": SearchError, "description": "Service unavailable"},
    },
    summary="Search the knowledge base",
    description="""
Search for relevant document chunks based on a query.

Returns chunks ordered by similarity score.

**Graceful degradation:** If the RAG service is unavailable or times out,
the frontend should fall back to non-RAG diagram generation.
""",
)
@limiter.limit("60/minute")
async def search(request: Request, search_request: SearchRequest) -> SearchResponse:
    """Search for relevant chunks in the knowledge base.

    The search process:
    1. Embed the query using the configured embedding provider
    2. Search Qdrant for similar chunks
    3. Return results with similarity scores

    Returns 503 if the service is unavailable (allows frontend fallback).
    """
    settings = get_settings()
    timeout_sec = settings.search_timeout_sec

    logger.info(
        "search_started",
        query=search_request.query[:100],  # Log first 100 chars
        top_k=search_request.top_k,
        company_id=search_request.company_id,
    )

    try:
        # Get embedding provider
        embedding_provider = get_embedding_provider()

        # Embed query with timeout
        try:
            query_embedding = await asyncio.wait_for(
                embedding_provider.embed_query(search_request.query),
                timeout=timeout_sec,
            )
        except asyncio.TimeoutError:
            logger.error("search_embedding_timeout", timeout=timeout_sec)
            raise HTTPException(
                status_code=503,
                detail="Embedding service timed out",
            )

        # Search vector store with timeout
        vector_store = get_vector_store()

        try:
            results = await asyncio.wait_for(
                vector_store.search(
                    query_embedding=query_embedding,
                    top_k=search_request.top_k,
                    company_id=search_request.company_id,
                    doc_type=search_request.doc_type,
                    score_threshold=search_request.score_threshold,
                ),
                timeout=timeout_sec,
            )
        except asyncio.TimeoutError:
            logger.error("search_qdrant_timeout", timeout=timeout_sec)
            raise HTTPException(
                status_code=503,
                detail="Vector search timed out",
            )

        # Format response
        chunks = [
            SearchChunk(
                text=r["text"],
                source=r["source"],
                score=r["score"],
                doc_type=r.get("doc_type", ""),
            )
            for r in results
        ]

        logger.info(
            "search_completed",
            results_count=len(chunks),
            top_score=chunks[0].score if chunks else 0,
        )

        return SearchResponse(
            chunks=chunks,
            query=search_request.query,
        )

    except VectorStoreError as e:
        logger.error("search_vector_store_error", error=str(e))
        raise HTTPException(
            status_code=503,
            detail="Knowledge base unavailable",
        )

    except HTTPException:
        # Re-raise HTTP exceptions
        raise

    except Exception as e:
        logger.error("search_unexpected_error", error=str(e))
        raise HTTPException(
            status_code=503,
            detail="Search service unavailable",
        )


@router.get(
    "/stats",
    summary="Get knowledge base statistics",
    description="Returns statistics about the knowledge base.",
)
async def get_stats() -> dict[str, Any]:
    """Get statistics about the knowledge base."""
    try:
        vector_store = get_vector_store()
        client = await vector_store._get_client()
        settings = get_settings()

        collection_info = await client.get_collection(settings.qdrant_collection)

        return {
            "collection": settings.qdrant_collection,
            "vectors_count": collection_info.vectors_count,
            "points_count": collection_info.points_count,
            "status": collection_info.status.value,
        }

    except Exception as e:
        logger.error("stats_error", error=str(e))
        raise HTTPException(
            status_code=503,
            detail="Could not retrieve statistics",
        )
