import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { realEstateMaintenanceRecordCreateSchema } from '@/modules/real-estate/schemas/maintenance-record.schema';
import { Prisma } from '@prisma/tenant-client';
import { z } from 'zod';

// GET /api/real-estate/maintenance - List maintenance records
export async function GET(request: NextRequest) {
  return withTenant<ApiResponse<{ records: unknown[]; total: number; page: number; pageSize: number }>>(
    request,
    async (tenantPrisma) => {
      const searchParams = request.nextUrl.searchParams;
      
      // Parse query parameters
      const page = parseInt(searchParams.get('page') || '1', 10) || 1;
      const pageSize = parseInt(searchParams.get('pageSize') || '10', 10) || 10;
      const search = searchParams.get('search') || undefined;
      const type = searchParams.get('type') || undefined;
      const status = searchParams.get('status') || undefined;
      const apartmentId = searchParams.get('apartmentId') || undefined;
      const propertyId = searchParams.get('propertyId') || undefined;
      const assignedStaffId = searchParams.get('assignedStaffId') || undefined;
      const scheduledDateFrom = searchParams.get('scheduledDateFrom') || undefined;
      const scheduledDateTo = searchParams.get('scheduledDateTo') || undefined;
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
      const where: Prisma.RealEstateMaintenanceRecordWhereInput = {
        tenantId: tenantContext.id,
        ...(finalCompanyId && { companyId: finalCompanyId }),
        ...(type && { type }),
        ...(status && { status }),
        ...(apartmentId && { apartmentId }),
        ...(propertyId && {
          apartment: {
            propertyId,
          },
        }),
        ...(assignedStaffId && { assignedStaffId }),
        ...(scheduledDateFrom && {
          scheduledDate: {
            gte: new Date(scheduledDateFrom),
          },
        }),
        ...(scheduledDateTo && {
          scheduledDate: {
            ...(scheduledDateFrom ? { gte: new Date(scheduledDateFrom) } : {}),
            lte: new Date(scheduledDateTo),
          },
        }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { notes: { contains: search, mode: 'insensitive' } },
          ],
        }),
      };

      // Get total count
      const total = await tenantPrisma.realEstateMaintenanceRecord.count({ where });

      // Get records
      const records = await tenantPrisma.realEstateMaintenanceRecord.findMany({
        where,
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
        },
        orderBy: { scheduledDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      });

      return successResponse({
        records,
        total,
        page,
        pageSize,
      });
    }
  );
}

// POST /api/real-estate/maintenance - Create maintenance record
export async function POST(request: NextRequest) {
  return withTenant<ApiResponse<{ record: unknown }>>(
    request,
    async (tenantPrisma) => {
      try {
        const body = await request.json();

        // Validate input
        const validatedData = realEstateMaintenanceRecordCreateSchema.parse(body);

        // Get tenant context
        const tenantContext = await getTenantFromRequest(request);
        if (!tenantContext) {
          return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
        }

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

        // Create record
        const record = await tenantPrisma.realEstateMaintenanceRecord.create({
          data: {
            tenantId: tenantContext.id,
            companyId,
            apartmentId: validatedData.apartmentId,
            type: validatedData.type,
            title: validatedData.title,
            description: validatedData.description || null,
            status: validatedData.status || 'scheduled',
            scheduledDate: new Date(validatedData.scheduledDate),
            startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
            endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
            assignedStaffId: validatedData.assignedStaffId || null,
            performedByStaffId: validatedData.performedByStaffId || null,
            estimatedCost: validatedData.estimatedCost ? new Prisma.Decimal(validatedData.estimatedCost) : null,
            actualCost: validatedData.actualCost ? new Prisma.Decimal(validatedData.actualCost) : null,
            documents: validatedData.documents || [],
            photos: validatedData.photos || [],
            notes: validatedData.notes || null,
          },
        });

        return successResponse({ record });
      } catch (error) {
        if (error instanceof z.ZodError) {
          const firstError = error.issues[0];
          return errorResponse('Validation error', firstError?.message || 'Invalid input', 400);
        }
        console.error('Error creating maintenance record:', error);
        return errorResponse(
          'Failed to create maintenance record',
          error instanceof Error ? error.message : 'Unknown error',
          500
        );
      }
    }
  );
}

