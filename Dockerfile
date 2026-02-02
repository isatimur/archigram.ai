# ArchiGram.ai Frontend Dockerfile
# Multi-stage build for production deployment

# ======================
# Stage 1: Dependencies
# ======================
FROM oven/bun:1 AS deps
WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# ======================
# Stage 2: Builder
# ======================
FROM oven/bun:1 AS builder
WORKDIR /app

# Copy dependencies from previous stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments for environment variables
ARG VITE_GEMINI_API_KEY
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_KEY
ARG VITE_PLAUSIBLE_DOMAIN
ARG VITE_RAG_URL
ARG VITE_RAG_ENABLED=false

# Set environment variables for build
ENV VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_KEY=$VITE_SUPABASE_KEY
ENV VITE_PLAUSIBLE_DOMAIN=$VITE_PLAUSIBLE_DOMAIN
ENV VITE_RAG_URL=$VITE_RAG_URL
ENV VITE_RAG_ENABLED=$VITE_RAG_ENABLED

# Build the application
RUN bun run build

# ======================
# Stage 3: Production
# ======================
FROM nginx:alpine AS production

# Create non-root user
RUN addgroup -g 1001 -S archigram && \
    adduser -S archigram -u 1001 -G archigram

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Set ownership
RUN chown -R archigram:archigram /usr/share/nginx/html && \
    chown -R archigram:archigram /var/cache/nginx && \
    chown -R archigram:archigram /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R archigram:archigram /var/run/nginx.pid

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1

# Switch to non-root user
USER archigram

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
