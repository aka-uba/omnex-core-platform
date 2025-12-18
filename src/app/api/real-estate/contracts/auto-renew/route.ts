import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { getTenantFromRequest } from '@/lib/api/tenantContext';

// POST /api/real-estate/contracts/auto-renew - Auto-renew contracts (scheduled task)
export async function POST(request: NextRequest) {
  return withTenant<ApiResponse<{ renewed: number; failed: number; results: unknown[] }>>(
    request,
    async (tenantPrisma) => {
      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find contracts that need auto-renewal (end date is today or passed, autoRenewal is true)
      // Build query with tenant isolation (defense-in-depth)
      const contractsToRenew = await tenantPrisma.contract.findMany({
        where: {
          tenantId: tenantContext.id,
          status: 'active',
          autoRenewal: true,
          endDate: {
            lte: today,
          },
        },
        include: {
          apartment: true,
          tenantRecord: true,
        },
      });

      const results: Array<{ contractId: string; success: boolean; error?: string; newContractId?: string }> = [];
      let renewed = 0;
      let failed = 0;

      for (const contract of contractsToRenew) {
        try {
          if (!contract.endDate) {
            results.push({
              contractId: contract.id,
              success: false,
              error: 'Contract has no end date',
            });
            failed++;
            continue;
          }

          // Calculate new dates
          const currentEndDate = new Date(contract.endDate);
          const contractDuration = currentEndDate.getTime() - new Date(contract.startDate).getTime();
          const newStartDate = new Date(currentEndDate);
          newStartDate.setDate(newStartDate.getDate() + 1);
          const newEndDate = new Date(newStartDate);
          newEndDate.setTime(newStartDate.getTime() + contractDuration);

          // Calculate new rent amount with increase rate
          let newRentAmount = Number(contract.rentAmount);
          if (contract.increaseRate && Number(contract.increaseRate) > 0) {
            const increase = Number(contract.increaseRate);
            newRentAmount = newRentAmount * (1 + increase);
          }

          // Create new contract
          const renewedContract = await tenantPrisma.contract.create({
            data: {
              tenantId: tenantContext.id,
              companyId: contract.companyId,
              apartmentId: contract.apartmentId,
              tenantRecordId: contract.tenantRecordId,
              templateId: contract.templateId,
              contractNumber: `${contract.contractNumber}-RENEWED-${new Date().getFullYear()}-${Date.now()}`,
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

          results.push({
            contractId: contract.id,
            success: true,
            newContractId: renewedContract.id,
          });
          renewed++;
        } catch (error) {
          results.push({
            contractId: contract.id,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          failed++;
        }
      }

      return successResponse({
        renewed,
        failed,
        results,
      });
    },
    { required: true, module: 'real-estate' }
  );
}

