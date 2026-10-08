#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# ListedWheels Database Restore Script
# Restores a PostgreSQL custom dump into target database.
# =============================================================================

BACKUP_FILE="${1:-}"

if [ -z "${BACKUP_FILE}" ]; then
  echo "Usage: ./restore_db.sh <path_to_backup_file.sql.gz>"
  exit 1
fi

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "Error: Backup file ${BACKUP_FILE} not found!"
  exit 1
fi

echo "[$(date -u)] WARNING: This will overwrite data in ${POSTGRES_DB:-listedwheels_db}!"
read -p "Are you sure you want to proceed with database restore? (y/N): " CONFIRM
if [[ "${CONFIRM}" != "y" && "${CONFIRM}" != "Y" ]]; then
  echo "Restore aborted."
  exit 0
fi

echo "[$(date -u)] Starting database restore from ${BACKUP_FILE}..."

PGPASSWORD="${POSTGRES_PASSWORD}" pg_restore \
  -h "${POSTGRES_HOST:-localhost}" \
  -p "${POSTGRES_PORT:-5432}" \
  -U "${POSTGRES_USER:-listedwheels_admin}" \
  -d "${POSTGRES_DB:-listedwheels_db}" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  "${BACKUP_FILE}"

echo "[$(date -u)] Database restore completed successfully!"
