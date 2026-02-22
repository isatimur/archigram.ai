# RAG API Reference

This document provides the API reference for the ArchiGram.ai RAG service.

## Base URL

```
http://localhost:8000
```

## Interactive Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

## Authentication

The ingest endpoint requires API key authentication via the `X-API-Key` header.

```bash
curl -H "X-API-Key: your_api_key" ...
```

## Endpoints

### Health Check

#### Liveness Probe

Check if the service is running.

```
GET /health
```

**Response:**

```json
{
  "status": "healthy"
}
```

#### Readiness Probe

Check if the service is ready to accept requests.

```
GET /health/ready
```

**Response:**

```json
{
  "status": "ready",
  "checks": {
    "embeddings": true,
    "qdrant": true
  }
}
```

---

### Document Ingestion

#### Ingest Document

Upload and index a document into the knowledge base.

```
POST /api/v1/rag/ingest
```

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| `X-API-Key` | Yes | API key for authentication |

**Request Body (multipart/form-data):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | Document file (PDF, MD, TXT) |
| `doc_type` | String | No | Document type (default: "general") |
| `company_id` | String | No | Company ID for multi-tenant isolation |

**Document Types:**

- `glossary` - Company terminology and definitions
- `architecture_guide` - System architecture documentation
- `tech_stack` - Technology stack documentation
- `general` - Default for other documents

**Response (201 Created):**

```json
{
  "doc_id": "550e8400-e29b-41d4-a716-446655440000",
  "chunks_count": 42,
  "message": "Successfully ingested document.pdf"
}
```

**Error Responses:**

| Status | Description                                         |
| ------ | --------------------------------------------------- |
| 400    | Validation error (invalid file type, size, content) |
| 401    | Missing or invalid API key                          |
| 429    | Rate limit exceeded                                 |
| 500    | Internal server error                               |

**Example:**

```bash
curl -X POST http://localhost:8000/api/v1/rag/ingest \
  -H "X-API-Key: your_api_key" \
  -F "file=@architecture.pdf" \
  -F "doc_type=architecture_guide" \
  -F "company_id=acme-corp"
```

---

### Search

#### Search Knowledge Base

Search for relevant document chunks.

```
POST /api/v1/rag/search
```

**Request Body (JSON):**

```json
{
  "query": "string",
  "top_k": 5,
  "company_id": "string",
  "doc_type": "string",
  "score_threshold": 0.5
}
```

| Field             | Type    | Required | Default | Description                    |
| ----------------- | ------- | -------- | ------- | ------------------------------ |
| `query`           | String  | Yes      | -       | Search query (1-1000 chars)    |
| `top_k`           | Integer | No       | 5       | Number of results (1-20)       |
| `company_id`      | String  | No       | null    | Filter by company              |
| `doc_type`        | String  | No       | null    | Filter by document type        |
| `score_threshold` | Float   | No       | 0.5     | Minimum similarity score (0-1) |

**Response (200 OK):**

```json
{
  "chunks": [
    {
      "text": "Relevant text from the document...",
      "source": "architecture.pdf",
      "score": 0.92,
      "doc_type": "architecture_guide"
    },
    {
      "text": "Another relevant chunk...",
      "source": "glossary.md",
      "score": 0.87,
      "doc_type": "glossary"
    }
  ],
  "query": "user authentication flow"
}
```

**Error Responses:**

| Status | Description                                |
| ------ | ------------------------------------------ |
| 422    | Validation error (invalid parameters)      |
| 429    | Rate limit exceeded                        |
| 503    | Service unavailable (graceful degradation) |

**Example:**

```bash
curl -X POST http://localhost:8000/api/v1/rag/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "how does authentication work",
    "top_k": 3,
    "company_id": "acme-corp"
  }'
```

---

### Statistics

#### Get Knowledge Base Stats

Get statistics about the knowledge base.

```
GET /api/v1/rag/stats
```

**Response (200 OK):**

```json
{
  "collection": "archigram_v1",
  "vectors_count": 1234,
  "points_count": 1234,
  "status": "green"
}
```

**Example:**

```bash
curl http://localhost:8000/api/v1/rag/stats
```

---

## Rate Limits

| Endpoint             | Limit              |
| -------------------- | ------------------ |
| `/api/v1/rag/ingest` | 10 requests/minute |
| `/api/v1/rag/search` | 60 requests/minute |

Rate limits are per IP address.

## Error Response Format

All error responses follow this format:

```json
{
  "detail": "Error message describing the issue"
}
```

## Graceful Degradation

The search endpoint returns `503 Service Unavailable` when:

- Qdrant is unreachable
- Embedding model fails
- Request times out

This allows the frontend to fall back to non-RAG diagram generation.

## SDK Usage (TypeScript)

Use the provided RAG client for frontend integration:

```typescript
import { ragSearch, formatRAGContext, isRAGEnabled } from './services/ragClient';

// Check if RAG is enabled
if (isRAGEnabled()) {
  // Search for context
  const result = await ragSearch('user authentication', {
    topK: 5,
    companyId: 'acme-corp',
  });

  // Format for AI prompt
  const context = formatRAGContext(result.chunks);
}
```

## cURL Examples

### Complete Workflow

```bash
# 1. Check service health
curl http://localhost:8000/health/ready

# 2. Ingest a document
curl -X POST http://localhost:8000/api/v1/rag/ingest \
  -H "X-API-Key: your_api_key" \
  -F "file=@docs/architecture.md" \
  -F "doc_type=architecture_guide"

# 3. Verify ingestion
curl http://localhost:8000/api/v1/rag/stats

# 4. Search for content
curl -X POST http://localhost:8000/api/v1/rag/search \
  -H "Content-Type: application/json" \
  -d '{"query": "microservices architecture", "top_k": 3}'
```
