"""Configuration module using Pydantic Settings for environment validation."""

from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_prefix="RAG_",
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Qdrant Configuration
    qdrant_url: str = Field(
        default="http://localhost:6333",
        description="Qdrant vector database URL",
    )
    qdrant_collection: str = Field(
        default="archigram_v1",
        description="Qdrant collection name",
    )

    # Embedding Configuration
    use_cloud_embeddings: bool = Field(
        default=False,
        description="Use cloud (Gemini) embeddings instead of local E5",
    )
    gemini_api_key: str | None = Field(
        default=None,
        description="Gemini API key for cloud embeddings",
    )
    embedding_model: str = Field(
        default="intfloat/e5-small-v2",
        description="Local embedding model name",
    )
    embedding_dimension: int = Field(
        default=384,
        description="Embedding vector dimension (384 for E5-small-v2)",
    )

    # API Security
    ingest_api_key: str = Field(
        description="API key required for document ingestion",
    )

    # Rate Limiting
    ingest_rate_limit: str = Field(
        default="10/minute",
        description="Rate limit for ingest endpoint",
    )
    search_rate_limit: str = Field(
        default="60/minute",
        description="Rate limit for search endpoint",
    )

    # File Upload Limits
    max_file_size_mb: int = Field(
        default=10,
        description="Maximum file size for upload in MB",
    )
    allowed_extensions: list[str] = Field(
        default=["pdf", "md", "txt"],
        description="Allowed file extensions for upload",
    )

    # Search Configuration
    search_timeout_sec: int = Field(
        default=5,
        description="Search timeout in seconds",
    )
    default_top_k: int = Field(
        default=5,
        description="Default number of results to return",
    )

    # Chunking Configuration
    chunk_size: int = Field(
        default=500,
        description="Target chunk size in tokens (estimated)",
    )
    chunk_overlap: int = Field(
        default=50,
        description="Overlap between chunks in tokens (estimated)",
    )

    # Logging
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = Field(
        default="INFO",
        description="Logging level",
    )

    # CORS (str to avoid Pydantic JSON-decoding; use cors_origins_list for FastAPI)
    cors_origins: str = Field(
        default="http://localhost:3000",
        description="Comma-separated allowed CORS origins",
    )

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse comma-separated CORS origins into list."""
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def max_file_size_bytes(self) -> int:
        """Get maximum file size in bytes."""
        return self.max_file_size_mb * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
