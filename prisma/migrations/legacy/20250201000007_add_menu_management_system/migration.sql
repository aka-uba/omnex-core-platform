-- CreateTable
CREATE TABLE "menus" (
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

-- CreateTable
CREATE TABLE "menu_items" (
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

-- CreateTable
CREATE TABLE "menu_locations" (
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

-- CreateTable
CREATE TABLE "menu_location_assignments" (
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

-- CreateTable
CREATE TABLE "footer_customizations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
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
CREATE UNIQUE INDEX "menus_slug_tenantId_locale_key" ON "menus"("slug", "tenantId", "locale");

-- CreateIndex
CREATE INDEX "menus_tenantId_idx" ON "menus"("tenantId");

-- CreateIndex
CREATE INDEX "menus_slug_idx" ON "menus"("slug");

-- CreateIndex
CREATE INDEX "menus_isActive_idx" ON "menus"("isActive");

-- CreateIndex
CREATE INDEX "menu_items_menuId_idx" ON "menu_items"("menuId");

-- CreateIndex
CREATE INDEX "menu_items_parentId_idx" ON "menu_items"("parentId");

-- CreateIndex
CREATE INDEX "menu_items_order_idx" ON "menu_items"("order");

-- CreateIndex
CREATE INDEX "menu_items_menuGroup_idx" ON "menu_items"("menuGroup");

-- CreateIndex
CREATE INDEX "menu_items_visible_idx" ON "menu_items"("visible");

-- CreateIndex
CREATE UNIQUE INDEX "menu_locations_name_tenantId_key" ON "menu_locations"("name", "tenantId");

-- CreateIndex
CREATE INDEX "menu_locations_tenantId_idx" ON "menu_locations"("tenantId");

-- CreateIndex
CREATE INDEX "menu_locations_layoutType_idx" ON "menu_locations"("layoutType");

-- CreateIndex
CREATE UNIQUE INDEX "menu_location_assignments_locationId_assignmentType_assignme_key" ON "menu_location_assignments"("locationId", "assignmentType", "assignmentId", "tenantId");

-- CreateIndex
CREATE INDEX "menu_location_assignments_locationId_idx" ON "menu_location_assignments"("locationId");

-- CreateIndex
CREATE INDEX "menu_location_assignments_menuId_idx" ON "menu_location_assignments"("menuId");

-- CreateIndex
CREATE INDEX "menu_location_assignments_assignmentType_assignmentId_idx" ON "menu_location_assignments"("assignmentType", "assignmentId");

-- CreateIndex
CREATE INDEX "menu_location_assignments_tenantId_idx" ON "menu_location_assignments"("tenantId");

-- CreateIndex
CREATE INDEX "menu_location_assignments_isActive_idx" ON "menu_location_assignments"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "footer_customizations_tenantId_key" ON "footer_customizations"("tenantId");

-- CreateIndex
CREATE INDEX "footer_customizations_tenantId_idx" ON "footer_customizations"("tenantId");

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_location_assignments" ADD CONSTRAINT "menu_location_assignments_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "menu_locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_location_assignments" ADD CONSTRAINT "menu_location_assignments_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;


