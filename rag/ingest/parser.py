"""Document parsers for different file types."""

from io import BytesIO

from middleware.logging import get_logger

logger = get_logger(__name__)


class ParserError(Exception):
    """Raised when document parsing fails."""

    pass


def parse_pdf(content: bytes) -> str:
    """Parse PDF content and extract text.

    Uses pypdf for text extraction.

    Args:
        content: Raw PDF file content

    Returns:
        Extracted text from all pages

    Raises:
        ParserError: If PDF parsing fails
    """
    try:
        from pypdf import PdfReader

        reader = PdfReader(BytesIO(content))

        if len(reader.pages) == 0:
            raise ParserError("PDF has no pages")

        # Extract text from all pages
        texts: list[str] = []
        for i, page in enumerate(reader.pages):
            try:
                text = page.extract_text()
                if text:
                    texts.append(text)
            except Exception as e:
                logger.warning("pdf_page_extraction_failed", page=i, error=str(e))

        if not texts:
            raise ParserError("Could not extract any text from PDF")

        return "\n\n".join(texts)

    except ImportError:
        raise ParserError("pypdf is not installed")
    except Exception as e:
        raise ParserError(f"Failed to parse PDF: {str(e)}")


def parse_markdown(content: str) -> str:
    """Parse Markdown content.

    For now, returns the raw markdown. Could be extended to:
    - Strip front matter
    - Normalize headings
    - Extract structured sections

    Args:
        content: Markdown text content

    Returns:
        Processed markdown text
    """
    # Strip front matter if present (YAML between ---)
    lines = content.split("\n")
    if lines and lines[0].strip() == "---":
        for i, line in enumerate(lines[1:], 1):
            if line.strip() == "---":
                content = "\n".join(lines[i + 1 :])
                break

    return content.strip()


def parse_text(content: str) -> str:
    """Parse plain text content.

    Performs basic cleanup:
    - Strips leading/trailing whitespace
    - Normalizes line endings

    Args:
        content: Plain text content

    Returns:
        Cleaned text
    """
    # Normalize line endings
    content = content.replace("\r\n", "\n").replace("\r", "\n")

    # Remove excessive blank lines (more than 2 in a row)
    while "\n\n\n" in content:
        content = content.replace("\n\n\n", "\n\n")

    return content.strip()


def parse_document(content: bytes, filename: str, extension: str) -> str:
    """Parse document content based on file type.

    Args:
        content: Raw file content
        filename: Original filename
        extension: File extension (lowercase, no dot)

    Returns:
        Extracted text content

    Raises:
        ParserError: If parsing fails
    """
    logger.info("parsing_document", filename=filename, extension=extension)

    if extension == "pdf":
        text = parse_pdf(content)
    elif extension == "md":
        # Already decoded in validation
        text_content = content.decode("utf-8")
        text = parse_markdown(text_content)
    elif extension == "txt":
        text_content = content.decode("utf-8")
        text = parse_text(text_content)
    else:
        raise ParserError(f"Unsupported file type: {extension}")

    if not text:
        raise ParserError("No text content could be extracted from document")

    logger.info(
        "document_parsed",
        filename=filename,
        text_length=len(text),
    )

    return text
