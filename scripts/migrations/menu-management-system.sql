-- ============================================
-- Menu Management System Migration
-- Date: 2025-12-01
-- Description: Adds WordPress-style menu management tables
-- ============================================

-- CreateTable: menus
CREATE TABLE IF NOT EXISTS "menus" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'tr',
    "tenantId" TEXT,
    "createdBy" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable: menu_items
CREATE TABLE IF NOT EXISTS "menu_items" (
    "id" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    "parentId" TEXT,
    "label" JSONB NOT NULL,
    "href" TEXT NOT NULL,
    "icon" TEXT,
    "target" TEXT,
    "cssClass" TEXT,
    "description" JSONB,
    "order" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "moduleSlug" TEXT,
    "menuGroup" TEXT,
    "requiredRole" TEXT,
    "requiredPermission" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable: menu_locations
CREATE TABLE IF NOT EXISTS "menu_locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" JSONB NOT NULL,
    "description" TEXT,
    "layoutType" TEXT NOT NULL,
    "maxDepth" INTEGER NOT NULL DEFAULT 3,
    "tenantId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable: menu_location_assignments
CREATE TABLE IF NOT EXISTS "menu_location_assignments" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    "tenantId" TEXT,
    "assignmentType" TEXT NOT NULL,
    "assignmentId" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_location_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable: footer_customizations
CREATE TABLE IF NOT EXISTS "footer_customizations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyName" TEXT,
    "companyNameMode" TEXT NOT NULL DEFAULT 'dynamic',
    "logo" TEXT,
    "description" JSONB,
    "address" JSONB,
    "phone" TEXT,
    "email" TEXT,
    "socialLinks" JSONB,
    "columns" INTEGER NOT NULL DEFAULT 4,
    "showCopyright" BOOLEAN NOT NULL DEFAULT true,
    "copyrightText" JSONB,
    "primaryMenuId" TEXT,
    "primaryMenuPosition" TEXT NOT NULL DEFAULT 'right',
    "secondaryMenuId" TEXT,
    "secondaryMenuPosition" TEXT NOT NULL DEFAULT 'left',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "footer_customizations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "menus_slug_tenantId_locale_key" ON "menus"("slug", "tenantId", "locale");
CREATE INDEX IF NOT EXISTS "menus_tenantId_idx" ON "menus"("tenantId");
CREATE INDEX IF NOT EXISTS "menus_slug_idx" ON "menus"("slug");
CREATE INDEX IF NOT EXISTS "menus_isActive_idx" ON "menus"("isActive");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "menu_items_menuId_idx" ON "menu_items"("menuId");
CREATE INDEX IF NOT EXISTS "menu_items_parentId_idx" ON "menu_items"("parentId");
CREATE INDEX IF NOT EXISTS "menu_items_order_idx" ON "menu_items"("order");
CREATE INDEX IF NOT EXISTS "menu_items_menuGroup_idx" ON "menu_items"("menuGroup");
CREATE INDEX IF NOT EXISTS "menu_items_visible_idx" ON "menu_items"("visible");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "menu_locations_name_tenantId_key" ON "menu_locations"("name", "tenantId");
CREATE INDEX IF NOT EXISTS "menu_locations_tenantId_idx" ON "menu_locations"("tenantId");
CREATE INDEX IF NOT EXISTS "menu_locations_layoutType_idx" ON "menu_locations"("layoutType");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "menu_location_assignments_locationId_assignmentType_assignme_key" ON "menu_location_assignments"("locationId", "assignmentType", "assignmentId", "tenantId");
CREATE INDEX IF NOT EXISTS "menu_location_assignments_locationId_idx" ON "menu_location_assignments"("locationId");
CREATE INDEX IF NOT EXISTS "menu_location_assignments_menuId_idx" ON "menu_location_assignments"("menuId");
CREATE INDEX IF NOT EXISTS "menu_location_assignments_assignmentType_assignmentId_idx" ON "menu_location_assignments"("assignmentType", "assignmentId");
CREATE INDEX IF NOT EXISTS "menu_location_assignments_tenantId_idx" ON "menu_location_assignments"("tenantId");
CREATE INDEX IF NOT EXISTS "menu_location_assignments_isActive_idx" ON "menu_location_assignments"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "footer_customizations_tenantId_key" ON "footer_customizations"("tenantId");
CREATE INDEX IF NOT EXISTS "footer_customizations_tenantId_idx" ON "footer_customizations"("tenantId");

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'menu_items_menuId_fkey'
    ) THEN
        ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_menuId_fkey" 
        FOREIGN KEY ("menuId") REFERENCES "menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'menu_items_parentId_fkey'
    ) THEN
        ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_parentId_fkey" 
        FOREIGN KEY ("parentId") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'menu_location_assignments_locationId_fkey'
    ) THEN
        ALTER TABLE "menu_location_assignments" ADD CONSTRAINT "menu_location_assignments_locationId_fkey" 
        FOREIGN KEY ("locationId") REFERENCES "menu_locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'menu_location_assignments_menuId_fkey'
    ) THEN
        ALTER TABLE "menu_location_assignments" ADD CONSTRAINT "menu_location_assignments_menuId_fkey" 
        FOREIGN KEY ("menuId") REFERENCES "menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Insert default menu locations
INSERT INTO "menu_locations" ("id", "name", "label", "description", "layoutType", "maxDepth", "isActive", "createdAt", "updatedAt")
VALUES 
    (gen_random_uuid(), 'sidebar', '{"tr": "Kenar Menü", "en": "Sidebar Menu", "de": "Seitenmenü", "ar": "القائمة الجانبية"}', 'Main sidebar navigation menu', 'sidebar', 3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'top', '{"tr": "Üst Menü", "en": "Top Menu", "de": "Oberes Menü", "ar": "القائمة العلوية"}', 'Top horizontal navigation menu', 'top', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'mobile', '{"tr": "Mobil Menü", "en": "Mobile Menu", "de": "Mobile Menü", "ar": "قائمة الجوال"}', 'Mobile navigation menu', 'both', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'footer', '{"tr": "Footer Menü", "en": "Footer Menu", "de": "Fußzeile Menü", "ar": "قائمة التذييل"}', 'Footer primary menu', 'both', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'footer-secondary', '{"tr": "Footer İkincil Menü", "en": "Footer Secondary Menu", "de": "Fußzeile Sekundärmenü", "ar": "قائمة التذييل الثانوية"}', 'Footer secondary menu', 'both', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;
