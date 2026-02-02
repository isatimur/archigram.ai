"""Cloud embedding provider using Google Gemini API.

This provider is optional and only used when RAG_USE_CLOUD_EMBEDDINGS=true.
Note: Query text is sent to Google's API when using cloud embeddings.
"""

import asyncio

import httpx

from config import get_settings
from middleware.logging import get_logger

from .base import EmbeddingProvider

logger = get_logger(__name__)


class CloudEmbeddingProvider(EmbeddingProvider):
    """Cloud embedding provider using Google Gemini API.

    Uses the Gemini embedding API for generating embeddings.
    This requires a valid GEMINI_API_KEY in the configuration.
    """

    # Gemini embedding model and dimension
    MODEL_NAME = "text-embedding-004"
    EMBEDDING_DIMENSION = 768

    # API configuration
    BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
    TIMEOUT = 30.0

    def __init__(self) -> None:
        """Initialize the cloud embedding provider."""
        self._settings = get_settings()

        if not self._settings.gemini_api_key:
            raise ValueError(
                "GEMINI_API_KEY is required when USE_CLOUD_EMBEDDINGS=true"
            )

        self._api_key = self._settings.gemini_api_key
        self._client: httpx.AsyncClient | None = None

    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create the HTTP client."""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                base_url=self.BASE_URL,
                timeout=self.TIMEOUT,
            )
        return self._client

    @property
    def dimension(self) -> int:
        """Return the embedding dimension."""
        return self.EMBEDDING_DIMENSION

    async def _embed_text(
        self,
        text: str,
        task_type: str = "RETRIEVAL_DOCUMENT",
    ) -> list[float]:
        """Embed text using Gemini API.

        Args:
            text: Text to embed
            task_type: Task type for embedding optimization
                - RETRIEVAL_QUERY: For search queries
                - RETRIEVAL_DOCUMENT: For document passages

        Returns:
            Embedding vector as list of floats
        """
        client = await self._get_client()

        url = f"/models/{self.MODEL_NAME}:embedContent"
        params = {"key": self._api_key}

        payload = {
            "model": f"models/{self.MODEL_NAME}",
            "content": {"parts": [{"text": text}]},
            "taskType": task_type,
        }

        try:
            response = await client.post(url, params=params, json=payload)
            response.raise_for_status()

            data = response.json()
            return data["embedding"]["values"]

        except httpx.HTTPStatusError as e:
            logger.error(
                "gemini_embedding_error",
                status_code=e.response.status_code,
                error=str(e),
            )
            raise
        except Exception as e:
            logger.error("gemini_embedding_error", error=str(e))
            raise

    async def _embed_texts_batch(
        self,
        texts: list[str],
        task_type: str = "RETRIEVAL_DOCUMENT",
    ) -> list[list[float]]:
        """Embed multiple texts using Gemini API batch endpoint.

        Args:
            texts: List of texts to embed
            task_type: Task type for embedding optimization

        Returns:
            List of embedding vectors
        """
        client = await self._get_client()

        url = f"/models/{self.MODEL_NAME}:batchEmbedContents"
        params = {"key": self._api_key}

        requests = [
            {
                "model": f"models/{self.MODEL_NAME}",
                "content": {"parts": [{"text": text}]},
                "taskType": task_type,
            }
            for text in texts
        ]

        payload = {"requests": requests}

        try:
            response = await client.post(url, params=params, json=payload)
            response.raise_for_status()

            data = response.json()
            return [emb["values"] for emb in data["embeddings"]]

        except httpx.HTTPStatusError as e:
            logger.error(
                "gemini_batch_embedding_error",
                status_code=e.response.status_code,
                error=str(e),
            )
            raise
        except Exception as e:
            logger.error("gemini_batch_embedding_error", error=str(e))
            raise

    async def embed_query(self, text: str) -> list[float]:
        """Embed a search query.

        Uses RETRIEVAL_QUERY task type for optimal query embedding.

        Args:
            text: Query text to embed

        Returns:
            Embedding vector as list of floats
        """
        return await self._embed_text(text, task_type="RETRIEVAL_QUERY")

    async def embed_passage(self, text: str) -> list[float]:
        """Embed a document passage.

        Uses RETRIEVAL_DOCUMENT task type for optimal document embedding.

        Args:
            text: Passage text to embed

        Returns:
            Embedding vector as list of floats
        """
        return await self._embed_text(text, task_type="RETRIEVAL_DOCUMENT")

    async def embed_passages(self, texts: list[str]) -> list[list[float]]:
        """Embed multiple passages in batch.

        Uses batch API for efficiency.

        Args:
            texts: List of passage texts to embed

        Returns:
            List of embedding vectors
        """
        if not texts:
            return []

        # Gemini batch API has a limit of 100 texts per request
        batch_size = 100
        all_embeddings: list[list[float]] = []

        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]
            embeddings = await self._embed_texts_batch(
                batch,
                task_type="RETRIEVAL_DOCUMENT",
            )
            all_embeddings.extend(embeddings)

        return all_embeddings

    async def close(self) -> None:
        """Close the HTTP client."""
        if self._client and not self._client.is_closed:
            await self._client.aclose()
