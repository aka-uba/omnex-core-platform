-- Add missing Agency table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Agency') THEN
        CREATE TABLE "Agency" (
            "id" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "email" TEXT,
            "phone" TEXT,
            "address" TEXT,
            "website" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,

            CONSTRAINT "Agency_pkey" PRIMARY KEY ("id")
        );

        -- Create unique index on email
        CREATE UNIQUE INDEX "Agency_email_key" ON "Agency"("email") WHERE "email" IS NOT NULL;
        CREATE INDEX "Agency_name_idx" ON "Agency"("name");
        CREATE INDEX "Agency_email_idx" ON "Agency"("email") WHERE "email" IS NOT NULL;
    END IF;
END $$;

-- Add missing columns to AuditLog table with default values
-- First, add module column with default value
ALTER TABLE "AuditLog" 
ADD COLUMN IF NOT EXISTS "module" TEXT NOT NULL DEFAULT 'system';

-- Add status column with default value
ALTER TABLE "AuditLog" 
ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'SUCCESS';

-- Create indexes for new columns if they don't exist
CREATE INDEX IF NOT EXISTS "AuditLog_module_idx" ON "AuditLog"("module");
CREATE INDEX IF NOT EXISTS "AuditLog_status_idx" ON "AuditLog"("status");

-- Add foreign key constraint for Agency if Tenant table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Tenant') THEN
        -- Add agencyId column to Tenant if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Tenant' AND column_name = 'agencyId') THEN
            ALTER TABLE "Tenant" ADD COLUMN "agencyId" TEXT;
        END IF;
        
        -- Add foreign key constraint if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'Tenant_agencyId_fkey'
        ) THEN
            ALTER TABLE "Tenant" 
            ADD CONSTRAINT "Tenant_agencyId_fkey" 
            FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
        
        -- Create index if it doesn't exist
        CREATE INDEX IF NOT EXISTS "Tenant_agencyId_idx" ON "Tenant"("agencyId");
    END IF;
END $$;

