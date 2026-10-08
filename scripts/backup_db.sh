#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# ListedWheels Automated PostgreSQL Backup Script
# Creates a compressed, timestamped dump and uploads to encrypted S3 backup vault.
# =============================================================================

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/tmp/backups"
BACKUP_FILE="listedwheels_db_${TIMESTAMP}.sql.gz"
S3_BUCKET=${BACKUP_S3_BUCKET:-"listedwheels-backups-ap-south-1"}

mkdir -p "${BACKUP_DIR}"

echo "[$(date -u)] Starting database backup for ListedWheels..."

PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
  -h "${POSTGRES_HOST:-localhost}" \
  -p "${POSTGRES_PORT:-5432}" \
  -U "${POSTGRES_USER:-listedwheels_admin}" \
  -d "${POSTGRES_DB:-listedwheels_db}" \
  --format=custom \
  --compress=9 \
  --file="${BACKUP_DIR}/${BACKUP_FILE}"

echo "[$(date -u)] Backup created locally: ${BACKUP_DIR}/${BACKUP_FILE}"

# Upload to S3 with Server-Side Encryption (KMS)
if command -v aws >/dev/null 2>&1; then
  echo "[$(date -u)] Uploading backup to S3 bucket s3://${S3_BUCKET}/db-backups/..."
  aws s3 cp "${BACKUP_DIR}/${BACKUP_FILE}" "s3://${S3_BUCKET}/db-backups/${BACKUP_FILE}" --sse aws:kms
  echo "[$(date -u)] S3 backup upload complete!"
fi

# Clean up local file
rm -f "${BACKUP_DIR}/${BACKUP_FILE}"
echo "[$(date -u)] Database backup process completed successfully."
