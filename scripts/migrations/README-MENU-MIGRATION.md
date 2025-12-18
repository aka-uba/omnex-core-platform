# Menu Management System Migration

## Overview

This migration adds the WordPress-style menu management system to the tenant database schema.

## Tables Created

1. **menus** - Menu definitions
2. **menu_items** - Menu items with multi-language support
3. **menu_locations** - Menu locations (sidebar, top, mobile, footer)
4. **menu_location_assignments** - Menu-to-location assignments with priority system
5. **footer_customizations** - Footer customization settings

## How to Run

### Option 1: Using psql (Recommended)

```bash
# For a specific tenant database
psql -U postgres -d tenant_omnexcore_2025 -f scripts/migrations/menu-management-system.sql

# For all tenant databases (run for each tenant)
psql -U postgres -d tenant_acme_2025 -f scripts/migrations/menu-management-system.sql
```

### Option 2: Using Prisma

```bash
# Generate Prisma client
npx prisma generate --schema=prisma/tenant.schema.prisma

# Push schema changes (development only)
npx prisma db push --schema=prisma/tenant.schema.prisma
```

### Option 3: Using Node.js Script

Create a script to run the migration on all tenant databases:

```javascript
// scripts/run-menu-migration.js
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function runMigration(tenantDbUrl) {
  const prisma = new PrismaClient({
    datasources: { db: { url: tenantDbUrl } }
  });
  
  const sql = fs.readFileSync(
    path.join(__dirname, 'migrations/menu-management-system.sql'),
    'utf8'
  );
  
  await prisma.$executeRawUnsafe(sql);
  await prisma.$disconnect();
}

// Run for each tenant
// Example: runMigration('postgresql://postgres@localhost:5432/tenant_omnexcore_2025');
```

## Default Menu Locations

The migration automatically creates 5 default menu locations:

1. **sidebar** - Main sidebar navigation (max depth: 3)
2. **top** - Top horizontal navigation (max depth: 2)
3. **mobile** - Mobile navigation (max depth: 2)
4. **footer** - Footer primary menu (max depth: 1)
5. **footer-secondary** - Footer secondary menu (max depth: 1)

## Verification

After running the migration, verify the tables were created:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('menus', 'menu_items', 'menu_locations', 'menu_location_assignments', 'footer_customizations');

-- Check default menu locations
SELECT * FROM menu_locations;
```

## Rollback

To rollback this migration:

```sql
-- Drop tables in reverse order (respecting foreign keys)
DROP TABLE IF EXISTS "menu_location_assignments" CASCADE;
DROP TABLE IF EXISTS "menu_items" CASCADE;
DROP TABLE IF EXISTS "menu_locations" CASCADE;
DROP TABLE IF EXISTS "footer_customizations" CASCADE;
DROP TABLE IF EXISTS "menus" CASCADE;
```

## Next Steps

After running the migration:

1. Generate Prisma client: `npx prisma generate --schema=prisma/tenant.schema.prisma`
2. Restart your application
3. Access menu management at `/settings/menu-management`
4. Create your first menu and assign it to locations

## Notes

- This migration is idempotent (safe to run multiple times)
- Foreign key constraints are added with CASCADE delete
- All JSONB fields support multi-language content
- Indexes are created for optimal query performance
