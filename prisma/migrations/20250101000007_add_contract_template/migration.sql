-- AlterTable
ALTER TABLE "Contract" ADD COLUMN     "templateId" TEXT;

-- CreateTable
CREATE TABLE "ContractTemplate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "category" TEXT,
    "content" TEXT NOT NULL,
    "variables" JSONB,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContractTemplate_tenantId_companyId_idx" ON "ContractTemplate"("tenantId", "companyId");

-- CreateIndex
CREATE INDEX "ContractTemplate_type_idx" ON "ContractTemplate"("type");

-- CreateIndex
CREATE INDEX "ContractTemplate_category_idx" ON "ContractTemplate"("category");

-- CreateIndex
CREATE INDEX "ContractTemplate_isDefault_idx" ON "ContractTemplate"("isDefault");

-- CreateIndex
CREATE INDEX "ContractTemplate_isActive_idx" ON "ContractTemplate"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ContractTemplate_tenantId_name_key" ON "ContractTemplate"("tenantId", "name");

-- CreateIndex
CREATE INDEX "Contract_templateId_idx" ON "Contract"("templateId");

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ContractTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
