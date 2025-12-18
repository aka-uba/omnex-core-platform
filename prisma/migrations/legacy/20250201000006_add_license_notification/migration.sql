-- CreateTable
CREATE TABLE "LicenseNotification" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "licenseId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "actionUrl" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LicenseNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LicenseNotification_tenantId_idx" ON "LicenseNotification"("tenantId");

-- CreateIndex
CREATE INDEX "LicenseNotification_licenseId_idx" ON "LicenseNotification"("licenseId");

-- CreateIndex
CREATE INDEX "LicenseNotification_isRead_idx" ON "LicenseNotification"("isRead");



