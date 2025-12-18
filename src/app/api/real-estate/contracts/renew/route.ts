import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { getTenantFromRequest } from '@/lib/api/tenantContext';

// POST /api/real-estate/contracts/renew - Manual contract renewal
export async function POST(request: NextRequest) {
  return withTenant<ApiResponse<{ contract: unknown; renewed: boolean }>>(
    request,
    async (tenantPrisma) => {
      const body = await request.json();
      const { contractId } = body;

      if (!contractId) {
        return errorResponse('Validation error', 'Contract ID is required', 400);
      }

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Find contract with tenant isolation (defense-in-depth)
      const contract = await tenantPrisma.contract.findFirst({
        where: {
          id: contractId,
          tenantId: tenantContext.id,
        },
        include: {
          apartment: true,
          tenantRecord: true,
        },
      });

      if (!contract) {
        return errorResponse('Not found', 'Contract not found', 404);
      }

      // Check if contract can be renewed
      if (contract.status === 'terminated') {
        return errorResponse('Validation error', 'Terminated contracts cannot be renewed', 400);
      }

      if (!contract.endDate) {
        return errorResponse('Validation error', 'Contract has no end date', 400);
      }

      // Calculate new dates
      const currentEndDate = new Date(contract.endDate);
      const contractDuration = currentEndDate.getTime() - new Date(contract.startDate).getTime();
      const newStartDate = new Date(currentEndDate);
      newStartDate.setDate(newStartDate.getDate() + 1); // Start next day after end date
      const newEndDate = new Date(newStartDate);
      newEndDate.setTime(newStartDate.getTime() + contractDuration);

      // Calculate new rent amount with increase rate
      let newRentAmount = Number(contract.rentAmount);
      if (contract.increaseRate && Number(contract.increaseRate) > 0) {
        const increase = Number(contract.increaseRate);
        newRentAmount = newRentAmount * (1 + increase);
      }

      // Create new contract or update existing
      const renewedContract = await tenantPrisma.contract.create({
        data: {
          tenantId: tenantContext.id,
          companyId: contract.companyId,
          apartmentId: contract.apartmentId,
          tenantRecordId: contract.tenantRecordId,
          templateId: contract.templateId,
          contractNumber: `${contract.contractNumber}-RENEWED-${new Date().getFullYear()}`,
          type: contract.type,
          startDate: newStartDate,
          endDate: newEndDate,
          renewalDate: null,
          rentAmount: newRentAmount,
          deposit: contract.deposit,
          currency: contract.currency,
          paymentType: contract.paymentType,
          paymentDay: contract.paymentDay,
          autoRenewal: contract.autoRenewal,
          renewalNoticeDays: contract.renewalNoticeDays,
          increaseRate: contract.increaseRate,
          status: 'active',
          documents: contract.documents,
          terms: contract.terms,
          notes: contract.notes,
        },
      });

      // Update old contract status
      await tenantPrisma.contract.update({
        where: { id: contract.id },
        data: { status: 'expired' },
      });

      return successResponse({
        contract: {
          ...renewedContract,
          createdAt: renewedContract.createdAt.toISOString(),
          updatedAt: renewedContract.updatedAt.toISOString(),
          startDate: renewedContract.startDate.toISOString(),
          endDate: renewedContract.endDate?.toISOString() || null,
          renewalDate: renewedContract.renewalDate?.toISOString() || null,
        },
        renewed: true,
      });
    },
    { required: true, module: 'real-estate' }
  );
}

// GET /api/real-estate/contracts/renew/check - Check contracts that need renewal
export async function GET(request: NextRequest) {
  return withTenant<ApiResponse<{ contracts: unknown[]; count: number }>>(
    request,
    async (tenantPrisma) => {
      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      const today = new Date();
      const searchParams = request.nextUrl.searchParams;
      const daysAhead = parseInt(searchParams.get('daysAhead') || '30', 10) || 30;

      // Calculate date range
      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + daysAhead);

      // Find contracts that need renewal with tenant isolation (defense-in-depth)
      const contracts = await tenantPrisma.contract.findMany({
        where: {
          tenantId: tenantContext.id,
          status: 'active',
          autoRenewal: true,
          endDate: {
            lte: futureDate,
            gte: today,
          },
        },
        include: {
          apartment: {
            select: {
              id: true,
              unitNumber: true,
              property: {
                select: {
                  id: true,
                  name: true,
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
        },
        orderBy: {
          endDate: 'asc',
        },
      });

      return successResponse({
        contracts: contracts.map(contract => ({
          ...contract,
          createdAt: contract.createdAt.toISOString(),
          updatedAt: contract.updatedAt.toISOString(),
          startDate: contract.startDate.toISOString(),
          endDate: contract.endDate?.toISOString() || null,
          renewalDate: contract.renewalDate?.toISOString() || null,
        })),
        count: contracts.length,
      });
    },
    { required: true, module: 'real-estate' }
  );
}

