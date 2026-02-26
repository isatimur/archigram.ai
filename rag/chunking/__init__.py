"""Chunking module for document splitting."""

from .splitter import Chunk, RecursiveSplitter
from .strategies import ChunkingStrategy, chunk_document, get_chunking_strategy

__all__ = [
    "Chunk",
    "ChunkingStrategy",
    "RecursiveSplitter",
    "chunk_document",
    "get_chunking_strategy",
]

try:
    from .docling_chunker import chunk_docling_document, is_docling_available

    __all__ += ["chunk_docling_document", "is_docling_available"]
except ImportError:
    pass
