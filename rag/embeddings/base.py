"""Abstract base class for embedding providers."""

from abc import ABC, abstractmethod


class EmbeddingProvider(ABC):
    """Abstract interface for embedding providers.

    All embedding providers must implement this interface to ensure
    consistent behavior across local and cloud implementations.
    """

    @property
    @abstractmethod
    def dimension(self) -> int:
        """Return the embedding dimension.

        Returns:
            Integer dimension of the embedding vectors
        """
        ...

    @abstractmethod
    async def embed_query(self, text: str) -> list[float]:
        """Embed a search query.

        For models like E5 that require different prefixes for queries
        and passages, this method should add the "query: " prefix.

        Args:
            text: Query text to embed

        Returns:
            Embedding vector as list of floats
        """
        ...

    @abstractmethod
    async def embed_passage(self, text: str) -> list[float]:
        """Embed a document passage.

        For models like E5 that require different prefixes for queries
        and passages, this method should add the "passage: " prefix.

        Args:
            text: Passage text to embed

        Returns:
            Embedding vector as list of floats
        """
        ...

    @abstractmethod
    async def embed_passages(self, texts: list[str]) -> list[list[float]]:
        """Embed multiple document passages in batch.

        More efficient than calling embed_passage repeatedly.

        Args:
            texts: List of passage texts to embed

        Returns:
            List of embedding vectors
        """
        ...
