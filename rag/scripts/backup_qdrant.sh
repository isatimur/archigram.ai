#!/bin/bash
#
# Qdrant Backup Script for ArchiGram.ai RAG
#
# Usage:
#   ./backup_qdrant.sh                    # Backup to default location
#   ./backup_qdrant.sh /path/to/backup    # Backup to custom location
#
# Environment Variables:
#   QDRANT_URL    - Qdrant server URL (default: http://localhost:6333)
#   COLLECTION    - Collection name (default: archigram_v1)
#

set -euo pipefail

# Configuration
QDRANT_URL="${QDRANT_URL:-http://localhost:6333}"
COLLECTION="${COLLECTION:-archigram_v1}"
BACKUP_DIR="${1:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Qdrant is healthy
check_health() {
    log_info "Checking Qdrant health..."
    if ! curl -sf "${QDRANT_URL}/health" > /dev/null; then
        log_error "Qdrant is not healthy at ${QDRANT_URL}"
        exit 1
    fi
    log_info "Qdrant is healthy"
}

# Check if collection exists
check_collection() {
    log_info "Checking collection ${COLLECTION}..."
    if ! curl -sf "${QDRANT_URL}/collections/${COLLECTION}" > /dev/null; then
        log_error "Collection ${COLLECTION} does not exist"
        exit 1
    fi
    log_info "Collection exists"
}

# Get collection stats
get_stats() {
    log_info "Collection statistics:"
    curl -s "${QDRANT_URL}/collections/${COLLECTION}" | jq '.result | {vectors_count, points_count, status}'
}

# Create snapshot
create_snapshot() {
    log_info "Creating snapshot for collection ${COLLECTION}..."

    RESPONSE=$(curl -sf -X POST "${QDRANT_URL}/collections/${COLLECTION}/snapshots")
    SNAPSHOT_NAME=$(echo "${RESPONSE}" | jq -r '.result.name')

    if [ -z "${SNAPSHOT_NAME}" ] || [ "${SNAPSHOT_NAME}" = "null" ]; then
        log_error "Failed to create snapshot"
        echo "${RESPONSE}"
        exit 1
    fi

    log_info "Snapshot created: ${SNAPSHOT_NAME}"
    echo "${SNAPSHOT_NAME}"
}

# Download snapshot
download_snapshot() {
    local SNAPSHOT_NAME="$1"
    local OUTPUT_FILE="${BACKUP_DIR}/qdrant_${COLLECTION}_${TIMESTAMP}.snapshot"

    log_info "Downloading snapshot to ${OUTPUT_FILE}..."
    mkdir -p "${BACKUP_DIR}"

    curl -sf "${QDRANT_URL}/collections/${COLLECTION}/snapshots/${SNAPSHOT_NAME}" -o "${OUTPUT_FILE}"

    log_info "Snapshot downloaded: ${OUTPUT_FILE}"
    log_info "Size: $(du -h "${OUTPUT_FILE}" | cut -f1)"
    echo "${OUTPUT_FILE}"
}

# Delete old snapshots from Qdrant
cleanup_remote_snapshots() {
    log_info "Cleaning up remote snapshots..."

    SNAPSHOTS=$(curl -sf "${QDRANT_URL}/collections/${COLLECTION}/snapshots" | jq -r '.result[].name')

    for snapshot in ${SNAPSHOTS}; do
        log_info "Deleting remote snapshot: ${snapshot}"
        curl -sf -X DELETE "${QDRANT_URL}/collections/${COLLECTION}/snapshots/${snapshot}" > /dev/null
    done

    log_info "Remote snapshots cleaned up"
}

# Cleanup old local backups (keep last 5)
cleanup_local_backups() {
    local KEEP_COUNT=5
    log_info "Cleaning up old local backups (keeping last ${KEEP_COUNT})..."

    if [ -d "${BACKUP_DIR}" ]; then
        local COUNT=$(ls -1 "${BACKUP_DIR}"/qdrant_*.snapshot 2>/dev/null | wc -l)
        if [ "${COUNT}" -gt "${KEEP_COUNT}" ]; then
            ls -1t "${BACKUP_DIR}"/qdrant_*.snapshot | tail -n +$((KEEP_COUNT + 1)) | xargs rm -f
            log_info "Removed $((COUNT - KEEP_COUNT)) old backups"
        fi
    fi
}

# Main execution
main() {
    log_info "Starting Qdrant backup..."
    log_info "Qdrant URL: ${QDRANT_URL}"
    log_info "Collection: ${COLLECTION}"
    log_info "Backup directory: ${BACKUP_DIR}"

    check_health
    check_collection
    get_stats

    SNAPSHOT_NAME=$(create_snapshot)
    OUTPUT_FILE=$(download_snapshot "${SNAPSHOT_NAME}")

    cleanup_remote_snapshots
    cleanup_local_backups

    log_info "Backup completed successfully!"
    log_info "Backup file: ${OUTPUT_FILE}"
}

main
