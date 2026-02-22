# RAG Service Runbook

This runbook provides procedures for common operational scenarios and incident response for the ArchiGram.ai RAG service.

## Table of Contents

- [Service Overview](#service-overview)
- [Health Monitoring](#health-monitoring)
- [Common Incidents](#common-incidents)
- [Recovery Procedures](#recovery-procedures)
- [Scaling](#scaling)
- [Maintenance](#maintenance)

## Service Overview

### Components

| Component | Port | Purpose                           |
| --------- | ---- | --------------------------------- |
| RAG API   | 8000 | FastAPI backend for ingest/search |
| Qdrant    | 6333 | Vector database                   |
| ArchiGram | 3000 | Frontend application              |

### Dependencies

```
ArchiGram Frontend
       │
       ▼ (optional, graceful degradation)
    RAG API ──────► Qdrant
       │
       ▼
  Embedding Model (local or cloud)
```

### Health Endpoints

| Endpoint            | Purpose   | Expected Response                      |
| ------------------- | --------- | -------------------------------------- |
| `GET /health`       | Liveness  | `{"status": "healthy"}`                |
| `GET /health/ready` | Readiness | `{"status": "ready", "checks": {...}}` |

## Health Monitoring

### Check All Services

```bash
# Check RAG API
curl -s http://localhost:8000/health/ready | jq

# Check Qdrant
curl -s http://localhost:6333/health | jq

# Check Docker containers
docker compose --profile rag ps
```

### Log Analysis

```bash
# View RAG API logs
docker compose logs -f rag

# View Qdrant logs
docker compose logs -f qdrant

# Filter for errors
docker compose logs rag | grep -i error
```

### Metrics to Watch

- **Search latency p95**: Should be < 500ms
- **Ingest success rate**: Should be > 99%
- **Qdrant memory usage**: Watch for growth
- **Error rate in logs**: Should be minimal

## Common Incidents

### INC-001: RAG Service Not Responding

**Symptoms:**

- 503 errors from RAG API
- Frontend shows "RAG unavailable" warnings

**Diagnosis:**

```bash
# Check container status
docker compose ps rag

# Check logs
docker compose logs --tail=100 rag

# Test health endpoint
curl http://localhost:8000/health
```

**Resolution:**

1. If container is not running:

   ```bash
   docker compose --profile rag up -d rag
   ```

2. If OOM killed:

   ```bash
   # Increase memory limits in docker-compose.yml
   # Then restart
   docker compose --profile rag restart rag
   ```

3. If embedding model failed to load:

   ```bash
   # Check disk space for model cache
   df -h

   # Clear model cache and restart
   docker compose --profile rag down
   docker volume rm archigram_rag_models
   docker compose --profile rag up -d
   ```

### INC-002: Qdrant Connection Failures

**Symptoms:**

- `VectorStoreError: Connection refused` in logs
- Readiness check shows `qdrant: false`

**Diagnosis:**

```bash
# Check Qdrant container
docker compose ps qdrant

# Check Qdrant health
curl http://localhost:6333/health

# Check network connectivity
docker compose exec rag curl http://qdrant:6333/health
```

**Resolution:**

1. If Qdrant is down:

   ```bash
   docker compose --profile rag up -d qdrant
   ```

2. If Qdrant is unhealthy:

   ```bash
   # Check disk space
   docker compose exec qdrant df -h /qdrant/storage

   # Restart Qdrant
   docker compose --profile rag restart qdrant
   ```

### INC-003: High Search Latency

**Symptoms:**

- Search requests timing out
- p95 latency > 5 seconds

**Diagnosis:**

```bash
# Check RAG service load
docker compose exec rag top

# Check Qdrant metrics
curl http://localhost:6333/metrics

# Check collection size
curl http://localhost:8000/api/v1/rag/stats
```

**Resolution:**

1. If first request after restart (cold start):
   - Normal - embedding model is loading
   - Wait for model to fully load

2. If sustained high latency:
   - Reduce `top_k` in search requests
   - Consider cloud embeddings for faster inference
   - Scale Qdrant resources

### INC-004: Ingestion Failures

**Symptoms:**

- 400 or 500 errors on ingest
- Documents not appearing in search results

**Diagnosis:**

```bash
# Check recent ingest attempts in logs
docker compose logs rag | grep -i ingest

# Verify file format
file your-document.pdf

# Test with minimal document
echo "Test content" > test.txt
curl -X POST http://localhost:8000/api/v1/rag/ingest \
  -H "X-API-Key: ${RAG_INGEST_API_KEY}" \
  -F "file=@test.txt" \
  -F "doc_type=general"
```

**Resolution:**

1. If file validation error:
   - Check file extension (.pdf, .md, .txt)
   - Check file size < 10MB
   - Ensure file is not corrupted

2. If embedding error:
   - Check embedding model health
   - For cloud embeddings, verify API key

3. If Qdrant upsert error:
   - Check Qdrant disk space
   - Check collection exists

## Recovery Procedures

### Full Stack Recovery

If all services need to be restarted:

```bash
# Stop all services
docker compose --profile rag down

# Clear potentially corrupted state
# WARNING: This removes all indexed documents
# docker volume rm archigram_qdrant_data

# Start services
docker compose --profile rag up -d

# Wait for readiness
sleep 30
curl http://localhost:8000/health/ready
```

### Data Recovery from Backup

```bash
# List available snapshots
curl http://localhost:6333/collections/archigram_v1/snapshots

# Restore from snapshot
curl -X POST "http://localhost:6333/collections/archigram_v1/snapshots/recover" \
  -H "Content-Type: application/json" \
  -d '{"location": "file:///path/to/snapshot"}'
```

### Re-indexing Documents

If the index is corrupted, you may need to re-ingest all documents:

```bash
# Delete existing collection
curl -X DELETE http://localhost:6333/collections/archigram_v1

# Restart RAG service to recreate collection
docker compose --profile rag restart rag

# Re-ingest documents
for file in /path/to/documents/*; do
  curl -X POST http://localhost:8000/api/v1/rag/ingest \
    -H "X-API-Key: ${RAG_INGEST_API_KEY}" \
    -F "file=@$file" \
    -F "doc_type=general"
done
```

## Scaling

### Vertical Scaling

Increase resources in `docker-compose.yml`:

```yaml
services:
  rag:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G

  qdrant:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
```

### Horizontal Scaling (Future)

For high-traffic deployments:

- Deploy multiple RAG API replicas behind a load balancer
- Use Qdrant cluster mode for distributed storage
- Consider dedicated embedding service

## Maintenance

### Regular Tasks

**Weekly:**

- Review error logs
- Check disk space on volumes
- Monitor search latency trends

**Monthly:**

- Update container images
- Review and rotate API keys
- Backup Qdrant data

### Updating Services

```bash
# Pull latest images
docker compose pull

# Restart with new images
docker compose --profile rag up -d
```

### Log Rotation

Configure Docker log rotation in `/etc/docker/daemon.json`:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

## Contact

For escalations or questions not covered in this runbook:

- Create an issue at https://github.com/archigram-ai/archigram.ai/issues
