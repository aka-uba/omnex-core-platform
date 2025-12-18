#!/bin/bash

# Import Tenant Script
# Imports tenant database and files from a tar.gz package
# Usage: ./scripts/import-tenant.sh --file=acme_2025.tar.gz [--restore-db=tenant_acme_2025_restore]

set -e

EXPORT_FILE=""
RESTORE_DB=""
OUTPUT_DIR="./exports"

# Parse arguments
for arg in "$@"; do
  case $arg in
    --file=*)
      EXPORT_FILE="${arg#*=}"
      shift
      ;;
    --restore-db=*)
      RESTORE_DB="${arg#*=}"
      shift
      ;;
    --output=*)
      OUTPUT_DIR="${arg#*=}"
      shift
      ;;
    *)
      echo "Unknown option: $arg"
      exit 1
      ;;
  esac
done

# Validate required arguments
if [ -z "$EXPORT_FILE" ]; then
  echo "Error: --file is required"
  echo "Usage: ./scripts/import-tenant.sh --file=acme_2025.tar.gz [--restore-db=tenant_acme_2025_restore]"
  exit 1
fi

if [ ! -f "$EXPORT_FILE" ]; then
  echo "Error: Export file not found: $EXPORT_FILE"
  exit 1
fi

# Extract archive
EXTRACT_DIR="${OUTPUT_DIR}/$(basename "$EXPORT_FILE" .tar.gz)"
echo "📦 Extracting archive..."
mkdir -p "$EXTRACT_DIR"
tar -xzf "$EXPORT_FILE" -C "$OUTPUT_DIR"

# Read metadata
META_FILE="$EXTRACT_DIR/meta.json"
if [ ! -f "$META_FILE" ]; then
  echo "❌ Error: meta.json not found in archive"
  exit 1
fi

TENANT=$(jq -r '.tenant' "$META_FILE")
YEAR=$(jq -r '.year' "$META_FILE")
DB_NAME=$(jq -r '.database' "$META_FILE")
STORAGE_TYPE=$(jq -r '.storage_type' "$META_FILE")

if [ -z "$RESTORE_DB" ]; then
  RESTORE_DB="${DB_NAME}_restore"
fi

echo "📝 Importing tenant: $TENANT (year: $YEAR)"
echo "   Source DB: $DB_NAME"
echo "   Restore DB: $RESTORE_DB"

# 1. Create restore database
echo "🗄️  Creating restore database..."
PGPASSWORD="${PGPASSWORD:-$PG_PASSWORD}" psql \
  -h "${PG_HOST:-localhost}" \
  -p "${PG_PORT:-5432}" \
  -U "${PG_USER:-postgres}" \
  -d postgres \
  -c "DROP DATABASE IF EXISTS $RESTORE_DB;" \
  -c "CREATE DATABASE $RESTORE_DB;"

if [ $? -ne 0 ]; then
  echo "❌ Failed to create restore database"
  exit 1
fi

echo "✅ Restore database created"

# 2. Import database
echo "📦 Importing database..."
PGPASSWORD="${PGPASSWORD:-$PG_PASSWORD}" psql \
  -h "${PG_HOST:-localhost}" \
  -p "${PG_PORT:-5432}" \
  -U "${PG_USER:-postgres}" \
  -d "$RESTORE_DB" \
  -f "$EXTRACT_DIR/db-dump.sql"

if [ $? -ne 0 ]; then
  echo "❌ Database import failed"
  exit 1
fi

echo "✅ Database imported"

# 3. Restore files (if storage is local)
if [ "$STORAGE_TYPE" = "local" ]; then
  STORAGE_PATH="${STORAGE_LOCAL_PATH:-./storage/tenants}"
  TENANT_STORAGE="${STORAGE_PATH}/${TENANT}"
  
  if [ -d "$EXTRACT_DIR/files" ] && [ "$(ls -A $EXTRACT_DIR/files 2>/dev/null)" ]; then
    echo "📁 Restoring files..."
    mkdir -p "$TENANT_STORAGE"
    cp -r "$EXTRACT_DIR/files"/* "$TENANT_STORAGE/" 2>/dev/null || true
    echo "✅ Files restored to: $TENANT_STORAGE"
  else
    echo "⚠️  No files to restore"
  fi
else
  echo "ℹ️  S3 storage detected, files should be imported separately"
fi

# 4. Cleanup
rm -rf "$EXTRACT_DIR"

echo ""
echo "✅ Import completed successfully!"
echo "   Restore database: $RESTORE_DB"
echo ""
echo "📝 Next steps:"
echo "   1. Verify data in restore database: $RESTORE_DB"
echo "   2. Update tenant configuration if needed"
echo "   3. Run migrations if schema changed: TENANT_DATABASE_URL=\"...\" npx prisma migrate deploy --schema=prisma/tenant.schema.prisma"


