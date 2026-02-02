"""Pytest fixtures and configuration for RAG tests."""

import os
from typing import AsyncGenerator, Generator
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient
from httpx import ASGITransport, AsyncClient

# Set test environment variables before importing app
os.environ["RAG_INGEST_API_KEY"] = "test-api-key"
os.environ["RAG_QDRANT_URL"] = "http://localhost:6333"
os.environ["RAG_LOG_LEVEL"] = "DEBUG"


@pytest.fixture(scope="session")
def anyio_backend() -> str:
    """Use asyncio for async tests."""
    return "asyncio"


@pytest.fixture
def mock_settings() -> Generator[MagicMock, None, None]:
    """Mock settings for tests."""
    from config import Settings

    settings = Settings(
        ingest_api_key="test-api-key",
        qdrant_url="http://localhost:6333",
        use_cloud_embeddings=False,
        log_level="DEBUG",
    )

    with patch("config.get_settings", return_value=settings):
        yield settings


@pytest.fixture
def mock_embedding_provider() -> Generator[AsyncMock, None, None]:
    """Mock embedding provider for tests."""
    mock = AsyncMock()
    mock.dimension = 384
    mock.embed_query = AsyncMock(return_value=[0.1] * 384)
    mock.embed_passage = AsyncMock(return_value=[0.1] * 384)
    mock.embed_passages = AsyncMock(return_value=[[0.1] * 384])

    # Patch at all import locations where the function is used
    with patch("embeddings.get_embedding_provider", return_value=mock):
        with patch("ingest.routes.get_embedding_provider", return_value=mock):
            with patch("search.routes.get_embedding_provider", return_value=mock):
                yield mock


@pytest.fixture
def mock_vector_store() -> Generator[AsyncMock, None, None]:
    """Mock vector store for tests."""
    mock = AsyncMock()
    mock.health_check = AsyncMock(return_value=True)
    mock.upsert_chunks = AsyncMock()
    mock.search = AsyncMock(
        return_value=[
            {
                "text": "Test chunk",
                "source": "test.md",
                "doc_type": "general",
                "score": 0.9,
                "company_id": None,
            }
        ]
    )

    # Patch at all import locations where the function is used
    with patch("search.store.get_vector_store", return_value=mock):
        with patch("search.routes.get_vector_store", return_value=mock):
            with patch("ingest.routes.get_vector_store", return_value=mock):
                yield mock


@pytest.fixture
def test_client(
    mock_settings: MagicMock,
    mock_embedding_provider: AsyncMock,
    mock_vector_store: AsyncMock,
) -> Generator[TestClient, None, None]:
    """Create a test client with mocked dependencies."""
    from main import app

    with TestClient(app) as client:
        yield client


@pytest.fixture
async def async_client(
    mock_settings: MagicMock,
    mock_embedding_provider: AsyncMock,
    mock_vector_store: AsyncMock,
) -> AsyncGenerator[AsyncClient, None]:
    """Create an async test client with mocked dependencies."""
    from main import app

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        yield client


@pytest.fixture
def sample_pdf_content() -> bytes:
    """Generate sample PDF content for testing."""
    # Minimal valid PDF
    return b"""%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 44 >>
stream
BT /F1 12 Tf 100 700 Td (Test content) Tj ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000204 00000 n
trailer
<< /Size 5 /Root 1 0 R >>
startxref
298
%%EOF"""


@pytest.fixture
def sample_markdown_content() -> str:
    """Sample markdown content for testing."""
    return """# Architecture Guide

## Overview

This is a test architecture document.

## Components

- Frontend: React application
- Backend: FastAPI service
- Database: PostgreSQL

## Data Flow

Data flows from frontend to backend via REST API.
"""


@pytest.fixture
def sample_text_content() -> str:
    """Sample text content for testing."""
    return """Company Glossary

API: Application Programming Interface
RAG: Retrieval-Augmented Generation
LLM: Large Language Model
"""
