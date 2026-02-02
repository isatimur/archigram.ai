"""Local embedding provider using E5-small-v2 via sentence-transformers.

E5 models require specific prefixes for queries and passages:
- "query: " for search queries
- "passage: " for document passages

This ensures optimal retrieval performance as the model was trained
with these prefixes.
"""

import asyncio
from functools import lru_cache
from pathlib import Path
from typing import Any

from config import get_settings
from middleware.logging import get_logger

from .base import EmbeddingProvider

logger = get_logger(__name__)


@lru_cache(maxsize=1)
def _load_model(model_name: str, cache_dir: str | None = None) -> Any:
    """Load the sentence-transformers model (cached singleton).

    Args:
        model_name: HuggingFace model name
        cache_dir: Optional cache directory for model files

    Returns:
        SentenceTransformer model instance
    """
    from sentence_transformers import SentenceTransformer

    logger.info("loading_embedding_model", model=model_name)

    # Use cache directory if specified
    model = SentenceTransformer(
        model_name,
        cache_folder=cache_dir,
        device="cpu",  # Use CPU for portability; GPU can be enabled via env
    )

    logger.info(
        "embedding_model_loaded",
        model=model_name,
        dimension=model.get_sentence_embedding_dimension(),
    )

    return model


class LocalEmbeddingProvider(EmbeddingProvider):
    """Local embedding provider using E5-small-v2.

    Uses sentence-transformers to run the model locally.
    The model is lazy-loaded on first use and cached.
    """

    # E5 model prefixes (required for optimal performance)
    QUERY_PREFIX = "query: "
    PASSAGE_PREFIX = "passage: "

    def __init__(self) -> None:
        """Initialize the local embedding provider."""
        self._settings = get_settings()
        self._model: Any = None
        self._dimension = self._settings.embedding_dimension

    def _get_model(self) -> Any:
        """Get the model instance (lazy loading)."""
        if self._model is None:
            # Determine cache directory
            cache_dir = str(Path(__file__).parent.parent / "models")
            self._model = _load_model(self._settings.embedding_model, cache_dir)
            self._dimension = self._model.get_sentence_embedding_dimension()
        return self._model

    @property
    def dimension(self) -> int:
        """Return the embedding dimension."""
        return self._dimension

    async def embed_query(self, text: str) -> list[float]:
        """Embed a search query with E5 prefix.

        Args:
            text: Query text to embed

        Returns:
            Embedding vector as list of floats
        """
        # Add query prefix for E5 models
        prefixed_text = f"{self.QUERY_PREFIX}{text}"

        # Run synchronous model in thread pool
        loop = asyncio.get_event_loop()
        embedding = await loop.run_in_executor(
            None,
            lambda: self._get_model().encode(prefixed_text, normalize_embeddings=True),
        )

        return embedding.tolist()

    async def embed_passage(self, text: str) -> list[float]:
        """Embed a document passage with E5 prefix.

        Args:
            text: Passage text to embed

        Returns:
            Embedding vector as list of floats
        """
        # Add passage prefix for E5 models
        prefixed_text = f"{self.PASSAGE_PREFIX}{text}"

        # Run synchronous model in thread pool
        loop = asyncio.get_event_loop()
        embedding = await loop.run_in_executor(
            None,
            lambda: self._get_model().encode(prefixed_text, normalize_embeddings=True),
        )

        return embedding.tolist()

    async def embed_passages(self, texts: list[str]) -> list[list[float]]:
        """Embed multiple passages in batch.

        More efficient than embedding one at a time.

        Args:
            texts: List of passage texts to embed

        Returns:
            List of embedding vectors
        """
        if not texts:
            return []

        # Add passage prefix to all texts
        prefixed_texts = [f"{self.PASSAGE_PREFIX}{text}" for text in texts]

        # Run batch embedding in thread pool
        loop = asyncio.get_event_loop()
        embeddings = await loop.run_in_executor(
            None,
            lambda: self._get_model().encode(
                prefixed_texts,
                normalize_embeddings=True,
                batch_size=32,
                show_progress_bar=False,
            ),
        )

        return embeddings.tolist()
