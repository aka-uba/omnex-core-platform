import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { contractUpdateSchema } from '@/modules/real-estate/schemas/contract.schema';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import type { ContractUpdateInput } from '@/modules/real-estate/types/contract';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/real-estate/contracts/[id] - Get contract by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withTenant<ApiResponse<{ contract: unknown }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      const contract = await tenantPrisma.contract.findUnique({
        where: { id },
        include: {
          apartment: {
            include: {
              property: {
                select: {
                  id: true,
                  name: true,
                  address: true,
                },
              },
            },
          },
          tenantRecord: {
            select: {
              id: true,
              tenantNumber: true,
            },
          },
          payments: {
            select: {
              id: true,
              type: true,
              amount: true,
              status: true,
              dueDate: true,
              paidDate: true,
            },
            take: 20,
            orderBy: { dueDate: 'desc' },
          },
          _count: {
            select: {
              payments: true,
            },
          },
        },
      });

      if (!contract) {
        return errorResponse('Not found', 'Contract not found', 404);
      }

      // Note: withTenant already provides tenant isolation via per-tenant database

      return successResponse({
        contract: {
          ...contract,
          createdAt: contract.createdAt.toISOString(),
          updatedAt: contract.updatedAt.toISOString(),
          startDate: contract.startDate.toISOString(),
          endDate: contract.endDate?.toISOString() || null,
          renewalDate: contract.renewalDate?.toISOString() || null,
        },
      });
    },
    { required: true, module: 'real-estate' }
  );
}

// PATCH /api/real-estate/contracts/[id] - Update contract
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return withTenant<ApiResponse<{ contract: unknown }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;
      const body = await request.json();

      // Validate request body (partial update)
      const validatedData = contractUpdateSchema.parse(body) as ContractUpdateInput;

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Check if contract exists
      const existingContract = await tenantPrisma.contract.findUnique({
        where: { id },
      });

      if (!existingContract) {
        return errorResponse('Not found', 'Contract not found', 404);
      }

      // Note: withTenant already provides tenant isolation via per-tenant database
      // Check if contract number is unique (if changed)
      if (validatedData.contractNumber && validatedData.contractNumber !== existingContract.contractNumber) {
        const existingContractWithNumber = await tenantPrisma.contract.findFirst({
          where: {
            tenantId: tenantContext.id,
            contractNumber: validatedData.contractNumber,
            id: { not: id },
          },
        });

        if (existingContractWithNumber) {
          return errorResponse('Validation error', 'Contract number already exists', 409);
        }
      }

      // Check if template exists (if provided)
      if (validatedData.templateId !== undefined) {
        if (validatedData.templateId) {
          const template = await tenantPrisma.contractTemplate.findFirst({
            where: {
              id: validatedData.templateId,
              tenantId: tenantContext.id,
            },
          });

          if (!template) {
            return errorResponse('Validation error', 'Contract template not found', 404);
          }
        }
      }

      // Prepare update data
      const updateData: any = {};
      // Note: apartmentId and tenantRecordId updates are handled by Prisma relations, not directly
      if (validatedData.templateId !== undefined) updateData.templateId = validatedData.templateId || null;
      if (validatedData.contractNumber !== undefined) updateData.contractNumber = validatedData.contractNumber;
      if (validatedData.type !== undefined) updateData.type = validatedData.type;
      if (validatedData.startDate !== undefined) updateData.startDate = validatedData.startDate;
      if (validatedData.endDate !== undefined) updateData.endDate = validatedData.endDate || null;
      if (validatedData.renewalDate !== undefined) updateData.renewalDate = validatedData.renewalDate || null;
      if (validatedData.rentAmount !== undefined) updateData.rentAmount = validatedData.rentAmount;
      if (validatedData.deposit !== undefined) updateData.deposit = validatedData.deposit || null;
      if (validatedData.currency !== undefined) updateData.currency = validatedData.currency;
      if (validatedData.paymentType !== undefined) updateData.paymentType = validatedData.paymentType || null;
      if (validatedData.paymentDay !== undefined) updateData.paymentDay = validatedData.paymentDay || null;
      if (validatedData.autoRenewal !== undefined) updateData.autoRenewal = validatedData.autoRenewal;
      if (validatedData.renewalNoticeDays !== undefined) updateData.renewalNoticeDays = validatedData.renewalNoticeDays;
      if (validatedData.increaseRate !== undefined) updateData.increaseRate = validatedData.increaseRate || null;
      if (validatedData.status !== undefined) updateData.status = validatedData.status;
      if (validatedData.documents !== undefined) updateData.documents = validatedData.documents;
      if (validatedData.terms !== undefined) updateData.terms = validatedData.terms || null;
      if (validatedData.notes !== undefined) updateData.notes = validatedData.notes || null;
      if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;

      // Update contract
      const updatedContract = await tenantPrisma.contract.update({
        where: { id },
        data: updateData,
        include: {
          apartment: {
            select: {
              id: true,
              unitNumber: true,
            },
          },
          tenantRecord: {
            select: {
              id: true,
              tenantNumber: true,
            },
          },
        },
      });

      return successResponse({
        contract: {
          ...updatedContract,
          createdAt: updatedContract.createdAt.toISOString(),
          updatedAt: updatedContract.updatedAt.toISOString(),
          startDate: updatedContract.startDate.toISOString(),
          endDate: updatedContract.endDate?.toISOString() || null,
          renewalDate: updatedContract.renewalDate?.toISOString() || null,
        },
      });
    },
    { required: true, module: 'real-estate' }
  );
}

