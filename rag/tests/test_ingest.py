"""Tests for the ingest module."""

import io
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from ingest.parser import ParserError, parse_document, parse_markdown, parse_pdf, parse_text
from ingest.validation import (
    ValidationError,
    validate_content,
    validate_doc_type,
    validate_file_extension,
    validate_file_size,
)


class TestValidation:
    """Tests for file validation."""

    def test_validate_extension_pdf(self) -> None:
        """PDF extension should be valid."""
        ext = validate_file_extension("document.pdf")
        assert ext == "pdf"

    def test_validate_extension_md(self) -> None:
        """Markdown extension should be valid."""
        ext = validate_file_extension("README.md")
        assert ext == "md"

    def test_validate_extension_txt(self) -> None:
        """Text extension should be valid."""
        ext = validate_file_extension("notes.txt")
        assert ext == "txt"

    def test_validate_extension_uppercase(self) -> None:
        """Extension validation should be case-insensitive."""
        ext = validate_file_extension("document.PDF")
        assert ext == "pdf"

    def test_validate_extension_invalid(self) -> None:
        """Invalid extension should raise ValidationError."""
        with pytest.raises(ValidationError, match="not allowed"):
            validate_file_extension("script.exe")

    def test_validate_extension_no_extension(self) -> None:
        """File without extension should raise ValidationError."""
        with pytest.raises(ValidationError, match="must have an extension"):
            validate_file_extension("README")

    def test_validate_extension_empty_filename(self) -> None:
        """Empty filename should raise ValidationError."""
        with pytest.raises(ValidationError, match="required"):
            validate_file_extension("")

    def test_validate_file_size_valid(self) -> None:
        """Valid file size should pass."""
        validate_file_size(1024 * 1024)  # 1MB

    def test_validate_file_size_empty(self) -> None:
        """Empty file should raise ValidationError."""
        with pytest.raises(ValidationError, match="empty"):
            validate_file_size(0)

    def test_validate_file_size_too_large(self) -> None:
        """File exceeding max size should raise ValidationError."""
        with pytest.raises(ValidationError, match="exceeds maximum"):
            validate_file_size(100 * 1024 * 1024)  # 100MB

    def test_validate_content_text(self) -> None:
        """Valid text content should pass."""
        content = b"This is valid text content."
        text = validate_content(content, "txt")
        assert text == "This is valid text content."

    def test_validate_content_pdf_header(self) -> None:
        """PDF should have valid header."""
        with pytest.raises(ValidationError, match="PDF header"):
            validate_content(b"Not a PDF", "pdf")

    def test_validate_content_binary(self) -> None:
        """Binary content in text file should raise ValidationError."""
        content = b"Text with\x00null bytes"
        with pytest.raises(ValidationError, match="binary"):
            validate_content(content, "txt")

    def test_validate_doc_type_valid(self) -> None:
        """Valid doc types should pass."""
        assert validate_doc_type("glossary") == "glossary"
        assert validate_doc_type("architecture_guide") == "architecture_guide"
        assert validate_doc_type("tech_stack") == "tech_stack"
        assert validate_doc_type("general") == "general"

    def test_validate_doc_type_case_insensitive(self) -> None:
        """Doc type validation should be case-insensitive."""
        assert validate_doc_type("GLOSSARY") == "glossary"
        assert validate_doc_type("General") == "general"

    def test_validate_doc_type_empty(self) -> None:
        """Empty doc type should default to general."""
        assert validate_doc_type("") == "general"

    def test_validate_doc_type_invalid(self) -> None:
        """Invalid doc type should raise ValidationError."""
        with pytest.raises(ValidationError, match="Invalid doc_type"):
            validate_doc_type("unknown_type")


class TestParsers:
    """Tests for document parsers."""

    def test_parse_markdown(self, sample_markdown_content: str) -> None:
        """Markdown parsing should work."""
        result = parse_markdown(sample_markdown_content)
        assert "Architecture Guide" in result
        assert "Frontend: React" in result

    def test_parse_markdown_strips_frontmatter(self) -> None:
        """Markdown parser should strip YAML frontmatter."""
        content = """---
title: Test
author: Test Author
---

# Actual Content

This is the real content.
"""
        result = parse_markdown(content)
        assert "title:" not in result
        assert "Actual Content" in result

    def test_parse_text(self, sample_text_content: str) -> None:
        """Text parsing should work."""
        result = parse_text(sample_text_content)
        assert "Company Glossary" in result
        assert "API:" in result

    def test_parse_text_normalizes_newlines(self) -> None:
        """Text parser should normalize line endings."""
        content = "Line 1\r\nLine 2\rLine 3\n\n\n\nLine 4"
        result = parse_text(content)
        assert "\r" not in result
        # Should reduce excessive blank lines
        assert "\n\n\n" not in result

    def test_parse_document_md(self, sample_markdown_content: str) -> None:
        """parse_document should handle markdown."""
        result = parse_document(
            sample_markdown_content.encode(),
            "test.md",
            "md",
        )
        assert "Architecture Guide" in result

    def test_parse_document_txt(self, sample_text_content: str) -> None:
        """parse_document should handle text."""
        result = parse_document(
            sample_text_content.encode(),
            "test.txt",
            "txt",
        )
        assert "Company Glossary" in result

    def test_parse_document_unsupported(self) -> None:
        """parse_document should raise for unsupported types."""
        with pytest.raises(ParserError, match="Unsupported"):
            parse_document(b"content", "file.xyz", "xyz")


class TestIngestAPI:
    """Tests for the ingest API endpoint."""

    def test_ingest_requires_auth(
        self,
        test_client: TestClient,
    ) -> None:
        """Ingest endpoint should require API key."""
        response = test_client.post(
            "/api/v1/rag/ingest",
            files={"file": ("test.txt", b"content", "text/plain")},
            data={"doc_type": "general"},
        )
        assert response.status_code == 401

    def test_ingest_invalid_api_key(
        self,
        test_client: TestClient,
    ) -> None:
        """Ingest endpoint should reject invalid API key."""
        response = test_client.post(
            "/api/v1/rag/ingest",
            files={"file": ("test.txt", b"content", "text/plain")},
            data={"doc_type": "general"},
            headers={"X-API-Key": "wrong-key"},
        )
        assert response.status_code == 401

    def test_ingest_success(
        self,
        test_client: TestClient,
        mock_embedding_provider: AsyncMock,
        mock_vector_store: AsyncMock,
    ) -> None:
        """Successful ingest should return 200."""
        response = test_client.post(
            "/api/v1/rag/ingest",
            files={"file": ("test.txt", b"Test document content for ingestion.", "text/plain")},
            data={"doc_type": "general"},
            headers={"X-API-Key": "test-api-key"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "doc_id" in data
        assert data["chunks_count"] >= 1

    def test_ingest_invalid_file_type(
        self,
        test_client: TestClient,
    ) -> None:
        """Ingest should reject invalid file types."""
        response = test_client.post(
            "/api/v1/rag/ingest",
            files={"file": ("script.exe", b"binary content", "application/octet-stream")},
            data={"doc_type": "general"},
            headers={"X-API-Key": "test-api-key"},
        )
        assert response.status_code == 400
        assert "not allowed" in response.json()["detail"]

    def test_ingest_empty_file(
        self,
        test_client: TestClient,
    ) -> None:
        """Ingest should reject empty files."""
        response = test_client.post(
            "/api/v1/rag/ingest",
            files={"file": ("empty.txt", b"", "text/plain")},
            data={"doc_type": "general"},
            headers={"X-API-Key": "test-api-key"},
        )
        assert response.status_code == 400

    def test_ingest_with_company_id(
        self,
        test_client: TestClient,
        mock_embedding_provider: AsyncMock,
        mock_vector_store: AsyncMock,
    ) -> None:
        """Ingest should accept company_id parameter."""
        response = test_client.post(
            "/api/v1/rag/ingest",
            files={"file": ("test.txt", b"Company specific content.", "text/plain")},
            data={"doc_type": "glossary", "company_id": "company-123"},
            headers={"X-API-Key": "test-api-key"},
        )
        assert response.status_code == 200
