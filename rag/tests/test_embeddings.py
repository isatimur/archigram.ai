"""Tests for the embeddings module."""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from embeddings.base import EmbeddingProvider
from embeddings.local import LocalEmbeddingProvider


class TestEmbeddingProviderInterface:
    """Tests for the EmbeddingProvider interface."""

    def test_provider_is_abstract(self) -> None:
        """EmbeddingProvider should be abstract."""
        with pytest.raises(TypeError):
            EmbeddingProvider()  # type: ignore


class TestLocalEmbeddingProvider:
    """Tests for LocalEmbeddingProvider."""

    @pytest.fixture
    def mock_sentence_transformer(self) -> MagicMock:
        """Mock sentence-transformers model."""
        import numpy as np

        mock = MagicMock()
        mock.get_sentence_embedding_dimension.return_value = 384
        mock.encode.return_value = np.array([0.1] * 384)
        return mock

    @pytest.mark.asyncio
    async def test_embed_query_adds_prefix(
        self,
        mock_sentence_transformer: MagicMock,
    ) -> None:
        """embed_query should add 'query: ' prefix."""
        with patch(
            "embeddings.local._load_model",
            return_value=mock_sentence_transformer,
        ):
            provider = LocalEmbeddingProvider()
            await provider.embed_query("test query")

            # Check that encode was called with prefix
            call_args = mock_sentence_transformer.encode.call_args
            assert call_args[0][0].startswith("query: ")

    @pytest.mark.asyncio
    async def test_embed_passage_adds_prefix(
        self,
        mock_sentence_transformer: MagicMock,
    ) -> None:
        """embed_passage should add 'passage: ' prefix."""
        with patch(
            "embeddings.local._load_model",
            return_value=mock_sentence_transformer,
        ):
            provider = LocalEmbeddingProvider()
            await provider.embed_passage("test passage")

            call_args = mock_sentence_transformer.encode.call_args
            assert call_args[0][0].startswith("passage: ")

    @pytest.mark.asyncio
    async def test_embed_passages_batch(
        self,
        mock_sentence_transformer: MagicMock,
    ) -> None:
        """embed_passages should process multiple texts."""
        import numpy as np

        mock_sentence_transformer.encode.return_value = np.array([[0.1] * 384, [0.2] * 384])

        with patch(
            "embeddings.local._load_model",
            return_value=mock_sentence_transformer,
        ):
            provider = LocalEmbeddingProvider()
            results = await provider.embed_passages(["text1", "text2"])

            assert len(results) == 2

    @pytest.mark.asyncio
    async def test_embed_passages_empty_list(
        self,
        mock_sentence_transformer: MagicMock,
    ) -> None:
        """embed_passages with empty list should return empty."""
        with patch(
            "embeddings.local._load_model",
            return_value=mock_sentence_transformer,
        ):
            provider = LocalEmbeddingProvider()
            results = await provider.embed_passages([])

            assert results == []

    def test_dimension_property(self, mock_sentence_transformer: MagicMock) -> None:
        """dimension property should return correct value."""
        with patch(
            "embeddings.local._load_model",
            return_value=mock_sentence_transformer,
        ):
            provider = LocalEmbeddingProvider()
            # Force model load
            provider._get_model()
            assert provider.dimension == 384

    @pytest.mark.asyncio
    async def test_embedding_is_normalized(
        self,
        mock_sentence_transformer: MagicMock,
    ) -> None:
        """Embeddings should be normalized."""
        with patch(
            "embeddings.local._load_model",
            return_value=mock_sentence_transformer,
        ):
            provider = LocalEmbeddingProvider()
            await provider.embed_query("test")

            # Check normalize_embeddings=True was passed
            call_kwargs = mock_sentence_transformer.encode.call_args[1]
            assert call_kwargs.get("normalize_embeddings") is True

    @pytest.mark.asyncio
    async def test_embed_query_returns_list(
        self,
        mock_sentence_transformer: MagicMock,
    ) -> None:
        """embed_query should return a list of floats."""
        with patch(
            "embeddings.local._load_model",
            return_value=mock_sentence_transformer,
        ):
            provider = LocalEmbeddingProvider()
            result = await provider.embed_query("test")

            assert isinstance(result, list)
            assert len(result) == 384
            assert all(isinstance(x, float) for x in result)


class TestCloudEmbeddingProvider:
    """Tests for CloudEmbeddingProvider."""

    def test_cloud_provider_requires_api_key(self) -> None:
        """CloudEmbeddingProvider should require API key."""
        with patch("embeddings.cloud.get_settings") as mock_settings:
            mock_settings.return_value.gemini_api_key = None
            mock_settings.return_value.use_cloud_embeddings = True

            with pytest.raises(ValueError, match="GEMINI_API_KEY"):
                from embeddings.cloud import CloudEmbeddingProvider
                CloudEmbeddingProvider()

    def test_cloud_dimension(self) -> None:
        """CloudEmbeddingProvider should report correct dimension."""
        with patch("embeddings.cloud.get_settings") as mock_settings:
            mock_settings.return_value.gemini_api_key = "test-key"
            mock_settings.return_value.use_cloud_embeddings = True

            from embeddings.cloud import CloudEmbeddingProvider

            provider = CloudEmbeddingProvider()
            assert provider.dimension == 768  # Gemini text-embedding-004

    @pytest.mark.asyncio
    async def test_cloud_embed_query_uses_retrieval_query_task(self) -> None:
        """embed_query should use RETRIEVAL_QUERY task type."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"embedding": {"values": [0.1] * 768}}
        mock_response.raise_for_status = MagicMock()

        mock_client = AsyncMock()
        mock_client.post.return_value = mock_response
        mock_client.is_closed = False

        with patch("embeddings.cloud.get_settings") as mock_settings:
            mock_settings.return_value.gemini_api_key = "test-key"
            mock_settings.return_value.use_cloud_embeddings = True

            from embeddings.cloud import CloudEmbeddingProvider

            provider = CloudEmbeddingProvider()
            provider._client = mock_client

            await provider.embed_query("test query")

            # Check the request included RETRIEVAL_QUERY task type
            call_args = mock_client.post.call_args
            assert call_args[1]["json"]["taskType"] == "RETRIEVAL_QUERY"

    @pytest.mark.asyncio
    async def test_cloud_embed_passage_uses_retrieval_document_task(self) -> None:
        """embed_passage should use RETRIEVAL_DOCUMENT task type."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"embedding": {"values": [0.1] * 768}}
        mock_response.raise_for_status = MagicMock()

        mock_client = AsyncMock()
        mock_client.post.return_value = mock_response
        mock_client.is_closed = False

        with patch("embeddings.cloud.get_settings") as mock_settings:
            mock_settings.return_value.gemini_api_key = "test-key"
            mock_settings.return_value.use_cloud_embeddings = True

            from embeddings.cloud import CloudEmbeddingProvider

            provider = CloudEmbeddingProvider()
            provider._client = mock_client

            await provider.embed_passage("test passage")

            call_args = mock_client.post.call_args
            assert call_args[1]["json"]["taskType"] == "RETRIEVAL_DOCUMENT"


class TestEmbeddingProviderFactory:
    """Tests for get_embedding_provider factory."""

    def test_returns_local_by_default(self) -> None:
        """Factory should return local provider by default."""
        with patch("embeddings.get_settings") as mock_settings:
            mock_settings.return_value.use_cloud_embeddings = False
            mock_settings.return_value.embedding_model = "intfloat/e5-small-v2"
            mock_settings.return_value.embedding_dimension = 384

            from embeddings import get_embedding_provider
            get_embedding_provider.cache_clear()

            provider = get_embedding_provider()
            assert isinstance(provider, LocalEmbeddingProvider)

    def test_returns_cloud_when_configured(self) -> None:
        """Factory should return cloud provider when configured."""
        with patch("embeddings.get_settings") as mock_settings:
            mock_settings.return_value.use_cloud_embeddings = True
            mock_settings.return_value.gemini_api_key = "test-key"

            from embeddings import get_embedding_provider
            from embeddings.cloud import CloudEmbeddingProvider

            get_embedding_provider.cache_clear()

            # Also patch cloud module's get_settings
            with patch("embeddings.cloud.get_settings", mock_settings):
                provider = get_embedding_provider()
                assert isinstance(provider, CloudEmbeddingProvider)
