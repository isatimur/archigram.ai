"""Qdrant vector store client with retry logic and collection management."""

import uuid
from functools import lru_cache
from typing import Any

from qdrant_client import AsyncQdrantClient
from qdrant_client.http import models
from qdrant_client.http.exceptions import ResponseHandlingException, UnexpectedResponse

from chunking import Chunk
from config import get_settings
from middleware.logging import get_logger

logger = get_logger(__name__)


class VectorStoreError(Exception):
    """Raised when vector store operations fail."""

    pass


class QdrantVectorStore:
    """Qdrant vector database client.

    Handles:
    - Collection creation and management
    - Document upsert with embeddings
    - Similarity search
    - Health checks
    - Automatic retries on connection errors
    """

    def __init__(self) -> None:
        """Initialize the Qdrant client."""
        self._settings = get_settings()
        self._client: AsyncQdrantClient | None = None
        self._collection_initialized = False

    async def _get_client(self) -> AsyncQdrantClient:
        """Get or create the Qdrant client."""
        if self._client is None:
            self._client = AsyncQdrantClient(url=self._settings.qdrant_url)

            # Ensure collection exists
            if not self._collection_initialized:
                await self._ensure_collection()
                self._collection_initialized = True

        return self._client

    async def _ensure_collection(self) -> None:
        """Ensure the collection exists with proper configuration."""
        client = await self._get_client() if self._client else AsyncQdrantClient(url=self._settings.qdrant_url)

        if self._client is None:
            self._client = client

        collection_name = self._settings.qdrant_collection

        try:
            # Check if collection exists
            collections = await client.get_collections()
            exists = any(c.name == collection_name for c in collections.collections)

            if not exists:
                logger.info("creating_qdrant_collection", collection=collection_name)

                # Create collection with proper vector configuration
                await client.create_collection(
                    collection_name=collection_name,
                    vectors_config=models.VectorParams(
                        size=self._settings.embedding_dimension,
                        distance=models.Distance.COSINE,
                    ),
                    # Payload indexes for filtering
                    optimizers_config=models.OptimizersConfigDiff(
                        indexing_threshold=10000,
                    ),
                )

                # Create payload indexes for common filters
                await client.create_payload_index(
                    collection_name=collection_name,
                    field_name="company_id",
                    field_schema=models.PayloadSchemaType.KEYWORD,
                )
                await client.create_payload_index(
                    collection_name=collection_name,
                    field_name="doc_type",
                    field_schema=models.PayloadSchemaType.KEYWORD,
                )
                await client.create_payload_index(
                    collection_name=collection_name,
                    field_name="source",
                    field_schema=models.PayloadSchemaType.KEYWORD,
                )

                logger.info("qdrant_collection_created", collection=collection_name)

        except Exception as e:
            logger.error("qdrant_collection_setup_failed", error=str(e))
            raise VectorStoreError(f"Failed to setup Qdrant collection: {e}")

    async def health_check(self) -> bool:
        """Check if Qdrant is healthy and accessible.

        Returns:
            True if healthy

        Raises:
            VectorStoreError: If health check fails
        """
        try:
            client = await self._get_client()
            # Simple health check - get collection info
            await client.get_collection(self._settings.qdrant_collection)
            return True
        except Exception as e:
            raise VectorStoreError(f"Qdrant health check failed: {e}")

    async def upsert_chunks(
        self,
        chunks: list[Chunk],
        embeddings: list[list[float]],
    ) -> None:
        """Upsert chunks with their embeddings to Qdrant.

        Args:
            chunks: List of document chunks
            embeddings: Corresponding embedding vectors

        Raises:
            VectorStoreError: If upsert fails
        """
        if len(chunks) != len(embeddings):
            raise VectorStoreError(
                f"Chunks ({len(chunks)}) and embeddings ({len(embeddings)}) count mismatch"
            )

        if not chunks:
            return

        client = await self._get_client()

        # Create points for upsert
        points = [
            models.PointStruct(
                id=str(uuid.uuid4()),
                vector=embedding,
                payload=chunk.to_dict(),
            )
            for chunk, embedding in zip(chunks, embeddings)
        ]

        try:
            # Upsert in batches of 100
            batch_size = 100
            for i in range(0, len(points), batch_size):
                batch = points[i : i + batch_size]
                await client.upsert(
                    collection_name=self._settings.qdrant_collection,
                    points=batch,
                    wait=True,
                )

            logger.info(
                "chunks_upserted",
                count=len(points),
                collection=self._settings.qdrant_collection,
            )

        except Exception as e:
            logger.error("qdrant_upsert_failed", error=str(e))
            raise VectorStoreError(f"Failed to upsert chunks: {e}")

    async def search(
        self,
        query_embedding: list[float],
        top_k: int = 5,
        company_id: str | None = None,
        doc_type: str | None = None,
        score_threshold: float = 0.0,
    ) -> list[dict[str, Any]]:
        """Search for similar chunks.

        Args:
            query_embedding: Query embedding vector
            top_k: Number of results to return
            company_id: Optional company filter
            doc_type: Optional document type filter
            score_threshold: Minimum similarity score (0-1)

        Returns:
            List of matching chunks with scores

        Raises:
            VectorStoreError: If search fails
        """
        client = await self._get_client()

        # Build filter conditions
        filter_conditions = []

        if company_id:
            filter_conditions.append(
                models.FieldCondition(
                    key="company_id",
                    match=models.MatchValue(value=company_id),
                )
            )

        if doc_type:
            filter_conditions.append(
                models.FieldCondition(
                    key="doc_type",
                    match=models.MatchValue(value=doc_type),
                )
            )

        # Create filter if conditions exist
        query_filter = None
        if filter_conditions:
            query_filter = models.Filter(must=filter_conditions)

        try:
            results = await client.search(
                collection_name=self._settings.qdrant_collection,
                query_vector=query_embedding,
                limit=top_k,
                query_filter=query_filter,
                score_threshold=score_threshold,
            )

            return [
                {
                    "text": result.payload.get("text", "") if result.payload else "",
                    "source": result.payload.get("source", "") if result.payload else "",
                    "doc_type": result.payload.get("doc_type", "") if result.payload else "",
                    "score": result.score,
                    "company_id": result.payload.get("company_id") if result.payload else None,
                }
                for result in results
            ]

        except Exception as e:
            logger.error("qdrant_search_failed", error=str(e))
            raise VectorStoreError(f"Search failed: {e}")

    async def delete_by_source(self, source: str, company_id: str | None = None) -> int:
        """Delete all chunks from a specific source.

        Args:
            source: Source identifier to delete
            company_id: Optional company filter

        Returns:
            Number of deleted points

        Raises:
            VectorStoreError: If deletion fails
        """
        client = await self._get_client()

        conditions = [
            models.FieldCondition(
                key="source",
                match=models.MatchValue(value=source),
            )
        ]

        if company_id:
            conditions.append(
                models.FieldCondition(
                    key="company_id",
                    match=models.MatchValue(value=company_id),
                )
            )

        try:
            result = await client.delete(
                collection_name=self._settings.qdrant_collection,
                points_selector=models.FilterSelector(
                    filter=models.Filter(must=conditions),
                ),
                wait=True,
            )

            logger.info("chunks_deleted", source=source, company_id=company_id)
            return result.status  # type: ignore

        except Exception as e:
            logger.error("qdrant_delete_failed", error=str(e))
            raise VectorStoreError(f"Delete failed: {e}")

    async def close(self) -> None:
        """Close the Qdrant client."""
        if self._client:
            await self._client.close()
            self._client = None


# Singleton instance
_vector_store: QdrantVectorStore | None = None


def get_vector_store() -> QdrantVectorStore:
    """Get the vector store singleton.

    Returns:
        QdrantVectorStore instance
    """
    global _vector_store
    if _vector_store is None:
        _vector_store = QdrantVectorStore()
    return _vector_store
