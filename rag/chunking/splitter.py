"""Recursive text splitter for document chunking.

This is a custom implementation without LangChain/LlamaIndex dependencies.
Splits text recursively using multiple separators to create semantically
meaningful chunks while respecting size limits.
"""

from dataclasses import dataclass
from typing import Literal


@dataclass
class Chunk:
    """A text chunk with metadata."""

    text: str
    index: int
    source: str
    doc_type: str
    company_id: str | None = None
    metadata: dict | None = None

    def to_dict(self) -> dict:
        """Convert chunk to dictionary for storage."""
        return {
            "text": self.text,
            "index": self.index,
            "source": self.source,
            "doc_type": self.doc_type,
            "company_id": self.company_id,
            **(self.metadata or {}),
        }


class RecursiveSplitter:
    """Recursive text splitter that tries separators in order.

    The splitter attempts to split on the first separator. If resulting
    chunks are still too large, it recursively splits using the next
    separator in the list.

    Default separators (in order):
    1. Double newline (paragraph break)
    2. Single newline
    3. Period followed by space (sentence end)
    4. Space (word boundary)
    5. Empty string (character level - last resort)
    """

    # Default separators in order of preference
    DEFAULT_SEPARATORS = ["\n\n", "\n", ". ", " ", ""]

    def __init__(
        self,
        chunk_size: int = 500,
        chunk_overlap: int = 50,
        separators: list[str] | None = None,
        length_function: Literal["chars", "tokens"] = "tokens",
    ):
        """Initialize the splitter.

        Args:
            chunk_size: Target chunk size (in tokens or chars based on length_function)
            chunk_overlap: Overlap between consecutive chunks
            separators: Custom list of separators (uses defaults if None)
            length_function: How to measure length - "tokens" (estimated) or "chars"
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.separators = separators or self.DEFAULT_SEPARATORS
        self.length_function = length_function

    def _length(self, text: str) -> int:
        """Calculate the length of text based on configured function.

        For tokens, uses a simple heuristic of ~4 chars per token.
        This is faster than using a tokenizer and accurate enough for chunking.
        """
        if self.length_function == "chars":
            return len(text)
        # Estimate tokens: ~4 characters per token (English approximation)
        return len(text) // 4

    def _split_text(self, text: str, separators: list[str]) -> list[str]:
        """Split text using the first separator that produces splits.

        If resulting chunks are too large, recursively split with next separator.

        Args:
            text: Text to split
            separators: List of separators to try in order

        Returns:
            List of text chunks
        """
        if not separators:
            # No more separators - split by character
            return self._split_by_size(text)

        separator = separators[0]
        remaining_separators = separators[1:]

        # Try splitting with current separator
        if separator:
            splits = text.split(separator)
        else:
            # Empty separator means character-level split
            splits = list(text)

        # Merge small splits and handle large ones
        chunks: list[str] = []
        current_chunk: list[str] = []
        current_length = 0

        for split in splits:
            split_length = self._length(split)

            # If single split is too large, recursively split it
            if split_length > self.chunk_size:
                # First, flush current chunk if any
                if current_chunk:
                    chunk_text = self._join_with_separator(current_chunk, separator)
                    chunks.append(chunk_text)
                    current_chunk = []
                    current_length = 0

                # Recursively split the large piece
                sub_chunks = self._split_text(split, remaining_separators)
                chunks.extend(sub_chunks)
                continue

            # Check if adding this split would exceed chunk size
            potential_length = current_length + split_length
            if current_chunk:
                potential_length += self._length(separator)

            if potential_length > self.chunk_size and current_chunk:
                # Flush current chunk
                chunk_text = self._join_with_separator(current_chunk, separator)
                chunks.append(chunk_text)

                # Start new chunk with overlap
                overlap_text = self._get_overlap(current_chunk, separator)
                if overlap_text:
                    current_chunk = [overlap_text, split]
                    current_length = self._length(overlap_text) + self._length(separator) + split_length
                else:
                    current_chunk = [split]
                    current_length = split_length
            else:
                current_chunk.append(split)
                current_length = potential_length

        # Don't forget the last chunk
        if current_chunk:
            chunk_text = self._join_with_separator(current_chunk, separator)
            chunks.append(chunk_text)

        return chunks

    def _join_with_separator(self, parts: list[str], separator: str) -> str:
        """Join parts with separator, handling empty separator."""
        if separator:
            return separator.join(parts)
        return "".join(parts)

    def _get_overlap(self, chunks: list[str], separator: str) -> str:
        """Get overlap text from the end of chunks.

        Returns text from the end that fits within chunk_overlap size.
        """
        if not self.chunk_overlap or not chunks:
            return ""

        # Build overlap from the end
        overlap_parts: list[str] = []
        overlap_length = 0

        for chunk in reversed(chunks):
            chunk_len = self._length(chunk)
            if overlap_length + chunk_len <= self.chunk_overlap:
                overlap_parts.insert(0, chunk)
                overlap_length += chunk_len
                if separator:
                    overlap_length += self._length(separator)
            else:
                break

        return self._join_with_separator(overlap_parts, separator)

    def _split_by_size(self, text: str) -> list[str]:
        """Split text into fixed-size chunks (last resort)."""
        chunks = []
        if self.length_function == "chars":
            # Direct character split
            for i in range(0, len(text), self.chunk_size - self.chunk_overlap):
                chunk = text[i : i + self.chunk_size]
                if chunk:
                    chunks.append(chunk)
        else:
            # Token-estimated split (4 chars per token)
            char_size = self.chunk_size * 4
            char_overlap = self.chunk_overlap * 4
            for i in range(0, len(text), char_size - char_overlap):
                chunk = text[i : i + char_size]
                if chunk:
                    chunks.append(chunk)
        return chunks

    def split_text(self, text: str) -> list[str]:
        """Split text into chunks.

        Args:
            text: Text to split

        Returns:
            List of text chunks
        """
        # Clean up text
        text = text.strip()
        if not text:
            return []

        # If text is already small enough, return as single chunk
        if self._length(text) <= self.chunk_size:
            return [text]

        return self._split_text(text, self.separators)

    def create_chunks(
        self,
        text: str,
        source: str,
        doc_type: str,
        company_id: str | None = None,
        metadata: dict | None = None,
    ) -> list[Chunk]:
        """Split text and create Chunk objects with metadata.

        Args:
            text: Text to split
            source: Source document identifier
            doc_type: Document type (glossary, architecture_guide, etc.)
            company_id: Optional company ID for multi-tenant
            metadata: Optional additional metadata

        Returns:
            List of Chunk objects
        """
        texts = self.split_text(text)
        return [
            Chunk(
                text=t,
                index=i,
                source=source,
                doc_type=doc_type,
                company_id=company_id,
                metadata=metadata,
            )
            for i, t in enumerate(texts)
        ]
