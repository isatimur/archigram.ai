# RAG Administration Guide

This guide covers how to administer the ArchiGram.ai RAG (Retrieval-Augmented Generation) service for enterprise knowledge base management.

## Table of Contents

- [Quick Start](#quick-start)
- [Document Ingestion](#document-ingestion)
- [File Formats](#file-formats)
- [Document Types](#document-types)
- [API Examples](#api-examples)
- [Multi-Tenant Setup](#multi-tenant-setup)
- [Troubleshooting](#troubleshooting)

## Quick Start

### 1. Start the RAG Stack

```bash
# Start with RAG profile
docker compose --profile rag up -d

# Verify services are running
docker compose ps
```

### 2. Check Service Health

```bash
# Check RAG service readiness
curl http://localhost:8000/health/ready

# Expected response:
# {"status":"ready","checks":{"embeddings":true,"qdrant":true}}
```

### 3. Ingest Your First Document

```bash
# Ingest a glossary document
curl -X POST http://localhost:8000/api/v1/rag/ingest \
  -H "X-API-Key: your_ingest_api_key" \
  -F "file=@company-glossary.md" \
  -F "doc_type=glossary"
```

## Document Ingestion

### Authentication

All ingest operations require the `X-API-Key` header with the value configured in `RAG_INGEST_API_KEY`.

```bash
curl -X POST http://localhost:8000/api/v1/rag/ingest \
  -H "X-API-Key: ${RAG_INGEST_API_KEY}" \
  -F "file=@document.pdf" \
  -F "doc_type=general"
```

### Rate Limits

- **Ingest endpoint**: 10 requests per minute per IP
- **Search endpoint**: 60 requests per minute per IP

### File Size Limits

- Maximum file size: **10 MB** (configurable via `RAG_MAX_FILE_SIZE_MB`)

## File Formats

### Supported Formats

| Format     | Extension | Notes                                      |
| ---------- | --------- | ------------------------------------------ |
| PDF        | `.pdf`    | Text extraction from standard PDFs         |
| Markdown   | `.md`     | YAML frontmatter is automatically stripped |
| Plain Text | `.txt`    | UTF-8 encoding required                    |

### Preparing Documents

**PDF Files:**

- Ensure text is selectable (not scanned images)
- For scanned documents, use OCR preprocessing

**Markdown Files:**

- Use standard Markdown syntax
- Headings help with semantic chunking

**Text Files:**

- UTF-8 encoding is required
- Avoid binary content

## Document Types

Choose the appropriate document type for optimal chunking:

| Type                 | Chunk Size  | Use Case                         |
| -------------------- | ----------- | -------------------------------- |
| `glossary`           | ~100 tokens | Company terminology, definitions |
| `architecture_guide` | ~600 tokens | System documentation, ADRs       |
| `tech_stack`         | ~400 tokens | Technology descriptions          |
| `general`            | ~500 tokens | Default for other documents      |

### Choosing Document Types

**Glossary (`glossary`):**

```markdown
# Company Terms

**API Gateway**: Our central entry point for all client requests...
**User Service**: Handles authentication and user management...
```

**Architecture Guide (`architecture_guide`):**

```markdown
# System Architecture

## Overview

Our platform uses a microservices architecture...

## Data Flow

Requests enter through the API Gateway and are routed to...
```

**Tech Stack (`tech_stack`):**

```markdown
# Technology Stack

## Frontend

- React 18 with TypeScript
- TailwindCSS for styling

## Backend

- FastAPI for REST APIs
- PostgreSQL for persistence
```

## API Examples

### Ingest a Glossary

```bash
curl -X POST http://localhost:8000/api/v1/rag/ingest \
  -H "X-API-Key: your_api_key" \
  -F "file=@glossary.md" \
  -F "doc_type=glossary"

# Response:
# {"doc_id":"abc123","chunks_count":42,"message":"Successfully ingested glossary.md"}
```

### Ingest with Company ID (Multi-Tenant)

```bash
curl -X POST http://localhost:8000/api/v1/rag/ingest \
  -H "X-API-Key: your_api_key" \
  -F "file=@architecture.pdf" \
  -F "doc_type=architecture_guide" \
  -F "company_id=acme-corp"
```

### Search the Knowledge Base

```bash
curl -X POST http://localhost:8000/api/v1/rag/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "user authentication flow",
    "top_k": 5
  }'

# Response:
# {
#   "chunks": [
#     {"text": "...", "source": "architecture.md", "score": 0.92},
#     ...
#   ],
#   "query": "user authentication flow"
# }
```

### Get Knowledge Base Statistics

```bash
curl http://localhost:8000/api/v1/rag/stats

# Response:
# {
#   "collection": "archigram_v1",
#   "vectors_count": 1234,
#   "points_count": 1234,
#   "status": "green"
# }
```

## Multi-Tenant Setup

For organizations with multiple companies/teams, use the `company_id` parameter:

### Ingesting Company-Specific Documents

```bash
# Ingest for Company A
curl -X POST http://localhost:8000/api/v1/rag/ingest \
  -H "X-API-Key: your_api_key" \
  -F "file=@company-a-docs.md" \
  -F "company_id=company-a"

# Ingest for Company B
curl -X POST http://localhost:8000/api/v1/rag/ingest \
  -H "X-API-Key: your_api_key" \
  -F "file=@company-b-docs.md" \
  -F "company_id=company-b"
```

### Searching with Company Filter

```bash
# Search only Company A's documents
curl -X POST http://localhost:8000/api/v1/rag/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "API design patterns",
    "company_id": "company-a"
  }'
```

## Troubleshooting

### Empty Search Results

**Symptoms:** Search returns no chunks or low-relevance results.

**Solutions:**

1. Verify documents were ingested:

   ```bash
   curl http://localhost:8000/api/v1/rag/stats
   # Check vectors_count > 0
   ```

2. Lower the score threshold:

   ```bash
   curl -X POST http://localhost:8000/api/v1/rag/search \
     -d '{"query": "...", "score_threshold": 0.3}'
   ```

3. Check if documents match your query language

### Ingest Failures

**"File type not allowed":**

- Ensure file has `.pdf`, `.md`, or `.txt` extension
- Check file is not corrupted

**"File size exceeds maximum":**

- Split large documents into smaller files
- Increase `RAG_MAX_FILE_SIZE_MB` if needed

**"Invalid API key":**

- Verify `X-API-Key` header matches `RAG_INGEST_API_KEY` env var

### Service Unavailable (503)

**Symptoms:** Search returns 503 error.

**Solutions:**

1. Check Qdrant is running:

   ```bash
   docker compose ps qdrant
   curl http://localhost:6333/health
   ```

2. Check RAG service logs:

   ```bash
   docker compose logs rag
   ```

3. Verify embedding model is loaded:
   ```bash
   curl http://localhost:8000/health/ready
   ```

### High Latency

**Symptoms:** Search takes more than 1 second.

**Solutions:**

1. First search is slower (model loading). Subsequent searches should be faster.
2. Reduce `top_k` parameter
3. Consider using cloud embeddings for faster inference
4. Check Qdrant performance and memory usage

## Backup and Recovery

### Backup Qdrant Data

```bash
# Create a snapshot
curl -X POST "http://localhost:6333/collections/archigram_v1/snapshots"

# List snapshots
curl "http://localhost:6333/collections/archigram_v1/snapshots"
```

### Restore from Backup

1. Stop the RAG service
2. Copy snapshot to Qdrant storage volume
3. Restart Qdrant with snapshot recovery

## OpenAPI Documentation

Interactive API documentation is available at:

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **OpenAPI JSON:** http://localhost:8000/openapi.json
