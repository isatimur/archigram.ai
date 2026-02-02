"""Embedding providers for vector generation."""

from functools import lru_cache

from config import get_settings

from .base import EmbeddingProvider
from .local import LocalEmbeddingProvider


@lru_cache
def get_embedding_provider() -> EmbeddingProvider:
    """Get the configured embedding provider (cached singleton).

    Returns:
        EmbeddingProvider instance based on configuration
    """
    settings = get_settings()

    if settings.use_cloud_embeddings:
        from .cloud import CloudEmbeddingProvider
        return CloudEmbeddingProvider()

    return LocalEmbeddingProvider()


__all__ = ["EmbeddingProvider", "get_embedding_provider"]
