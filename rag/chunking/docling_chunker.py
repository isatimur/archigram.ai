"""Adapter between Docling's chunker and the RAG Chunk dataclass.

Uses Docling's HybridChunker for layout-aware chunking with exact token
counting, then wraps results into the standard Chunk dataclass used by
the embedding and storage layers.
"""

from __future__ import annotations

from typing import Any

from middleware.logging import get_logger

from .splitter import Chunk
from .strategies import get_chunking_strategy

logger = get_logger(__name__)


def is_docling_available() -> bool:
    """Check whether docling chunking dependencies are importable."""
    try:
        from docling_core.transforms.chunker import HybridChunker  # noqa: F401

        return True
    except ImportError:
        return False


def chunk_docling_document(
    doc: Any,
    source: str,
    doc_type: str,
    company_id: str | None = None,
    metadata: dict[str, Any] | None = None,
    tokenizer_model: str = "intfloat/e5-small-v2",
) -> list[Chunk]:
    """Chunk a DoclingDocument using Docling's HybridChunker.

    Args:
        doc: A DoclingDocument instance from docling parsing
        source: Source document identifier (filename)
        doc_type: Document type for strategy selection
        company_id: Optional company ID for multi-tenant isolation
        metadata: Optional additional metadata
        tokenizer_model: HuggingFace model name for token counting

    Returns:
        List of standard Chunk objects

    Raises:
        ImportError: If docling-core is not installed
    """
    from docling_core.transforms.chunker import HybridChunker

    strategy = get_chunking_strategy(doc_type)

    chunker = HybridChunker(
        tokenizer=tokenizer_model,
        max_tokens=strategy.chunk_size,
    )

    logger.info(
        "docling_chunking_start",
        source=source,
        doc_type=doc_type,
        max_tokens=strategy.chunk_size,
        overlap=strategy.chunk_overlap,
    )

    raw_chunks = list(chunker.chunk(doc))

    chunks: list[Chunk] = []
    base_metadata = dict(metadata) if metadata else {}
    base_metadata["chunker"] = "docling_hybrid"

    chunk_index = 0
    for raw_chunk in raw_chunks:
        # Extract text — HybridChunker chunks have a .text property
        text = raw_chunk.text if hasattr(raw_chunk, "text") else str(raw_chunk)

        if not text or not text.strip():
            continue

        chunk_meta = dict(base_metadata)

        # Extract heading context if available
        if hasattr(raw_chunk, "meta") and raw_chunk.meta:
            headings = raw_chunk.meta.headings if hasattr(raw_chunk.meta, "headings") else []
            if headings:
                chunk_meta["headings"] = headings

        chunks.append(
            Chunk(
                text=text,
                index=chunk_index,
                source=source,
                doc_type=doc_type,
                company_id=company_id,
                metadata=chunk_meta,
            )
        )
        chunk_index += 1

    logger.info(
        "docling_chunking_complete",
        source=source,
        chunks_count=len(chunks),
    )

    return chunks
