"""File validation for document ingestion."""

import re
from pathlib import Path

from config import get_settings
from middleware.logging import get_logger

logger = get_logger(__name__)


class ValidationError(Exception):
    """Raised when file validation fails."""

    pass


def validate_file_extension(filename: str) -> str:
    """Validate and return the file extension.

    Args:
        filename: Name of the uploaded file

    Returns:
        Lowercase file extension without dot

    Raises:
        ValidationError: If extension is not allowed
    """
    settings = get_settings()

    if not filename:
        raise ValidationError("Filename is required")

    # Get extension
    ext = Path(filename).suffix.lower().lstrip(".")

    if not ext:
        raise ValidationError("File must have an extension")

    if ext not in settings.allowed_extensions:
        allowed = ", ".join(settings.allowed_extensions)
        raise ValidationError(f"File type '{ext}' not allowed. Allowed types: {allowed}")

    return ext


def validate_file_size(size: int) -> None:
    """Validate file size is within limits.

    Args:
        size: File size in bytes

    Raises:
        ValidationError: If file is too large
    """
    settings = get_settings()

    if size <= 0:
        raise ValidationError("File is empty")

    if size > settings.max_file_size_bytes:
        max_mb = settings.max_file_size_mb
        raise ValidationError(f"File size exceeds maximum of {max_mb}MB")


def validate_content(content: bytes, extension: str) -> str:
    """Validate file content and decode to string.

    Performs basic content validation:
    - Checks for binary content in text files
    - Validates PDF header
    - Checks for potentially malicious patterns

    Args:
        content: Raw file content
        extension: File extension

    Returns:
        Decoded text content (for text files)

    Raises:
        ValidationError: If content validation fails
    """
    if extension == "pdf":
        # PDF validation happens in parser
        if not content.startswith(b"%PDF"):
            raise ValidationError("Invalid PDF file: missing PDF header")
        return ""  # PDF text extraction handled by parser

    # For text files, try to decode
    try:
        text = content.decode("utf-8")
    except UnicodeDecodeError:
        try:
            text = content.decode("latin-1")
        except UnicodeDecodeError:
            raise ValidationError("File is not valid UTF-8 or Latin-1 encoded text")

    # Check for null bytes (binary content)
    if "\x00" in text:
        raise ValidationError("File appears to contain binary content")

    # Check for suspiciously long lines (possible binary/encoded content)
    lines = text.split("\n")
    for i, line in enumerate(lines[:100]):  # Check first 100 lines
        if len(line) > 10000:
            raise ValidationError(f"Line {i + 1} is suspiciously long (possible binary content)")

    # Basic sanitization check - warn about potential script injection
    # (though we're not executing any content, just storing it)
    suspicious_patterns = [
        r"<script[^>]*>",
        r"javascript:",
        r"data:text/html",
    ]

    for pattern in suspicious_patterns:
        if re.search(pattern, text, re.IGNORECASE):
            logger.warning("suspicious_content_pattern", pattern=pattern)

    return text


def validate_doc_type(doc_type: str) -> str:
    """Validate document type.

    Args:
        doc_type: Document type string

    Returns:
        Validated document type

    Raises:
        ValidationError: If doc_type is invalid
    """
    valid_types = {"glossary", "architecture_guide", "tech_stack", "general"}

    if not doc_type:
        return "general"

    doc_type = doc_type.lower().strip()

    if doc_type not in valid_types:
        raise ValidationError(
            f"Invalid doc_type '{doc_type}'. Valid types: {', '.join(sorted(valid_types))}"
        )

    return doc_type
