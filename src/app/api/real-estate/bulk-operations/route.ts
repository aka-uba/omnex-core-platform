import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { requireAuth } from '@/lib/middleware/authMiddleware';
import { bulkOperationCreateSchema } from '@/modules/real-estate/schemas/bulk-operation.schema';
import { z } from 'zod';
import { Prisma } from '@prisma/tenant-client';
import { getAuditContext, logCreate } from '@/lib/api/auditHelper';

// GET /api/real-estate/bulk-operations - List bulk operations
export async function GET(request: NextRequest) {
  return withTenant<ApiResponse<{ operations: unknown[]; total: number; page: number; pageSize: number }>>(
    request,
    async (tenantPrisma) => {
      const searchParams = request.nextUrl.searchParams;
      
      // Parse query parameters
      const page = parseInt(searchParams.get('page') || '1', 10) || 1;
      const pageSize = parseInt(searchParams.get('pageSize') || '10', 10) || 10;
      const search = searchParams.get('search') || undefined;
      const type = searchParams.get('type') || undefined;
      const status = searchParams.get('status') || undefined;
      const createdBy = searchParams.get('createdBy') || undefined;
      const dateFrom = searchParams.get('dateFrom') || undefined;
      const dateTo = searchParams.get('dateTo') || undefined;
      const companyId = searchParams.get('companyId') || undefined;

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Get companyId from query or use first company
      let finalCompanyId = companyId;
      if (!finalCompanyId) {
        const firstCompany = await tenantPrisma.company.findFirst({
          select: { id: true },
          orderBy: { createdAt: 'asc' },
        });
        finalCompanyId = firstCompany?.id;
      }

      // Build where clause
      // Build where clause with tenant and company isolation (defense-in-depth)
      const where: any = {
        tenantId: tenantContext.id,
        ...(finalCompanyId && { companyId: finalCompanyId }),
        ...(type && { type }),
        ...(status && { status }),
        ...(createdBy && { createdBy }),
        ...(dateFrom && {
          createdAt: {
            gte: new Date(dateFrom),
          },
        }),
        ...(dateTo && {
          createdAt: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            lte: new Date(dateTo),
          },
        }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }),
      };

      // Get total count
      const total = await (tenantPrisma as any).bulkOperation.count({ where });

      // Get operations
      const operations = await (tenantPrisma as any).bulkOperation.findMany({
        where,
        include: {
          createdByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      });

      return successResponse({
        operations,
        total,
        page,
        pageSize,
      });
    }
  );
}

// POST /api/real-estate/bulk-operations - Create and execute bulk operation
export async function POST(request: NextRequest) {
  return withTenant<ApiResponse<{ operation: unknown; executed: boolean }>>(
    request,
    async (tenantPrisma) => {
      try {
        const body = await request.json();

        // Validate input
        const validatedData = bulkOperationCreateSchema.parse(body);

        // Get tenant context
        const tenantContext = await getTenantFromRequest(request);
        if (!tenantContext) {
          return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
        }

        // Get user from auth session
        const authResult = await requireAuth(request);
        if (!authResult || 'status' in authResult) {
          return errorResponse('Unauthorized', 'Authentication required', 401);
        }
        const userId = authResult.userId;

        // Get audit context
        const auditContext = await getAuditContext(request);

        // Get companyId from query or use first company
        const searchParams = request.nextUrl.searchParams;
        let companyId = searchParams.get('companyId') || undefined;
        if (!companyId) {
          const firstCompany = await tenantPrisma.company.findFirst({
            select: { id: true },
            orderBy: { createdAt: 'asc' },
          });
          companyId = firstCompany?.id;
        }

        if (!companyId) {
          return errorResponse('Company required', 'No company found', 400);
        }

        // Create bulk operation record
        const operation = await (tenantPrisma as any).bulkOperation.create({
          data: {
            tenantId: tenantContext.id,
            companyId,
            type: validatedData.type,
            title: validatedData.title,
            description: validatedData.description || null,
            status: 'pending',
            affectedCount: 0,
            successCount: 0,
            failedCount: 0,
            parameters: validatedData.parameters as Prisma.InputJsonValue,
            createdBy: userId,
            startedAt: new Date(),
          },
        });

        // Log audit
        logCreate(tenantContext, auditContext, 'BulkOperation', operation.id, companyId || '', {
          type: operation.type,
          title: operation.title,
        });

        // Execute operation based on type
        let executed = false;
        let result: any = {};

        try {
          switch (validatedData.type) {
            case 'rent_increase':
              result = await executeRentIncrease(tenantPrisma, validatedData.parameters, validatedData.entityIds);
              executed = true;
              break;
            case 'fee_update':
              result = await executeFeeUpdate(tenantPrisma, validatedData.parameters, validatedData.entityIds);
              executed = true;
              break;
            default:
              // Other types can be implemented later
              break;
          }

          // Update operation with results
          if (executed) {
            await (tenantPrisma as any).bulkOperation.update({
              where: { id: operation.id },
              data: {
                status: result.failedCount > 0 ? 'completed' : 'completed',
                affectedCount: result.affectedCount || 0,
                successCount: result.successCount || 0,
                failedCount: result.failedCount || 0,
                results: result as Prisma.InputJsonValue,
                completedAt: new Date(),
              },
            });
          }
        } catch (error) {
          // Update operation as failed
          await (tenantPrisma as any).bulkOperation.update({
            where: { id: operation.id },
            data: {
              status: 'failed',
              results: { error: error instanceof Error ? error.message : 'Unknown error' } as Prisma.InputJsonValue,
              completedAt: new Date(),
            },
          });
          throw error;
        }

        return successResponse({ operation, executed });
      } catch (error) {
        if (error instanceof z.ZodError) {
          const firstError = error.issues[0];
          return errorResponse('Validation error', firstError?.message || 'Invalid input', 400);
        }
        console.error('Error creating bulk operation:', error);
        return errorResponse(
          'Failed to create bulk operation',
          error instanceof Error ? error.message : 'Unknown error',
          500
        );
      }
    }
  );
}

// Helper function: Execute rent increase
async function executeRentIncrease(
  tenantPrisma: any,
  parameters: any,
  entityIds?: string[]
): Promise<{ affectedCount: number; successCount: number; failedCount: number; details: any[] }> {
  const { apartmentIds, contractIds, increaseType, increaseValue, effectiveDate, notifyTenants, createNewPayments } = parameters;

  // Find contracts to update
  const whereClause: any = {
    status: 'active',
  };

  if (contractIds && contractIds.length > 0) {
    whereClause.id = { in: contractIds };
  } else if (apartmentIds && apartmentIds.length > 0) {
    whereClause.apartmentId = { in: apartmentIds };
  }

  const contracts = await tenantPrisma.contract.findMany({
    where: whereClause,
    include: {
      apartment: true,
      tenantRecord: true,
    },
  });

  let successCount = 0;
  let failedCount = 0;
  const details: any[] = [];

  for (const contract of contracts) {
    try {
      const currentRent = Number(contract.monthlyRent || 0);
      let newRent = currentRent;

      if (increaseType === 'percentage') {
        newRent = currentRent * (1 + increaseValue / 100);
      } else if (increaseType === 'fixed') {
        newRent = currentRent + increaseValue;
      }

      // Update contract
      await tenantPrisma.contract.update({
        where: { id: contract.id },
        data: {
          monthlyRent: new Prisma.Decimal(newRent),
          // Update effective date if provided
          ...(effectiveDate && { startDate: new Date(effectiveDate) }),
        },
      });

      // Create new payment if requested
      if (createNewPayments && effectiveDate) {
        await tenantPrisma.payment.create({
          data: {
            tenantId: contract.tenantId,
            companyId: contract.companyId,
            apartmentId: contract.apartmentId,
            contractId: contract.id,
            type: 'rent',
            amount: new Prisma.Decimal(newRent),
            currency: contract.currency || 'TRY',
            dueDate: new Date(effectiveDate),
            status: 'pending',
            reminderSent: false,
          },
        });
      }

      // Send notification if requested
      if (notifyTenants) {
        await tenantPrisma.notification.create({
          data: {
            title: 'Kira Artışı Bildirimi',
            message: `${contract.apartment?.unitNumber || 'Daire'} için kira ${increaseType === 'percentage' ? `%${increaseValue}` : `${increaseValue} ${contract.currency || 'TRY'}`} artırıldı. Yeni kira: ${newRent.toLocaleString('tr-TR', { style: 'currency', currency: contract.currency || 'TRY' })}`,
            type: 'info',
            priority: 'medium',
            isGlobal: false,
            module: 'real-estate',
            data: {
              contractId: contract.id,
              apartmentId: contract.apartmentId,
              oldRent: currentRent,
              newRent: newRent,
              increaseType,
              increaseValue,
              type: 'rent_increase_notification',
            },
            actionUrl: `/modules/real-estate/contracts/${contract.id}`,
            actionText: 'Sözleşmeyi Görüntüle',
          },
        });
      }

      details.push({
        contractId: contract.id,
        apartmentId: contract.apartmentId,
        oldRent: currentRent,
        newRent: newRent,
        success: true,
      });

      successCount++;
    } catch (error) {
      failedCount++;
      details.push({
        contractId: contract.id,
        apartmentId: contract.apartmentId,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      });
    }
  }

  return {
    affectedCount: contracts.length,
    successCount,
    failedCount,
    details,
  };
}

// Helper function: Execute fee update
async function executeFeeUpdate(
  tenantPrisma: any,
  parameters: any,
  entityIds?: string[]
): Promise<{ affectedCount: number; successCount: number; failedCount: number; details: any[] }> {
  const { apartmentIds, feeType, newAmount, notifyTenants } = parameters;

  // Find apartments to update
  const whereClause: any = {};
  if (apartmentIds && apartmentIds.length > 0) {
    whereClause.id = { in: apartmentIds };
  }

  const apartments = await tenantPrisma.apartment.findMany({
    where: whereClause,
    include: {
      property: true,
    },
  });

  let successCount = 0;
  let failedCount = 0;
  const details: any[] = [];

  for (const apartment of apartments) {
    try {
      // Update apartment fees based on type
      const updateData: any = {};
      if (feeType === 'maintenance') {
        updateData.maintenanceFee = new Prisma.Decimal(newAmount);
      } else if (feeType === 'utility') {
        updateData.utilityFee = new Prisma.Decimal(newAmount);
      }

      await tenantPrisma.apartment.update({
        where: { id: apartment.id },
        data: updateData,
      });

      // Send notification if requested
      if (notifyTenants) {
        const activeContract = await tenantPrisma.contract.findFirst({
          where: {
            apartmentId: apartment.id,
            status: 'active',
          },
          include: {
            tenantRecord: true,
          },
        });

        if (activeContract) {
          await tenantPrisma.notification.create({
            data: {
              title: 'Aidat Güncelleme Bildirimi',
              message: `${apartment.unitNumber} dairesi için ${feeType === 'maintenance' ? 'bakım' : 'fatura'} aidatı güncellendi. Yeni tutar: ${newAmount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}`,
              type: 'info',
              priority: 'medium',
              isGlobal: false,
              module: 'real-estate',
              data: {
                apartmentId: apartment.id,
                contractId: activeContract.id,
                feeType,
                newAmount,
                type: 'fee_update_notification',
              },
              actionUrl: `/modules/real-estate/apartments/${apartment.id}`,
              actionText: 'Daireyi Görüntüle',
            },
          });
        }
      }

      details.push({
        apartmentId: apartment.id,
        feeType,
        newAmount,
        success: true,
      });

      successCount++;
    } catch (error) {
      failedCount++;
      details.push({
        apartmentId: apartment.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      });
    }
  }

  return {
    affectedCount: apartments.length,
    successCount,
    failedCount,
    details,
  };
}

