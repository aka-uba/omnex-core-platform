#!/bin/bash
# ============================================
# Omnex Core Platform - Restore from Backup
# ============================================
# Run as deploy user: sudo -u deploy bash 03-restore-backup.sh /path/to/backup.tar.gz

set -e

echo "============================================"
echo "Omnex Core Platform - Restore Backup"
echo "============================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() { echo -e "${GREEN}[OK]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

BACKUP_FILE="$1"
APP_DIR="/opt/omnex"
DEPLOY_DIR="$APP_DIR/deploy"
TEMP_DIR="/tmp/omnex-restore"

# ============================================
# 1. Validate backup file
# ============================================
echo ""
echo "1. Validating backup file..."

if [ -z "$BACKUP_FILE" ]; then
    print_error "Usage: $0 /path/to/backup.tar.gz"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    print_error "Backup file not found: $BACKUP_FILE"
    exit 1
fi

print_status "Backup file found: $BACKUP_FILE"

# ============================================
# 2. Extract backup
# ============================================
echo ""
echo "2. Extracting backup..."

rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"
print_status "Backup extracted to $TEMP_DIR"

ls -la "$TEMP_DIR"

# ============================================
# 3. Load environment variables
# ============================================
echo ""
echo "3. Loading environment..."

source "$DEPLOY_DIR/.env"

# ============================================
# 4. Restore database
# ============================================
echo ""
echo "4. Restoring database..."

cd "$DEPLOY_DIR"

# Find database dump files
DB_DUMPS=$(find "$TEMP_DIR" -name "*.sql" -o -name "*.dump" 2>/dev/null)

if [ -n "$DB_DUMPS" ]; then
    for dump in $DB_DUMPS; do
        DB_NAME=$(basename "$dump" | sed 's/\.[^.]*$//')
        echo "Restoring database: $DB_NAME from $dump"

        if [[ "$dump" == *.sql ]]; then
            # SQL format
            docker compose exec -T postgres psql -U "$PG_USER" -d postgres -c "DROP DATABASE IF EXISTS \"$DB_NAME\";" 2>/dev/null || true
            docker compose exec -T postgres psql -U "$PG_USER" -d postgres -c "CREATE DATABASE \"$DB_NAME\";"
            docker compose exec -T postgres psql -U "$PG_USER" -d "$DB_NAME" < "$dump"
        else
            # Custom format
            docker compose exec -T postgres pg_restore -U "$PG_USER" -d postgres --clean --create "$dump" 2>/dev/null || \
            docker compose exec -T postgres pg_restore -U "$PG_USER" -d "$DB_NAME" "$dump"
        fi

        print_status "Database $DB_NAME restored"
    done
else
    print_warning "No database dumps found in backup"
fi

# ============================================
# 5. Restore storage files
# ============================================
echo ""
echo "5. Restoring storage files..."

STORAGE_DIR=$(find "$TEMP_DIR" -type d -name "storage" 2>/dev/null | head -1)
UPLOADS_DIR=$(find "$TEMP_DIR" -type d -name "uploads" 2>/dev/null | head -1)

if [ -n "$STORAGE_DIR" ]; then
    # Get the app container volume path
    docker compose cp "$STORAGE_DIR/." app:/app/storage/
    print_status "Storage files restored"
else
    print_warning "No storage directory found in backup"
fi

if [ -n "$UPLOADS_DIR" ]; then
    docker compose cp "$UPLOADS_DIR/." app:/app/public/uploads/
    print_status "Upload files restored"
else
    print_warning "No uploads directory found in backup"
fi

# ============================================
# 6. Run Prisma migrations
# ============================================
echo ""
echo "6. Running database migrations..."

docker compose exec app npx prisma migrate deploy --schema=prisma/tenant.schema.prisma 2>/dev/null || \
    print_warning "Tenant migration skipped (may not exist yet)"

docker compose exec app npx prisma migrate deploy --schema=prisma/core.schema.prisma 2>/dev/null || \
    print_warning "Core migration skipped (may not exist yet)"

print_status "Migrations complete"

# ============================================
# 7. Restart application
# ============================================
echo ""
echo "7. Restarting application..."

docker compose restart app
sleep 5

print_status "Application restarted"

# ============================================
# 8. Cleanup
# ============================================
echo ""
echo "8. Cleaning up..."

rm -rf "$TEMP_DIR"
print_status "Temporary files cleaned"

# ============================================
# Summary
# ============================================
echo ""
echo "============================================"
echo -e "${GREEN}Restore Complete!${NC}"
echo "============================================"
echo ""
echo "Please verify:"
echo "1. Application is accessible: https://$DOMAIN"
echo "2. Login works correctly"
echo "3. Data is present"
echo ""
echo "Check logs if issues occur:"
echo "  docker compose logs -f app"
