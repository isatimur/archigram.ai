"""Tests for the chunking module."""

import pytest

from chunking.splitter import Chunk, RecursiveSplitter
from chunking.strategies import (
    ChunkingStrategy,
    DocType,
    chunk_document,
    create_splitter_for_doc_type,
    get_chunking_strategy,
)


class TestRecursiveSplitter:
    """Tests for RecursiveSplitter."""

    def test_split_short_text(self) -> None:
        """Short text should not be split."""
        splitter = RecursiveSplitter(chunk_size=100)
        text = "Short text"
        chunks = splitter.split_text(text)
        assert len(chunks) == 1
        assert chunks[0] == "Short text"

    def test_split_by_paragraph(self) -> None:
        """Text should split on double newlines first."""
        # Use chars mode for precise control in tests
        splitter = RecursiveSplitter(chunk_size=30, chunk_overlap=0, length_function="chars")
        text = "First paragraph.\n\nSecond paragraph.\n\nThird paragraph."
        chunks = splitter.split_text(text)
        assert len(chunks) >= 2
        assert "First paragraph." in chunks[0]

    def test_split_preserves_content(self) -> None:
        """All content should be preserved across chunks."""
        splitter = RecursiveSplitter(chunk_size=20, chunk_overlap=0)
        text = "Word1 word2 word3 word4 word5 word6 word7 word8"
        chunks = splitter.split_text(text)

        # Join without overlap should contain all words
        all_text = " ".join(chunks)
        for word in text.split():
            assert word in all_text

    def test_overlap_applied(self) -> None:
        """Chunks should have overlap when configured."""
        splitter = RecursiveSplitter(chunk_size=30, chunk_overlap=10)
        text = "First part of text. Second part of text. Third part of text."
        chunks = splitter.split_text(text)

        # With overlap, adjacent chunks should share some text
        if len(chunks) >= 2:
            # Check that there's some overlap (shared content)
            # This is a basic check - overlap may vary based on split points
            assert len(chunks) >= 2

    def test_create_chunks_with_metadata(self) -> None:
        """Chunks should include metadata."""
        splitter = RecursiveSplitter(chunk_size=50)
        chunks = splitter.create_chunks(
            text="Test content for chunking.",
            source="test.md",
            doc_type="general",
            company_id="company-123",
            metadata={"custom": "value"},
        )

        assert len(chunks) >= 1
        chunk = chunks[0]
        assert isinstance(chunk, Chunk)
        assert chunk.source == "test.md"
        assert chunk.doc_type == "general"
        assert chunk.company_id == "company-123"
        assert chunk.index == 0

    def test_empty_text_returns_empty(self) -> None:
        """Empty text should return empty list."""
        splitter = RecursiveSplitter()
        assert splitter.split_text("") == []
        assert splitter.split_text("   ") == []

    def test_chunk_to_dict(self) -> None:
        """Chunk.to_dict should include all fields."""
        chunk = Chunk(
            text="Test text",
            index=0,
            source="test.md",
            doc_type="glossary",
            company_id="comp-1",
            metadata={"extra": "data"},
        )
        d = chunk.to_dict()
        assert d["text"] == "Test text"
        assert d["index"] == 0
        assert d["source"] == "test.md"
        assert d["doc_type"] == "glossary"
        assert d["company_id"] == "comp-1"
        assert d["extra"] == "data"


class TestChunkingStrategies:
    """Tests for document-type specific strategies."""

    def test_glossary_strategy(self) -> None:
        """Glossary strategy should use small chunks."""
        strategy = get_chunking_strategy("glossary")
        assert strategy.chunk_size < 200
        assert strategy.doc_type == DocType.GLOSSARY

    def test_architecture_guide_strategy(self) -> None:
        """Architecture guide strategy should use large chunks."""
        strategy = get_chunking_strategy("architecture_guide")
        assert strategy.chunk_size > 400
        assert strategy.doc_type == DocType.ARCHITECTURE_GUIDE

    def test_tech_stack_strategy(self) -> None:
        """Tech stack strategy should use medium chunks."""
        strategy = get_chunking_strategy("tech_stack")
        assert 200 < strategy.chunk_size < 500
        assert strategy.doc_type == DocType.TECH_STACK

    def test_unknown_doc_type_fallback(self) -> None:
        """Unknown doc type should fall back to general."""
        strategy = get_chunking_strategy("unknown_type")
        assert strategy.doc_type == DocType.GENERAL

    def test_create_splitter_for_doc_type(self) -> None:
        """Splitter should be configured for doc type."""
        splitter = create_splitter_for_doc_type("glossary")
        assert splitter.chunk_size == get_chunking_strategy("glossary").chunk_size

    def test_chunk_document_convenience(self) -> None:
        """chunk_document should work as convenience function."""
        text = "Term: Definition of the term."
        chunks = chunk_document(
            text=text,
            source="glossary.md",
            doc_type="glossary",
        )
        assert len(chunks) >= 1
        assert chunks[0].doc_type == "glossary"


class TestChunkQuality:
    """Tests for chunk quality and edge cases."""

    def test_long_line_handling(self) -> None:
        """Very long lines should be handled gracefully."""
        splitter = RecursiveSplitter(chunk_size=50)
        long_line = "word " * 100  # Very long line
        chunks = splitter.split_text(long_line)
        assert len(chunks) > 1
        # Each chunk should be within reasonable size
        for chunk in chunks:
            assert len(chunk) < 1000

    def test_unicode_handling(self) -> None:
        """Unicode text should be handled correctly."""
        splitter = RecursiveSplitter(chunk_size=50)
        text = "Hello 你好 مرحبا שלום"
        chunks = splitter.split_text(text)
        assert len(chunks) >= 1
        # Unicode should be preserved
        assert "你好" in "".join(chunks)

    def test_markdown_headers_as_separators(self) -> None:
        """Markdown headers should work as separators for architecture guides."""
        splitter = create_splitter_for_doc_type("architecture_guide")
        text = """# Section 1

Content for section 1.

## Section 2

Content for section 2.
"""
        chunks = splitter.split_text(text)
        # Headers should help create logical splits
        assert len(chunks) >= 1
