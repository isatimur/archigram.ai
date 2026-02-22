"""Document parser using Docling for rich multi-format extraction.

Supports PDF (with OCR/tables), DOCX, PPTX, XLSX, HTML, Markdown, and plain text.
Docling is an optional dependency — import errors produce clear guidance.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from config import get_settings
from middleware.logging import get_logger

from .parser import ParserError

if TYPE_CHECKING:
    pass

logger = get_logger(__name__)

# Map file extensions to Docling InputFormat values
_EXTENSION_TO_FORMAT: dict[str, str] = {
    "pdf": "PDF",
    "docx": "DOCX",
    "pptx": "PPTX",
    "xlsx": "XLSX",
    "html": "HTML",
    "md": "MD",
    "txt": "ASCIIDOC",  # Docling treats plain text via AsciiDoc pipeline
}


def _get_docling_modules() -> tuple[Any, ...]:
    """Lazy-import docling modules, raising a clear error if missing."""
    try:
        from docling.datamodel.base_models import InputFormat
        from docling.datamodel.document import DocumentStream
        from docling.document_converter import DocumentConverter, PdfFormatOption
        from docling.pipeline.standard_pdf_pipeline import StandardPdfPipeline
        from docling_core.transforms.chunker import HierarchicalChunker  # noqa: F401

        return InputFormat, DocumentStream, DocumentConverter, PdfFormatOption, StandardPdfPipeline
    except ImportError as exc:
        raise ParserError(
            "Docling is not installed. Install with: pip install docling docling-core "
            "(or pip install -e '.[docling]' from the rag/ directory)"
        ) from exc


def parse_document_with_docling(
    content: bytes,
    filename: str,
    extension: str,
) -> Any:
    """Parse a document using Docling and return a DoclingDocument.

    Args:
        content: Raw file content
        filename: Original filename
        extension: File extension (lowercase, no dot)

    Returns:
        DoclingDocument with structured content

    Raises:
        ParserError: If parsing fails or docling is not installed
    """
    settings = get_settings()

    format_name = _EXTENSION_TO_FORMAT.get(extension)
    if not format_name:
        raise ParserError(f"Unsupported file type for docling parser: {extension}")

    InputFormat, DocumentStream, DocumentConverter, PdfFormatOption, StandardPdfPipeline = (
        _get_docling_modules()
    )

    # Resolve the InputFormat enum value
    try:
        input_format = InputFormat[format_name]
    except KeyError as exc:
        raise ParserError(f"Docling does not support format: {format_name}") from exc

    logger.info("docling_parsing_start", filename=filename, format=format_name)

    # Build pipeline options for PDF
    pipeline_options: dict[str, Any] = {}
    if extension == "pdf":
        from docling.datamodel.pipeline_options import PdfPipelineOptions

        pdf_options = PdfPipelineOptions()
        pdf_options.do_ocr = settings.docling_ocr_enabled
        pdf_options.do_table_structure = settings.docling_table_structure
        pipeline_options[InputFormat.PDF] = PdfFormatOption(
            pipeline_cls=StandardPdfPipeline,
            pipeline_options=pdf_options,
        )

    try:
        converter = DocumentConverter(
            allowed_formats=[input_format],
            format_options=pipeline_options if pipeline_options else None,
        )

        doc_stream = DocumentStream(name=filename, stream=content)
        result = converter.convert(doc_stream)
        doc = result.document

        if not doc:
            raise ParserError("Docling produced no document output")

        # Quick sanity check: ensure there's actual content
        exported = doc.export_to_markdown()
        if not exported or not exported.strip():
            raise ParserError("Docling extracted no text content from document")

        logger.info(
            "docling_parsing_complete",
            filename=filename,
            text_length=len(exported),
        )

        return doc

    except ParserError:
        raise
    except Exception as e:
        raise ParserError(f"Docling parsing failed: {e}") from e
