"""Ingest API routes for document upload and processing."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, Header, HTTPException, Request, UploadFile
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address

from chunking import chunk_document
from config import Settings, get_settings
from embeddings import get_embedding_provider
from middleware.logging import get_logger
from search.store import get_vector_store

from .parser import ParserError, parse_document
from .validation import ValidationError, validate_content, validate_doc_type, validate_file_extension, validate_file_size

logger = get_logger(__name__)
router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


class IngestResponse(BaseModel):
    """Response model for document ingestion."""

    doc_id: str
    chunks_count: int
    message: str


class IngestError(BaseModel):
    """Error response model."""

    detail: str


def verify_api_key(
    x_api_key: Annotated[str | None, Header()] = None,
    settings: Settings = Depends(get_settings),
) -> None:
    """Verify the API key for ingest requests.

    Args:
        x_api_key: API key from X-API-Key header
        settings: Application settings

    Raises:
        HTTPException: If API key is missing or invalid
    """
    if not x_api_key:
        raise HTTPException(
            status_code=401,
            detail="Missing X-API-Key header",
        )

    if x_api_key != settings.ingest_api_key:
        raise HTTPException(
            status_code=401,
            detail="Invalid API key",
        )


@router.post(
    "/ingest",
    response_model=IngestResponse,
    responses={
        400: {"model": IngestError, "description": "Validation error"},
        401: {"model": IngestError, "description": "Authentication error"},
        429: {"model": IngestError, "description": "Rate limit exceeded"},
        500: {"model": IngestError, "description": "Internal server error"},
    },
    summary="Ingest a document into the knowledge base",
    description="""
Upload a document to be processed and stored in the vector database.

**Supported file types:** PDF, Markdown (.md), Plain text (.txt)

**Document types:**
- `glossary`: Company terminology and definitions (small chunks)
- `architecture_guide`: System architecture documentation (large chunks)
- `tech_stack`: Technology stack documentation (medium chunks)
- `general`: General documentation (default)

**Authentication:** Requires X-API-Key header.
""",
)
@limiter.limit("10/minute")
async def ingest_document(
    request: Request,
    file: Annotated[UploadFile, File(description="Document file to ingest")],
    doc_type: Annotated[
        str,
        Form(description="Document type: glossary, architecture_guide, tech_stack, or general"),
    ] = "general",
    company_id: Annotated[
        str | None,
        Form(description="Optional company ID for multi-tenant isolation"),
    ] = None,
    _: None = Depends(verify_api_key),
) -> IngestResponse:
    """Ingest a document into the knowledge base.

    The document is:
    1. Validated (size, type, content)
    2. Parsed to extract text
    3. Chunked using document-type-specific strategy
    4. Embedded using configured embedding provider
    5. Stored in Qdrant vector database
    """
    # Generate document ID
    doc_id = str(uuid.uuid4())

    logger.info(
        "ingest_started",
        doc_id=doc_id,
        filename=file.filename,
        doc_type=doc_type,
        company_id=company_id,
    )

    try:
        # Validate file extension
        if not file.filename:
            raise ValidationError("Filename is required")
        extension = validate_file_extension(file.filename)

        # Read and validate file size
        content = await file.read()
        validate_file_size(len(content))

        # Validate content
        validate_content(content, extension)

        # Validate doc_type
        doc_type = validate_doc_type(doc_type)

    except ValidationError as e:
        logger.warning("ingest_validation_failed", doc_id=doc_id, error=str(e))
        raise HTTPException(status_code=400, detail=str(e))

    try:
        # Parse document
        text = parse_document(content, file.filename, extension)

    except ParserError as e:
        logger.error("ingest_parse_failed", doc_id=doc_id, error=str(e))
        raise HTTPException(status_code=400, detail=str(e))

    try:
        # Chunk document
        chunks = chunk_document(
            text=text,
            source=file.filename,
            doc_type=doc_type,
            company_id=company_id,
            metadata={"doc_id": doc_id},
        )

        if not chunks:
            raise HTTPException(
                status_code=400,
                detail="Document produced no chunks after processing",
            )

        logger.info("document_chunked", doc_id=doc_id, chunks_count=len(chunks))

        # Embed chunks
        embedding_provider = get_embedding_provider()
        chunk_texts = [chunk.text for chunk in chunks]
        embeddings = await embedding_provider.embed_passages(chunk_texts)

        logger.info("chunks_embedded", doc_id=doc_id, embeddings_count=len(embeddings))

        # Store in Qdrant
        vector_store = get_vector_store()
        await vector_store.upsert_chunks(chunks, embeddings)

        logger.info(
            "ingest_completed",
            doc_id=doc_id,
            filename=file.filename,
            chunks_count=len(chunks),
        )

        return IngestResponse(
            doc_id=doc_id,
            chunks_count=len(chunks),
            message=f"Successfully ingested {file.filename}",
        )

    except Exception as e:
        logger.error("ingest_failed", doc_id=doc_id, error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process document: {str(e)}",
        )
