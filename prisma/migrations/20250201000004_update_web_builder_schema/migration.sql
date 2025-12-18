-- Migration: Update Web Builder Schema (FAZ 3)
-- Add SEO fields and publishing support to Page model
-- Add tenant support to Template model

-- Add SEO and publishing fields to Page
ALTER TABLE "Page" ADD COLUMN IF NOT EXISTS "metaTitle" TEXT;
ALTER TABLE "Page" ADD COLUMN IF NOT EXISTS "metaDescription" TEXT;
ALTER TABLE "Page" ADD COLUMN IF NOT EXISTS "metaKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Page" ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3);

-- Update status enum to include 'archived'
-- Note: SQLite doesn't support enum types, so this is handled at application level

-- Add tenant support to Template
ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS "isPublic" BOOLEAN DEFAULT false;
ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;

-- Create indexes
CREATE INDEX IF NOT EXISTS "Page_status_idx" ON "Page"("status");
CREATE INDEX IF NOT EXISTS "Page_publishedAt_idx" ON "Page"("publishedAt");
CREATE INDEX IF NOT EXISTS "Template_tenantId_idx" ON "Template"("tenantId");
CREATE INDEX IF NOT EXISTS "Template_isPublic_idx" ON "Template"("isPublic");
CREATE INDEX IF NOT EXISTS "Template_isActive_idx" ON "Template"("isActive");



