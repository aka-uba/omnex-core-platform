-- CreateTable
CREATE TABLE "LicensePackage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "modules" TEXT[],
    "basePrice" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "billingCycle" TEXT NOT NULL,
    "maxUsers" INTEGER,
    "maxStorage" INTEGER,
    "features" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LicensePackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantLicense" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "renewalDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "lastPaymentDate" TIMESTAMP(3),
    "nextPaymentDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantLicense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LicensePayment" (
    "id" TEXT NOT NULL,
    "licenseId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "paymentMethod" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "receiptUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LicensePayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LicensePackage_isActive_idx" ON "LicensePackage"("isActive");

-- CreateIndex
CREATE INDEX "TenantLicense_tenantId_idx" ON "TenantLicense"("tenantId");

-- CreateIndex
CREATE INDEX "TenantLicense_packageId_idx" ON "TenantLicense"("packageId");

-- CreateIndex
CREATE INDEX "TenantLicense_status_idx" ON "TenantLicense"("status");

-- CreateIndex
CREATE INDEX "TenantLicense_endDate_idx" ON "TenantLicense"("endDate");

-- CreateIndex
CREATE INDEX "LicensePayment_licenseId_idx" ON "LicensePayment"("licenseId");

-- CreateIndex
CREATE INDEX "LicensePayment_status_idx" ON "LicensePayment"("status");

-- CreateIndex
CREATE INDEX "LicensePayment_paymentDate_idx" ON "LicensePayment"("paymentDate");

-- AddForeignKey
ALTER TABLE "TenantLicense" ADD CONSTRAINT "TenantLicense_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantLicense" ADD CONSTRAINT "TenantLicense_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "LicensePackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LicensePayment" ADD CONSTRAINT "LicensePayment_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "TenantLicense"("id") ON DELETE CASCADE ON UPDATE CASCADE;



