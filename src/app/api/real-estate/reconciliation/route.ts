import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { reconciliationCreateSchema } from '@/modules/real-estate/schemas/property-expense.schema';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { calculateReconciliation } from '@/modules/real-estate/services/sideCostCalculationService';
import { Prisma } from '@prisma/tenant-client';

// GET /api/real-estate/reconciliation - List reconciliations
export async function GET(request: NextRequest) {
  return withTenant<ApiResponse<{ reconciliations: unknown[]; total: number; page: number; pageSize: number }>>(
    request,
    async (tenantPrisma) => {
      const searchParams = request.nextUrl.searchParams;

      const page = parseInt(searchParams.get('page') || '1', 10) || 1;
      const pageSize = parseInt(searchParams.get('pageSize') || '20', 10) || 20;
      const propertyId = searchParams.get('propertyId') || undefined;
      const year = searchParams.get('year') ? parseInt(searchParams.get('year')!, 10) : undefined;
      const status = searchParams.get('status') || undefined;
      const companyId = searchParams.get('companyId') || undefined;

      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      let finalCompanyId = companyId;
      if (!finalCompanyId) {
        const firstCompany = await tenantPrisma.company.findFirst({
          select: { id: true },
          orderBy: { createdAt: 'asc' },
        });
        finalCompanyId = firstCompany?.id;
      }

      const where: Prisma.SideCostReconciliationWhereInput = {
        tenantId: tenantContext.id,
        ...(finalCompanyId && { companyId: finalCompanyId }),
        ...(propertyId && { propertyId }),
        ...(year && { year }),
        ...(status && { status }),
      };

      const total = await tenantPrisma.sideCostReconciliation.count({ where });

      const reconciliations = await tenantPrisma.sideCostReconciliation.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
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
        reconciliations: reconciliations.map(rec => ({
          ...rec,
          totalExpenses: Number(rec.totalExpenses),
          perApartmentShare: Number(rec.perApartmentShare),
          fiscalYearStart: rec.fiscalYearStart?.toISOString() || null,
          fiscalYearEnd: rec.fiscalYearEnd?.toISOString() || null,
          calculatedAt: rec.calculatedAt?.toISOString() || null,
          finalizedAt: rec.finalizedAt?.toISOString() || null,
          createdAt: rec.createdAt.toISOString(),
          updatedAt: rec.updatedAt.toISOString(),
        })),
        total,
        page,
        pageSize,
      });
    },
    { required: true, module: 'real-estate' }
  );
}

// POST /api/real-estate/reconciliation - Create and calculate reconciliation
export async function POST(request: NextRequest) {
  return withTenant<ApiResponse<{ reconciliation: unknown }>>(
    request,
    async (tenantPrisma) => {
      const body = await request.json();

      const validationResult = reconciliationCreateSchema.safeParse(body);
      if (!validationResult.success) {
        return errorResponse(
          'Validation error',
          validationResult.error.errors.map(e => e.message).join(', '),
          400
        );
      }

      const data = validationResult.data;

      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Check if reconciliation already exists
      const existing = await tenantPrisma.sideCostReconciliation.findFirst({
        where: {
          propertyId: data.propertyId,
          year: data.year,
        },
      });

      if (existing) {
        return errorResponse(
          'Reconciliation exists',
          `A reconciliation for this property and year already exists (ID: ${existing.id})`,
          409
        );
      }

      // Get property with apartments
      const property = await tenantPrisma.property.findFirst({
        where: {
          id: data.propertyId,
          tenantId: tenantContext.id,
        },
        select: {
          id: true,
          companyId: true,
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

      if (!property) {
        return errorResponse('Property not found', 'The specified property does not exist', 404);
      }

      // Get total expenses for the year
      const expenseAggregate = await tenantPrisma.propertyExpense.aggregate({
        where: {
          propertyId: data.propertyId,
          year: data.year,
          isActive: true,
        },
        _sum: {
          amount: true,
        },
      });

      const totalExpenses = Number(expenseAggregate._sum.amount) || 0;

      // Calculate reconciliation
      const calculation = calculateReconciliation({
        totalExpenses,
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
        year: data.year,
        fiscalYearStart: data.fiscalYearStart ? new Date(data.fiscalYearStart) : undefined,
        fiscalYearEnd: data.fiscalYearEnd ? new Date(data.fiscalYearEnd) : undefined,
      });

      // Create reconciliation
      const reconciliation = await tenantPrisma.sideCostReconciliation.create({
        data: {
          tenantId: tenantContext.id,
          companyId: property.companyId,
          propertyId: data.propertyId,
          year: data.year,
          totalExpenses,
          apartmentCount: calculation.apartmentCount,
          perApartmentShare: calculation.perApartmentShare,
          distributionMethod: data.distributionMethod,
          fiscalYearStart: data.fiscalYearStart ? new Date(data.fiscalYearStart) : null,
          fiscalYearEnd: data.fiscalYearEnd ? new Date(data.fiscalYearEnd) : null,
          status: 'calculated',
          calculatedAt: new Date(),
          details: calculation.details,
          notes: data.notes,
        },
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
          // Extra info
          totalDebt: calculation.totalDebt,
          totalCredit: calculation.totalCredit,
        },
      });
    },
    { required: true, module: 'real-estate' }
  );
}
