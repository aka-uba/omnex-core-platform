import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { reconciliationUpdateSchema } from '@/modules/real-estate/schemas/property-expense.schema';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { calculateReconciliation } from '@/modules/real-estate/services/sideCostCalculationService';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/real-estate/reconciliation/[id] - Get single reconciliation
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  return withTenant<ApiResponse<{ reconciliation: unknown }>>(
    request,
    async (tenantPrisma) => {
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      const reconciliation = await tenantPrisma.sideCostReconciliation.findFirst({
        where: {
          id,
          tenantId: tenantContext.id,
        },
        include: {
          property: {
            select: {
              id: true,
              name: true,
              apartments: {
                select: {
                  id: true,
                  unitNumber: true,
                  area: true,
                },
              },
            },
          },
        },
      });

      if (!reconciliation) {
        return errorResponse('Reconciliation not found', 'The specified reconciliation does not exist', 404);
      }

      // Get expenses for this reconciliation
      const expenses = await tenantPrisma.propertyExpense.findMany({
        where: {
          propertyId: reconciliation.propertyId,
          year: reconciliation.year,
          isActive: true,
        },
        orderBy: { expenseDate: 'desc' },
      });

      // Category summary
      const categoryTotals = expenses.reduce(
        (acc, exp) => {
          acc[exp.category] = (acc[exp.category] || 0) + Number(exp.amount);
          return acc;
        },
        {} as Record<string, number>
      );

      return successResponse({
        reconciliation: {
          ...reconciliation,
          totalExpenses: Number(reconciliation.totalExpenses),
          perApartmentShare: Number(reconciliation.perApartmentShare),
          fiscalYearStart: reconciliation.fiscalYearStart?.toISOString() || null,
          fiscalYearEnd: reconciliation.fiscalYearEnd?.toISOString() || null,
          calculatedAt: reconciliation.calculatedAt?.toISOString() || null,
          finalizedAt: reconciliation.finalizedAt?.toISOString() || null,
          createdAt: reconciliation.createdAt.toISOString(),
          updatedAt: reconciliation.updatedAt.toISOString(),
          // Extra info
          expenses: expenses.map(e => ({
            ...e,
            amount: Number(e.amount),
            expenseDate: e.expenseDate.toISOString(),
          })),
          categoryTotals,
        },
      });
    },
    { required: true, module: 'real-estate' }
  );
}

// PUT /api/real-estate/reconciliation/[id] - Update reconciliation
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  return withTenant<ApiResponse<{ reconciliation: unknown }>>(
    request,
    async (tenantPrisma) => {
      const body = await request.json();

      const validationResult = reconciliationUpdateSchema.safeParse(body);
      if (!validationResult.success) {
        return errorResponse(
          'Validation error',
          validationResult.error.issues.map((e: { message: string }) => e.message).join(', '),
          400
        );
      }

      const data = validationResult.data;

      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      const existing = await tenantPrisma.sideCostReconciliation.findFirst({
        where: {
          id,
          tenantId: tenantContext.id,
        },
      });

      if (!existing) {
        return errorResponse('Reconciliation not found', 'The specified reconciliation does not exist', 404);
      }

      if (existing.status === 'finalized') {
        return errorResponse('Cannot modify', 'Finalized reconciliations cannot be modified', 400);
      }

      // If status is being set to finalized
      const updateData: Record<string, unknown> = {
        ...(data.notes !== undefined && { notes: data.notes }),
      };

      if (data.status === 'finalized') {
        updateData.status = 'finalized';
        updateData.finalizedAt = new Date();
        // TODO: Get current user ID for finalizedBy
      } else if (data.status) {
        updateData.status = data.status;
      }

      // If distribution method changed, recalculate
      if (data.distributionMethod && data.distributionMethod !== existing.distributionMethod) {
        const property = await tenantPrisma.property.findFirst({
          where: { id: existing.propertyId },
          select: {
            apartments: {
              select: {
                id: true,
                unitNumber: true,
                area: true,
                additionalCosts: true,
                contracts: {
                  select: {
                    id: true,
                    status: true,
                    startDate: true,
                    endDate: true,
                    tenantRecord: {
                      select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });

        if (property) {
          const calculation = calculateReconciliation({
            totalExpenses: Number(existing.totalExpenses),
            apartments: property.apartments.map(apt => ({
              id: apt.id,
              unitNumber: apt.unitNumber,
              area: Number(apt.area),
              additionalCosts: Number(apt.additionalCosts) || 0,
              contracts: apt.contracts.map(c => ({
                id: c.id,
                status: c.status,
                startDate: c.startDate,
                endDate: c.endDate,
                tenantRecord: c.tenantRecord,
              })),
            })),
            distributionMethod: data.distributionMethod,
            year: existing.year,
            fiscalYearStart: data.fiscalYearStart
              ? new Date(data.fiscalYearStart)
              : existing.fiscalYearStart || undefined,
            fiscalYearEnd: data.fiscalYearEnd
              ? new Date(data.fiscalYearEnd)
              : existing.fiscalYearEnd || undefined,
          });

          updateData.distributionMethod = data.distributionMethod;
          updateData.perApartmentShare = calculation.perApartmentShare;
          updateData.details = calculation.details;
          updateData.calculatedAt = new Date();
        }
      }

      const reconciliation = await tenantPrisma.sideCostReconciliation.update({
        where: { id },
        data: updateData,
        include: {
          property: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return successResponse({
        reconciliation: {
          ...reconciliation,
          totalExpenses: Number(reconciliation.totalExpenses),
          perApartmentShare: Number(reconciliation.perApartmentShare),
          fiscalYearStart: reconciliation.fiscalYearStart?.toISOString() || null,
          fiscalYearEnd: reconciliation.fiscalYearEnd?.toISOString() || null,
          calculatedAt: reconciliation.calculatedAt?.toISOString() || null,
          finalizedAt: reconciliation.finalizedAt?.toISOString() || null,
          createdAt: reconciliation.createdAt.toISOString(),
          updatedAt: reconciliation.updatedAt.toISOString(),
        },
      });
    },
    { required: true, module: 'real-estate' }
  );
}

// DELETE /api/real-estate/reconciliation/[id] - Delete reconciliation
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  return withTenant<ApiResponse<{ success: boolean }>>(
    request,
    async (tenantPrisma) => {
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      const existing = await tenantPrisma.sideCostReconciliation.findFirst({
        where: {
          id,
          tenantId: tenantContext.id,
        },
      });

      if (!existing) {
        return errorResponse('Reconciliation not found', 'The specified reconciliation does not exist', 404);
      }

      if (existing.status === 'finalized') {
        return errorResponse('Cannot delete', 'Finalized reconciliations cannot be deleted', 400);
      }

      await tenantPrisma.sideCostReconciliation.delete({
        where: { id },
      });

      return successResponse({ success: true });
    },
    { required: true, module: 'real-estate' }
  );
}
