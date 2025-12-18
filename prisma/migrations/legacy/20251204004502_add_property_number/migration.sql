/*
  Warnings:

  - You are about to drop the column `module` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `agencyId` on the `Tenant` table. All the data in the column will be lost.
  - You are about to drop the `Agency` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LicensePackage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LicensePayment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TenantLicense` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updatedAt` to the `MaintenanceRecord` table without a default value. This is not possible if the table is not empty.
  - Made the column `isPublic` on table `Template` required. This step will fail if there are existing NULL values in that column.
  - Made the column `isActive` on table `Template` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "LicensePayment" DROP CONSTRAINT "LicensePayment_licenseId_fkey";

-- DropForeignKey
ALTER TABLE "Tenant" DROP CONSTRAINT "Tenant_agencyId_fkey";

-- DropForeignKey
ALTER TABLE "TenantLicense" DROP CONSTRAINT "TenantLicense_packageId_fkey";

-- DropForeignKey
ALTER TABLE "TenantLicense" DROP CONSTRAINT "TenantLicense_tenantId_fkey";

-- DropIndex
DROP INDEX "AuditLog_module_idx";

-- DropIndex
DROP INDEX "AuditLog_status_idx";

-- DropIndex
DROP INDEX "Tenant_agencyId_idx";

-- AlterTable
ALTER TABLE "Apartment" ADD COLUMN     "additionalCosts" DECIMAL(10,2),
ADD COLUMN     "apartmentType" TEXT,
ADD COLUMN     "basementSize" DECIMAL(8,2),
ADD COLUMN     "bedroomCount" INTEGER DEFAULT 0,
ADD COLUMN     "coldRent" DECIMAL(10,2),
ADD COLUMN     "coverImage" TEXT,
ADD COLUMN     "deposit" DECIMAL(10,2),
ADD COLUMN     "heatingCosts" DECIMAL(10,2),
ADD COLUMN     "heatingSystems" JSONB,
ADD COLUMN     "internetSpeed" TEXT,
ADD COLUMN     "lastRenovationDate" TIMESTAMP(3),
ADD COLUMN     "usageRights" JSONB;

-- AlterTable
ALTER TABLE "AuditLog" DROP COLUMN "module",
DROP COLUMN "status";

-- AlterTable
ALTER TABLE "Location" ADD COLUMN     "latitude" DECIMAL(10,8),
ADD COLUMN     "longitude" DECIMAL(11,8);

-- AlterTable
ALTER TABLE "MaintenanceRecord" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "documents" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Page" ALTER COLUMN "metaKeywords" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "constructionYear" INTEGER,
ADD COLUMN     "coverImage" TEXT,
ADD COLUMN     "financingEndDate" TIMESTAMP(3),
ADD COLUMN     "financingPaymentDay" INTEGER,
ADD COLUMN     "financingStartDate" TIMESTAMP(3),
ADD COLUMN     "floorCount" INTEGER,
ADD COLUMN     "isPaidOff" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "landArea" DECIMAL(10,2),
ADD COLUMN     "lastRenovationDate" TIMESTAMP(3),
ADD COLUMN     "livingArea" DECIMAL(10,2),
ADD COLUMN     "monthlyFinancingRate" DECIMAL(10,2),
ADD COLUMN     "numberOfInstallments" INTEGER,
ADD COLUMN     "propertyNumber" TEXT,
ADD COLUMN     "purchaseDate" TIMESTAMP(3),
ADD COLUMN     "purchasePrice" DECIMAL(12,2);

-- AlterTable
ALTER TABLE "Template" ALTER COLUMN "isPublic" SET NOT NULL,
ALTER COLUMN "isActive" SET NOT NULL;

-- AlterTable
ALTER TABLE "Tenant" DROP COLUMN "agencyId",
ADD COLUMN     "birthDate" TIMESTAMP(3),
ADD COLUMN     "birthPlace" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "companyName" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "houseNumber" TEXT,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "mobile" TEXT,
ADD COLUMN     "nationality" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "salutation" TEXT,
ADD COLUMN     "street" TEXT,
ADD COLUMN     "taxNumber" TEXT,
ADD COLUMN     "tenantType" TEXT;

-- DropTable
DROP TABLE "Agency";

-- DropTable
DROP TABLE "LicensePackage";

-- DropTable
DROP TABLE "LicensePayment";

-- DropTable
DROP TABLE "TenantLicense";

-- CreateTable
CREATE TABLE "AccessControlConfiguration" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "roleId" TEXT,
    "type" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccessControlConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccessControlConfiguration_tenantId_type_idx" ON "AccessControlConfiguration"("tenantId", "type");

-- CreateIndex
CREATE INDEX "AccessControlConfiguration_userId_idx" ON "AccessControlConfiguration"("userId");

-- CreateIndex
CREATE INDEX "AccessControlConfiguration_roleId_idx" ON "AccessControlConfiguration"("roleId");

-- CreateIndex
CREATE INDEX "AccessControlConfiguration_isActive_idx" ON "AccessControlConfiguration"("isActive");

-- CreateIndex
CREATE INDEX "Location_latitude_longitude_idx" ON "Location"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "Template_category_idx" ON "Template"("category");

-- RenameIndex
ALTER INDEX "menu_location_assignments_locationId_assignmentType_assignme_ke" RENAME TO "menu_location_assignments_locationId_assignmentType_assignm_key";
