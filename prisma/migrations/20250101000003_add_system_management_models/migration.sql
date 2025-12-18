/*
  Warnings:

  - You are about to drop the column `entity` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `entityId` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the `AIGeneration` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AIHistory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Asset` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Attachment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BrandKit` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Company` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Content` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Finance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Notification` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PagePermission` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PermissionDefinition` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Report` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Role` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserPermission` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserPreferences` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_CompanyUsers` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `module` to the `AuditLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `AuditLog` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "AIGeneration" DROP CONSTRAINT "AIGeneration_companyId_fkey";

-- DropForeignKey
ALTER TABLE "AIGeneration" DROP CONSTRAINT "AIGeneration_userId_fkey";

-- DropForeignKey
ALTER TABLE "AIHistory" DROP CONSTRAINT "AIHistory_companyId_fkey";

-- DropForeignKey
ALTER TABLE "AIHistory" DROP CONSTRAINT "AIHistory_userId_fkey";

-- DropForeignKey
ALTER TABLE "Asset" DROP CONSTRAINT "Asset_companyId_fkey";

-- DropForeignKey
ALTER TABLE "Attachment" DROP CONSTRAINT "Attachment_notificationId_fkey";

-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_userId_fkey";

-- DropForeignKey
ALTER TABLE "BrandKit" DROP CONSTRAINT "BrandKit_companyId_fkey";

-- DropForeignKey
ALTER TABLE "Content" DROP CONSTRAINT "Content_companyId_fkey";

-- DropForeignKey
ALTER TABLE "Finance" DROP CONSTRAINT "Finance_companyId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_recipientId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_senderId_fkey";

-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserPermission" DROP CONSTRAINT "UserPermission_permissionKey_fkey";

-- DropForeignKey
ALTER TABLE "UserPermission" DROP CONSTRAINT "UserPermission_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserPreferences" DROP CONSTRAINT "UserPreferences_userId_fkey";

-- DropForeignKey
ALTER TABLE "_CompanyUsers" DROP CONSTRAINT "_CompanyUsers_A_fkey";

-- DropForeignKey
ALTER TABLE "_CompanyUsers" DROP CONSTRAINT "_CompanyUsers_B_fkey";

-- DropIndex
DROP INDEX "AuditLog_entityId_idx";

-- DropIndex
DROP INDEX "AuditLog_entity_idx";

-- AlterTable
ALTER TABLE "AuditLog" DROP COLUMN "entity",
DROP COLUMN "entityId",
DROP COLUMN "metadata",
ADD COLUMN     "details" JSONB,
ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "module" TEXT NOT NULL,
ADD COLUMN     "resource" TEXT,
ADD COLUMN     "resourceId" TEXT,
ADD COLUMN     "status" TEXT NOT NULL,
ADD COLUMN     "tenantSlug" TEXT;

-- DropTable
DROP TABLE "AIGeneration";

-- DropTable
DROP TABLE "AIHistory";

-- DropTable
DROP TABLE "Asset";

-- DropTable
DROP TABLE "Attachment";

-- DropTable
DROP TABLE "BrandKit";

-- DropTable
DROP TABLE "Company";

-- DropTable
DROP TABLE "Content";

-- DropTable
DROP TABLE "Finance";

-- DropTable
DROP TABLE "Notification";

-- DropTable
DROP TABLE "PagePermission";

-- DropTable
DROP TABLE "PermissionDefinition";

-- DropTable
DROP TABLE "Report";

-- DropTable
DROP TABLE "Role";

-- DropTable
DROP TABLE "User";

-- DropTable
DROP TABLE "UserPermission";

-- DropTable
DROP TABLE "UserPreferences";

-- DropTable
DROP TABLE "_CompanyUsers";

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subdomain" TEXT,
    "customDomain" TEXT,
    "dbName" TEXT NOT NULL,
    "currentDb" TEXT NOT NULL,
    "allDatabases" TEXT[],
    "agencyId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "setupFailed" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "Module" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "author" TEXT,
    "path" TEXT,
    "status" TEXT NOT NULL DEFAULT 'installed',
    "metadata" JSONB,
    "settings" JSONB,
    "installedAt" TIMESTAMP(3),
    "activatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Module_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModulePermission" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "canAccess" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModulePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantModule" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackupMetadata" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tenantSlug" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "compressed" BOOLEAN NOT NULL DEFAULT true,
    "encrypted" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,

    CONSTRAINT "BackupMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemMetric" (
    "id" TEXT NOT NULL,
    "metricType" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_subdomain_key" ON "Tenant"("subdomain");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_customDomain_key" ON "Tenant"("customDomain");

-- CreateIndex
CREATE INDEX "Tenant_slug_idx" ON "Tenant"("slug");

-- CreateIndex
CREATE INDEX "Tenant_subdomain_idx" ON "Tenant"("subdomain");

-- CreateIndex
CREATE INDEX "Tenant_customDomain_idx" ON "Tenant"("customDomain");

-- CreateIndex
CREATE INDEX "Tenant_agencyId_idx" ON "Tenant"("agencyId");

-- CreateIndex
CREATE INDEX "Tenant_status_idx" ON "Tenant"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Agency_email_key" ON "Agency"("email");

-- CreateIndex
CREATE INDEX "Agency_name_idx" ON "Agency"("name");

-- CreateIndex
CREATE INDEX "Agency_email_idx" ON "Agency"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Module_slug_key" ON "Module"("slug");

-- CreateIndex
CREATE INDEX "Module_slug_idx" ON "Module"("slug");

-- CreateIndex
CREATE INDEX "Module_status_idx" ON "Module"("status");

-- CreateIndex
CREATE INDEX "ModulePermission_moduleId_idx" ON "ModulePermission"("moduleId");

-- CreateIndex
CREATE INDEX "ModulePermission_role_idx" ON "ModulePermission"("role");

-- CreateIndex
CREATE UNIQUE INDEX "ModulePermission_moduleId_role_key" ON "ModulePermission"("moduleId", "role");

-- CreateIndex
CREATE INDEX "TenantModule_tenantId_idx" ON "TenantModule"("tenantId");

-- CreateIndex
CREATE INDEX "TenantModule_moduleId_idx" ON "TenantModule"("moduleId");

-- CreateIndex
CREATE INDEX "TenantModule_enabled_idx" ON "TenantModule"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "TenantModule_tenantId_moduleId_key" ON "TenantModule"("tenantId", "moduleId");

-- CreateIndex
CREATE INDEX "BackupMetadata_tenantId_idx" ON "BackupMetadata"("tenantId");

-- CreateIndex
CREATE INDEX "BackupMetadata_tenantSlug_idx" ON "BackupMetadata"("tenantSlug");

-- CreateIndex
CREATE INDEX "BackupMetadata_status_idx" ON "BackupMetadata"("status");

-- CreateIndex
CREATE INDEX "BackupMetadata_type_idx" ON "BackupMetadata"("type");

-- CreateIndex
CREATE INDEX "BackupMetadata_createdAt_idx" ON "BackupMetadata"("createdAt");

-- CreateIndex
CREATE INDEX "SystemMetric_metricType_idx" ON "SystemMetric"("metricType");

-- CreateIndex
CREATE INDEX "SystemMetric_timestamp_idx" ON "SystemMetric"("timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_tenantSlug_idx" ON "AuditLog"("tenantSlug");

-- CreateIndex
CREATE INDEX "AuditLog_module_idx" ON "AuditLog"("module");

-- CreateIndex
CREATE INDEX "AuditLog_status_idx" ON "AuditLog"("status");

-- AddForeignKey
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModulePermission" ADD CONSTRAINT "ModulePermission_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantModule" ADD CONSTRAINT "TenantModule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantModule" ADD CONSTRAINT "TenantModule_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackupMetadata" ADD CONSTRAINT "BackupMetadata_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
