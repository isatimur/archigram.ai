"""Document-type specific chunking strategies.

Different document types benefit from different chunking parameters:
- Glossaries: Small chunks for precise term retrieval
- Architecture guides: Larger chunks for context preservation
- Tech stack docs: Medium chunks with section awareness
"""

from dataclasses import dataclass
from enum import Enum
from typing import Literal

from .splitter import Chunk, RecursiveSplitter


class DocType(str, Enum):
    """Supported document types for chunking."""

    GLOSSARY = "glossary"
    ARCHITECTURE_GUIDE = "architecture_guide"
    TECH_STACK = "tech_stack"
    GENERAL = "general"


@dataclass
class ChunkingStrategy:
    """Configuration for document-specific chunking."""

    doc_type: DocType
    chunk_size: int
    chunk_overlap: int
    separators: list[str]
    description: str


# Pre-defined strategies for different document types
STRATEGIES: dict[DocType, ChunkingStrategy] = {
    DocType.GLOSSARY: ChunkingStrategy(
        doc_type=DocType.GLOSSARY,
        chunk_size=100,  # Small chunks for precise term matching
        chunk_overlap=20,
        separators=["\n\n", "\n", ". ", " "],  # Entry-based splitting
        description="Small chunks for glossary terms and definitions",
    ),
    DocType.ARCHITECTURE_GUIDE: ChunkingStrategy(
        doc_type=DocType.ARCHITECTURE_GUIDE,
        chunk_size=600,  # Larger chunks for architectural context
        chunk_overlap=100,
        separators=["\n## ", "\n### ", "\n\n", "\n", ". ", " "],  # Section-aware
        description="Larger chunks preserving architectural context",
    ),
    DocType.TECH_STACK: ChunkingStrategy(
        doc_type=DocType.TECH_STACK,
        chunk_size=400,  # Medium chunks for tech descriptions
        chunk_overlap=50,
        separators=["\n## ", "\n### ", "\n- ", "\n\n", "\n", ". ", " "],
        description="Medium chunks for technology stack documentation",
    ),
    DocType.GENERAL: ChunkingStrategy(
        doc_type=DocType.GENERAL,
        chunk_size=500,  # Default balanced approach
        chunk_overlap=50,
        separators=["\n\n", "\n", ". ", " "],
        description="Balanced default strategy for general documents",
    ),
}


def get_chunking_strategy(doc_type: str) -> ChunkingStrategy:
    """Get the chunking strategy for a document type.

    Args:
        doc_type: Document type string

    Returns:
        ChunkingStrategy for the document type, or GENERAL if unknown
    """
    try:
        dtype = DocType(doc_type)
        return STRATEGIES[dtype]
    except ValueError:
        return STRATEGIES[DocType.GENERAL]


def create_splitter_for_doc_type(doc_type: str) -> RecursiveSplitter:
    """Create a configured splitter for a document type.

    Args:
        doc_type: Document type string

    Returns:
        RecursiveSplitter configured for the document type
    """
    strategy = get_chunking_strategy(doc_type)
    return RecursiveSplitter(
        chunk_size=strategy.chunk_size,
        chunk_overlap=strategy.chunk_overlap,
        separators=strategy.separators,
    )


def chunk_document(
    text: str,
    source: str,
    doc_type: str,
    company_id: str | None = None,
    metadata: dict | None = None,
) -> list[Chunk]:
    """Chunk a document using the appropriate strategy.

    This is the main entry point for document chunking.

    Args:
        text: Document text to chunk
        source: Source identifier (filename, URL, etc.)
        doc_type: Document type for strategy selection
        company_id: Optional company ID for multi-tenant
        metadata: Optional additional metadata

    Returns:
        List of Chunk objects
    """
    splitter = create_splitter_for_doc_type(doc_type)
    return splitter.create_chunks(
        text=text,
        source=source,
        doc_type=doc_type,
        company_id=company_id,
        metadata=metadata,
    )
