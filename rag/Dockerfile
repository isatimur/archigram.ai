# RAG Service Dockerfile
# Multi-stage build for production deployment

# ======================
# Stage 1: Builder
# ======================
FROM python:3.11-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for caching
COPY requirements.txt .

# Create virtual environment and install dependencies
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ======================
# Stage 2: Production
# ======================
FROM python:3.11-slim AS production

WORKDIR /app

# Install runtime dependencies only
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r rag && useradd -r -g rag rag

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy application code
COPY --chown=rag:rag . .

# Create directories for models, logs, and HuggingFace cache
RUN mkdir -p /app/models /app/logs /home/rag/.cache/huggingface && \
    chown -R rag:rag /app /home/rag

# Switch to non-root user
USER rag

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV RAG_LOG_LEVEL=INFO
ENV HF_HOME=/home/rag/.cache/huggingface
ENV TRANSFORMERS_CACHE=/home/rag/.cache/huggingface
ENV SENTENCE_TRANSFORMERS_HOME=/app/models

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=15s --timeout=5s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/health/ready || exit 1

# Start the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
