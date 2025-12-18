-- AlterTable: Add new columns to MaintenanceRecord
-- First add nullable columns
ALTER TABLE "MaintenanceRecord" ADD COLUMN IF NOT EXISTS "locationId" TEXT;
ALTER TABLE "MaintenanceRecord" ADD COLUMN IF NOT EXISTS "type" TEXT;
ALTER TABLE "MaintenanceRecord" ADD COLUMN IF NOT EXISTS "title" TEXT;
ALTER TABLE "MaintenanceRecord" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "MaintenanceRecord" ADD COLUMN IF NOT EXISTS "status" TEXT;
ALTER TABLE "MaintenanceRecord" ADD COLUMN IF NOT EXISTS "scheduledDate" TIMESTAMP(3);
ALTER TABLE "MaintenanceRecord" ADD COLUMN IF NOT EXISTS "startDate" TIMESTAMP(3);
ALTER TABLE "MaintenanceRecord" ADD COLUMN IF NOT EXISTS "endDate" TIMESTAMP(3);
ALTER TABLE "MaintenanceRecord" ADD COLUMN IF NOT EXISTS "assignedTo" TEXT;
ALTER TABLE "MaintenanceRecord" ADD COLUMN IF NOT EXISTS "performedBy" TEXT;
ALTER TABLE "MaintenanceRecord" ADD COLUMN IF NOT EXISTS "estimatedCost" DECIMAL(65,30);
ALTER TABLE "MaintenanceRecord" ADD COLUMN IF NOT EXISTS "actualCost" DECIMAL(65,30);
ALTER TABLE "MaintenanceRecord" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "MaintenanceRecord" ADD COLUMN IF NOT EXISTS "documents" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "MaintenanceRecord" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN;

-- Set default values for existing records (if any)
UPDATE "MaintenanceRecord" SET 
  "locationId" = (SELECT "id" FROM "Location" LIMIT 1),
  "type" = 'preventive',
  "title" = 'Maintenance Record',
  "status" = 'scheduled',
  "scheduledDate" = CURRENT_TIMESTAMP,
  "isActive" = true
WHERE "locationId" IS NULL OR "type" IS NULL OR "title" IS NULL OR "status" IS NULL OR "scheduledDate" IS NULL OR "isActive" IS NULL;

-- Now make required columns NOT NULL
ALTER TABLE "MaintenanceRecord" ALTER COLUMN "locationId" SET NOT NULL;
ALTER TABLE "MaintenanceRecord" ALTER COLUMN "type" SET NOT NULL;
ALTER TABLE "MaintenanceRecord" ALTER COLUMN "title" SET NOT NULL;
ALTER TABLE "MaintenanceRecord" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "MaintenanceRecord" ALTER COLUMN "scheduledDate" SET NOT NULL;
ALTER TABLE "MaintenanceRecord" ALTER COLUMN "isActive" SET NOT NULL;

-- Set default values for future inserts
ALTER TABLE "MaintenanceRecord" ALTER COLUMN "status" SET DEFAULT 'scheduled';
ALTER TABLE "MaintenanceRecord" ALTER COLUMN "isActive" SET DEFAULT true;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MaintenanceRecord_locationId_idx" ON "MaintenanceRecord"("locationId");
CREATE INDEX IF NOT EXISTS "MaintenanceRecord_status_idx" ON "MaintenanceRecord"("status");
CREATE INDEX IF NOT EXISTS "MaintenanceRecord_scheduledDate_idx" ON "MaintenanceRecord"("scheduledDate");

-- AddForeignKey
ALTER TABLE "MaintenanceRecord" DROP CONSTRAINT IF EXISTS "MaintenanceRecord_locationId_fkey";
ALTER TABLE "MaintenanceRecord" ADD CONSTRAINT "MaintenanceRecord_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Update Location table to add maintenanceRecords relation (if not exists)
-- This is handled by Prisma automatically, but we ensure the relation exists

