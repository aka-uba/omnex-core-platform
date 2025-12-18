#!/bin/bash

# Export Tenant Script
# Exports tenant database and files to a tar.gz package
# Usage: ./scripts/export-tenant.sh --tenant=acme --year=2025

set -e

TENANT=""
YEAR=""
OUTPUT_DIR="./exports"

# Parse arguments
for arg in "$@"; do
  case $arg in
    --tenant=*)
      TENANT="${arg#*=}"
      shift
      ;;
    --year=*)
      YEAR="${arg#*=}"
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
if [ -z "$TENANT" ]; then
  echo "Error: --tenant is required"
  echo "Usage: ./scripts/export-tenant.sh --tenant=acme [--year=2025] [--output=./exports]"
  exit 1
fi

# Set default year if not provided
if [ -z "$YEAR" ]; then
  YEAR=$(date +%Y)
fi

DB_NAME="tenant_${TENANT}_${YEAR}"
EXPORT_DIR="${OUTPUT_DIR}/${TENANT}_${YEAR}"
EXPORT_FILE="${OUTPUT_DIR}/${TENANT}_${YEAR}.tar.gz"

echo "🚀 Exporting tenant: $TENANT (year: $YEAR)"
echo "   Database: $DB_NAME"
echo "   Output: $EXPORT_FILE"

# Create export directory
mkdir -p "$EXPORT_DIR"
mkdir -p "$EXPORT_DIR/files"

# 1. Export database
echo "📦 Exporting database..."
PGPASSWORD="${PGPASSWORD:-$PG_PASSWORD}" pg_dump \
  -h "${PG_HOST:-localhost}" \
  -p "${PG_PORT:-5432}" \
  -U "${PG_USER:-postgres}" \
  -d "$DB_NAME" \
  -F p \
  -f "$EXPORT_DIR/db-dump.sql"

if [ $? -ne 0 ]; then
  echo "❌ Database export failed"
  exit 1
fi

echo "✅ Database exported"

# 2. Copy files (if storage is local)
STORAGE_TYPE="${STORAGE_TYPE:-local}"
if [ "$STORAGE_TYPE" = "local" ]; then
  STORAGE_PATH="${STORAGE_LOCAL_PATH:-./storage/tenants}"
  TENANT_STORAGE="${STORAGE_PATH}/${TENANT}"
  
  if [ -d "$TENANT_STORAGE" ]; then
    echo "📁 Copying files..."
    cp -r "$TENANT_STORAGE"/* "$EXPORT_DIR/files/" 2>/dev/null || true
    echo "✅ Files copied"
  else
    echo "⚠️  Storage directory not found: $TENANT_STORAGE"
  fi
else
  echo "ℹ️  S3 storage detected, files should be exported separately"
fi

# 3. Create meta.json
echo "📝 Creating metadata..."
cat > "$EXPORT_DIR/meta.json" <<EOF
{
  "tenant": "$TENANT",
  "year": $YEAR,
  "schema_version": "1.0.0",
  "exported_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "database": "$DB_NAME",
  "storage_type": "$STORAGE_TYPE"
}
EOF

echo "✅ Metadata created"

# 4. Create tar.gz archive
echo "📦 Creating archive..."
cd "$OUTPUT_DIR"
tar -czf "${TENANT}_${YEAR}.tar.gz" "${TENANT}_${YEAR}"
cd - > /dev/null

# 5. Cleanup temporary directory
rm -rf "$EXPORT_DIR"

echo ""
echo "✅ Export completed successfully!"
echo "   Archive: $EXPORT_FILE"
echo "   Size: $(du -h "$EXPORT_FILE" | cut -f1)"


