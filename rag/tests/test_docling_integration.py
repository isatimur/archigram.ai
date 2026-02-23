"""Tests for Docling integration — parser, chunker, config, validation, routes.

All Docling imports are mocked so tests run without Docling installed.
"""

import os
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import pytest

# Ensure test env vars are set
os.environ.setdefault("RAG_INGEST_API_KEY", "test-api-key")


# ---------------------------------------------------------------------------
# Config tests
# ---------------------------------------------------------------------------


class TestConfigExtensions:
    """Test effective_allowed_extensions in both parser modes."""

    def test_lightweight_mode_returns_base_extensions(self):
        from config import Settings

        settings = Settings(
            ingest_api_key="test",
            parser_mode="lightweight",
            allowed_extensions=["pdf", "md", "txt"],
        )
        assert settings.effective_allowed_extensions == ["pdf", "md", "txt"]

    def test_docling_mode_adds_extra_extensions(self):
        from config import Settings

        settings = Settings(
            ingest_api_key="test",
            parser_mode="docling",
            allowed_extensions=["pdf", "md", "txt"],
        )
        effective = settings.effective_allowed_extensions
        assert "pdf" in effective
        assert "md" in effective
        assert "txt" in effective
        assert "docx" in effective
        assert "pptx" in effective
        assert "xlsx" in effective
        assert "html" in effective

    def test_docling_mode_no_duplicates(self):
        from config import Settings

        settings = Settings(
            ingest_api_key="test",
            parser_mode="docling",
            allowed_extensions=["pdf", "md", "txt", "docx"],
        )
        effective = settings.effective_allowed_extensions
        assert effective.count("docx") == 1

    def test_default_parser_mode_is_lightweight(self):
        from config import Settings

        settings = Settings(ingest_api_key="test")
        assert settings.parser_mode == "lightweight"

    def test_docling_ocr_default_false(self):
        from config import Settings

        settings = Settings(ingest_api_key="test")
        assert settings.docling_ocr_enabled is False

    def test_docling_table_structure_default_true(self):
        from config import Settings

        settings = Settings(ingest_api_key="test")
        assert settings.docling_table_structure is True


# ---------------------------------------------------------------------------
# Validation tests
# ---------------------------------------------------------------------------


class TestValidationWithDocling:
    """Test validation behaviour when docling extensions are active."""

    def test_docx_extension_accepted_in_docling_mode(self):
        from config import Settings

        settings = Settings(ingest_api_key="test", parser_mode="docling")
        with patch("ingest.validation.get_settings", return_value=settings):
            from ingest.validation import validate_file_extension

            ext = validate_file_extension("report.docx")
            assert ext == "docx"

    def test_docx_extension_rejected_in_lightweight_mode(self):
        from config import Settings

        settings = Settings(ingest_api_key="test", parser_mode="lightweight")
        with patch("ingest.validation.get_settings", return_value=settings):
            from ingest.validation import ValidationError, validate_file_extension

            with pytest.raises(ValidationError, match="not allowed"):
                validate_file_extension("report.docx")

    def test_zip_magic_bytes_validation_for_docx(self):
        from ingest.validation import validate_content

        # Valid ZIP header
        valid_docx = b"PK\x03\x04" + b"\x00" * 100
        result = validate_content(valid_docx, "docx")
        assert result == ""

    def test_zip_magic_bytes_validation_rejects_invalid(self):
        from ingest.validation import ValidationError, validate_content

        invalid_docx = b"NOT_A_ZIP" + b"\x00" * 100
        with pytest.raises(ValidationError, match="not a valid ZIP"):
            validate_content(invalid_docx, "docx")

    def test_pptx_validation(self):
        from ingest.validation import validate_content

        valid_pptx = b"PK\x03\x04" + b"\x00" * 100
        result = validate_content(valid_pptx, "pptx")
        assert result == ""

    def test_xlsx_validation(self):
        from ingest.validation import validate_content

        valid_xlsx = b"PK\x03\x04" + b"\x00" * 100
        result = validate_content(valid_xlsx, "xlsx")
        assert result == ""

    def test_html_validation_valid_utf8(self):
        from ingest.validation import validate_content

        valid_html = b"<html><body>Hello</body></html>"
        result = validate_content(valid_html, "html")
        assert result == ""

    def test_html_validation_rejects_invalid_utf8(self):
        from ingest.validation import ValidationError, validate_content

        invalid_html = b"\xff\xfe<html>"
        with pytest.raises(ValidationError, match="not valid UTF-8"):
            validate_content(invalid_html, "html")


# ---------------------------------------------------------------------------
# Docling parser tests
# ---------------------------------------------------------------------------


class TestDoclingParser:
    """Test parse_document_with_docling with mocked Docling."""

    def _build_mock_modules(self):
        """Create mock docling modules."""
        mock_input_format = MagicMock()
        mock_input_format.__getitem__ = MagicMock(return_value="PDF")

        mock_doc = MagicMock()
        mock_doc.export_to_markdown.return_value = "# Test Document\n\nSome content here."

        mock_result = MagicMock()
        mock_result.document = mock_doc

        mock_converter = MagicMock()
        mock_converter.convert.return_value = mock_result

        mock_converter_cls = MagicMock(return_value=mock_converter)

        mock_doc_stream = MagicMock()
        mock_doc_stream_cls = MagicMock(return_value=mock_doc_stream)

        mock_pdf_format_option = MagicMock()
        mock_pipeline_cls = MagicMock()

        return {
            "input_format": mock_input_format,
            "doc": mock_doc,
            "converter_cls": mock_converter_cls,
            "doc_stream_cls": mock_doc_stream_cls,
            "pdf_format_option": mock_pdf_format_option,
            "pipeline_cls": mock_pipeline_cls,
        }

    def test_parse_pdf_with_docling(self):
        mocks = self._build_mock_modules()

        with patch.dict("sys.modules", {
            "docling": MagicMock(),
            "docling.datamodel": MagicMock(),
            "docling.datamodel.base_models": MagicMock(InputFormat=mocks["input_format"]),
            "docling.datamodel.document": MagicMock(DocumentStream=mocks["doc_stream_cls"]),
            "docling.datamodel.pipeline_options": MagicMock(PdfPipelineOptions=MagicMock()),
            "docling.document_converter": MagicMock(
                DocumentConverter=mocks["converter_cls"],
                PdfFormatOption=mocks["pdf_format_option"],
            ),
            "docling.pipeline": MagicMock(),
            "docling.pipeline.standard_pdf_pipeline": MagicMock(
                StandardPdfPipeline=mocks["pipeline_cls"],
            ),
            "docling_core": MagicMock(),
            "docling_core.transforms": MagicMock(),
            "docling_core.transforms.chunker": MagicMock(),
        }):
            from ingest.docling_parser import parse_document_with_docling

            doc = parse_document_with_docling(b"%PDF-1.4 content", "test.pdf", "pdf")
            assert doc is not None
            assert doc.export_to_markdown() == "# Test Document\n\nSome content here."

    def test_unsupported_extension_raises(self):
        from ingest.docling_parser import parse_document_with_docling
        from ingest.parser import ParserError

        with pytest.raises(ParserError, match="Unsupported file type"):
            parse_document_with_docling(b"content", "file.xyz", "xyz")

    def test_missing_docling_raises_clear_error(self):
        """When docling is not installed, we get a helpful error message."""
        import importlib
        import sys

        from ingest.parser import ParserError

        # Setting a sys.modules entry to None makes import raise ImportError
        docling_keys = [k for k in sys.modules if k.startswith("docling")]
        block = {k: None for k in docling_keys}
        block.update({
            "docling": None,
            "docling.datamodel": None,
            "docling.datamodel.base_models": None,
            "docling.datamodel.document": None,
            "docling.document_converter": None,
            "docling.pipeline": None,
            "docling.pipeline.standard_pdf_pipeline": None,
            "docling_core": None,
            "docling_core.transforms": None,
            "docling_core.transforms.chunker": None,
        })

        with patch.dict("sys.modules", block):
            from ingest import docling_parser

            importlib.reload(docling_parser)

            with pytest.raises(ParserError, match="Docling is not installed"):
                docling_parser.parse_document_with_docling(b"%PDF-1.4", "test.pdf", "pdf")


# ---------------------------------------------------------------------------
# Docling chunker adapter tests
# ---------------------------------------------------------------------------


class TestDoclingChunkerAdapter:
    """Test chunk_docling_document with mocked Docling chunker."""

    def _make_mock_chunk(self, text: str, headings: list[str] | None = None):
        """Create a mock docling chunk."""
        chunk = SimpleNamespace(text=text)
        if headings is not None:
            chunk.meta = SimpleNamespace(headings=headings)
        else:
            chunk.meta = None
        return chunk

    def test_basic_chunking(self):
        mock_chunks = [
            self._make_mock_chunk("First chunk of text."),
            self._make_mock_chunk("Second chunk of text."),
        ]

        mock_chunker = MagicMock()
        mock_chunker.chunk.return_value = mock_chunks

        with patch.dict("sys.modules", {
            "docling_core": MagicMock(),
            "docling_core.transforms": MagicMock(),
            "docling_core.transforms.chunker": MagicMock(
                HierarchicalChunker=MagicMock(return_value=mock_chunker),
            ),
        }):
            import importlib

            from chunking import docling_chunker

            importlib.reload(docling_chunker)

            mock_doc = MagicMock()
            chunks = docling_chunker.chunk_docling_document(
                doc=mock_doc,
                source="test.pdf",
                doc_type="general",
                company_id="acme",
                metadata={"doc_id": "123"},
            )

            assert len(chunks) == 2
            assert chunks[0].text == "First chunk of text."
            assert chunks[0].source == "test.pdf"
            assert chunks[0].doc_type == "general"
            assert chunks[0].company_id == "acme"
            assert chunks[0].metadata["doc_id"] == "123"
            assert chunks[0].metadata["chunker"] == "docling_hybrid"

    def test_strategy_sizes_applied(self):
        """Verify that doc-type-specific chunk sizes are passed to HybridChunker."""
        mock_chunker_cls = MagicMock()
        mock_chunker_cls.return_value.chunk.return_value = []

        with patch.dict("sys.modules", {
            "docling_core": MagicMock(),
            "docling_core.transforms": MagicMock(),
            "docling_core.transforms.chunker": MagicMock(
                HierarchicalChunker=mock_chunker_cls,
            ),
        }):
            import importlib

            from chunking import docling_chunker

            importlib.reload(docling_chunker)

            mock_doc = MagicMock()
            docling_chunker.chunk_docling_document(
                doc=mock_doc,
                source="glossary.md",
                doc_type="glossary",
            )

            # Glossary strategy uses chunk_size=100, chunk_overlap=20
            call_kwargs = mock_chunker_cls.call_args[1]
            assert call_kwargs["max_tokens"] == 100
            assert call_kwargs["overlap"] == 20

    def test_empty_chunks_filtered(self):
        mock_chunks = [
            self._make_mock_chunk("Real content"),
            self._make_mock_chunk(""),  # empty
            self._make_mock_chunk("   "),  # whitespace only
        ]

        mock_chunker = MagicMock()
        mock_chunker.chunk.return_value = mock_chunks

        with patch.dict("sys.modules", {
            "docling_core": MagicMock(),
            "docling_core.transforms": MagicMock(),
            "docling_core.transforms.chunker": MagicMock(
                HierarchicalChunker=MagicMock(return_value=mock_chunker),
            ),
        }):
            import importlib

            from chunking import docling_chunker

            importlib.reload(docling_chunker)

            chunks = docling_chunker.chunk_docling_document(
                doc=MagicMock(),
                source="test.pdf",
                doc_type="general",
            )

            assert len(chunks) == 1
            assert chunks[0].text == "Real content"

    def test_headings_in_metadata(self):
        mock_chunks = [
            self._make_mock_chunk("Content under heading", headings=["Chapter 1", "Section A"]),
        ]

        mock_chunker = MagicMock()
        mock_chunker.chunk.return_value = mock_chunks

        with patch.dict("sys.modules", {
            "docling_core": MagicMock(),
            "docling_core.transforms": MagicMock(),
            "docling_core.transforms.chunker": MagicMock(
                HierarchicalChunker=MagicMock(return_value=mock_chunker),
            ),
        }):
            import importlib

            from chunking import docling_chunker

            importlib.reload(docling_chunker)

            chunks = docling_chunker.chunk_docling_document(
                doc=MagicMock(),
                source="test.pdf",
                doc_type="general",
            )

            assert chunks[0].metadata["headings"] == ["Chapter 1", "Section A"]


# ---------------------------------------------------------------------------
# is_docling_available tests
# ---------------------------------------------------------------------------


class TestDoclingAvailability:
    def test_returns_false_when_not_installed(self):
        with patch.dict("sys.modules", {"docling_core": None, "docling_core.transforms": None, "docling_core.transforms.chunker": None}):
            import importlib

            from chunking import docling_chunker

            importlib.reload(docling_chunker)

            assert docling_chunker.is_docling_available() is False


# ---------------------------------------------------------------------------
# Ingest route docling mode tests
# ---------------------------------------------------------------------------


class TestIngestRouteDoclingMode:
    """Test the ingest endpoint with docling mode enabled."""

    @pytest.mark.anyio
    async def test_ingest_docx_in_docling_mode(
        self, mock_embedding_provider, mock_vector_store
    ):
        from config import Settings

        settings = Settings(
            ingest_api_key="test-api-key",
            parser_mode="docling",
            log_level="DEBUG",
        )

        mock_doc = MagicMock()
        mock_doc.export_to_markdown.return_value = "# Report\n\nContent here."

        mock_chunks = [
            SimpleNamespace(
                text="Report content",
                meta=None,
            )
        ]
        mock_chunker = MagicMock()
        mock_chunker.chunk.return_value = mock_chunks

        with (
            patch("config.get_settings", return_value=settings),
            patch("ingest.validation.get_settings", return_value=settings),
            patch("ingest.routes.get_settings", return_value=settings),
            patch(
                "ingest.docling_parser.parse_document_with_docling",
                return_value=mock_doc,
            ) as mock_parse,
            patch(
                "chunking.docling_chunker.chunk_docling_document",
            ) as mock_chunk_fn,
        ):
            from chunking.splitter import Chunk

            mock_chunk_fn.return_value = [
                Chunk(
                    text="Report content",
                    index=0,
                    source="report.docx",
                    doc_type="general",
                    metadata={"doc_id": "test", "chunker": "docling_hybrid"},
                )
            ]

            from httpx import ASGITransport, AsyncClient

            from main import app

            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test",
            ) as client:
                response = await client.post(
                    "/api/v1/rag/ingest",
                    headers={"X-API-Key": "test-api-key"},
                    files={"file": ("report.docx", b"PK\x03\x04test", "application/octet-stream")},
                    data={"doc_type": "general"},
                )

            assert response.status_code == 200
            data = response.json()
            assert data["chunks_count"] == 1
            assert "Successfully ingested" in data["message"]
            mock_parse.assert_called_once()
            mock_chunk_fn.assert_called_once()


# ---------------------------------------------------------------------------
# Fallback behaviour tests
# ---------------------------------------------------------------------------


class TestFallbackBehavior:
    """Test clear errors when docling is not installed but mode is 'docling'."""

    def test_parser_raises_import_error_message(self):
        """parse_document_with_docling raises ParserError with install instructions."""
        import importlib
        import sys

        from ingest.parser import ParserError

        # Setting a sys.modules entry to None makes import raise ImportError
        docling_keys = [k for k in sys.modules if k.startswith("docling")]
        block = {k: None for k in docling_keys}
        block.update({
            "docling": None,
            "docling.datamodel": None,
            "docling.datamodel.base_models": None,
            "docling.datamodel.document": None,
            "docling.document_converter": None,
            "docling.pipeline": None,
            "docling.pipeline.standard_pdf_pipeline": None,
            "docling_core": None,
            "docling_core.transforms": None,
            "docling_core.transforms.chunker": None,
        })

        with patch.dict("sys.modules", block):
            from ingest import docling_parser

            importlib.reload(docling_parser)

            with pytest.raises(ParserError, match="pip install docling"):
                docling_parser.parse_document_with_docling(b"%PDF-1.4", "test.pdf", "pdf")
