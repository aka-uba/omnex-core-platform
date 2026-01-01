import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { maintenanceRecordCreateSchema } from '@/modules/maintenance/schemas/maintenance.schema';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { Prisma } from '@prisma/tenant-client';
import { getAuditContext, logCreate } from '@/lib/api/auditHelper';
// GET /api/maintenance/records - List maintenance records
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
      const locationId = searchParams.get('locationId') || undefined;
      const equipmentId = searchParams.get('equipmentId') || undefined;
      const assignedTo = searchParams.get('assignedTo') || undefined;
      const performedBy = searchParams.get('performedBy') || undefined;
      const scheduledDateFrom = searchParams.get('scheduledDateFrom') || undefined;
      const scheduledDateTo = searchParams.get('scheduledDateTo') || undefined;
      const isActive = searchParams.get('isActive') === 'true' ? true : searchParams.get('isActive') === 'false' ? false : undefined;
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
      const where: Prisma.MaintenanceRecordWhereInput = {
        tenantId: tenantContext.id,
        ...(finalCompanyId && { companyId: finalCompanyId }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { notes: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(type && { type }),
        ...(status && { status }),
        ...(locationId && { locationId }),
        ...(equipmentId && { equipmentId }),
        ...(assignedTo && { assignedTo }),
        ...(performedBy && { performedBy }),
        ...(scheduledDateFrom && {
          scheduledDate: {
            gte: new Date(scheduledDateFrom),
          },
        }),
        ...(scheduledDateTo && {
          scheduledDate: {
            lte: new Date(scheduledDateTo),
          },
        }),
        ...(isActive !== undefined && { isActive }),
      };

      // Get total count
      const total = await tenantPrisma.maintenanceRecord.count({ where });

      // Get paginated records
      const records = await tenantPrisma.maintenanceRecord.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { scheduledDate: 'desc' },
        include: {
          location: {
            select: {
              id: true,
              name: true,
            },
          },
          equipment: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });

      return successResponse({
        records: records.map(record => ({
          ...record,
          estimatedCost: record.estimatedCost ? Number(record.estimatedCost) : null,
          actualCost: record.actualCost ? Number(record.actualCost) : null,
          scheduledDate: record.scheduledDate.toISOString(),
          startDate: record.startDate?.toISOString() || null,
          endDate: record.endDate?.toISOString() || null,
          createdAt: record.createdAt.toISOString(),
          updatedAt: record.updatedAt.toISOString(),
        })),
        total,
        page,
        pageSize,
      });
    },
    { required: true, module: 'maintenance' }
  );
}

// POST /api/maintenance/records - Create maintenance record
export async function POST(request: NextRequest) {
  return withTenant<ApiResponse<{ record: unknown }>>(
    request,
    async (tenantPrisma) => {
      const body = await request.json();

      // Validate request body
      const validatedData = maintenanceRecordCreateSchema.parse(body);

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Get companyId from first company
      const firstCompany = await tenantPrisma.company.findFirst({
        select: { id: true },
        orderBy: { createdAt: 'asc' },
      });

      if (!firstCompany) {
        return errorResponse('Validation error', 'No company found for tenant', 404);
      }

      const companyId = firstCompany.id;

      // Verify location exists
      const location = await tenantPrisma.location.findUnique({
        where: { id: validatedData.locationId },
        select: { id: true, tenantId: true },
      });

      if (!location || location.tenantId !== tenantContext.id) {
        return errorResponse('Validation error', 'Location not found', 404);
      }

      // Verify equipment exists
      const equipment = await tenantPrisma.equipment.findUnique({
        where: { id: validatedData.equipmentId },
        select: { id: true, tenantId: true },
      });

      if (!equipment || equipment.tenantId !== tenantContext.id) {
        return errorResponse('Validation error', 'Equipment not found', 404);
      }

      // Create maintenance record
      const newRecord = await tenantPrisma.maintenanceRecord.create({
        data: {
          tenantId: tenantContext.id,
          companyId: companyId,
          locationId: validatedData.locationId,
          equipmentId: validatedData.equipmentId,
          type: validatedData.type,
          title: validatedData.title,
          description: validatedData.description || null,
          status: 'scheduled',
          scheduledDate: new Date(validatedData.scheduledDate),
          startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
          endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
          assignedTo: validatedData.assignedTo || null,
          performedBy: validatedData.performedBy || null,
          estimatedCost: validatedData.estimatedCost || null,
          actualCost: validatedData.actualCost || null,
          notes: validatedData.notes || null,
          documents: validatedData.documents || [],
          isActive: true,
        },
        include: {
          location: {
            select: {
              id: true,
              name: true,
            },
          },
          equipment: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });

      // Log audit event
      const auditContext = await getAuditContext(request);
      logCreate(tenantContext, auditContext, 'MaintenanceRecord', newRecord.id, companyId, {
        title: newRecord.title,
        type: newRecord.type,
        status: newRecord.status,
      });

      // Send notification (non-blocking)
      try {
        const userId = request.headers.get('x-user-id') || undefined;
        const { notifyMaintenanceCreated } = await import('@/modules/maintenance/services/maintenanceNotificationService');
        await notifyMaintenanceCreated(
          {
            ...newRecord,
            estimatedCost: newRecord.estimatedCost ? Number(newRecord.estimatedCost) : null,
            actualCost: newRecord.actualCost ? Number(newRecord.actualCost) : null,
            scheduledDate: newRecord.scheduledDate,
            startDate: newRecord.startDate || null,
            endDate: newRecord.endDate || null,
            createdAt: newRecord.createdAt,
            updatedAt: newRecord.updatedAt,
          } as any,
          userId
        );
      } catch (notificationError) {
        // Log but don't fail the request
        console.error('Error sending maintenance created notification:', notificationError);
      }

      return successResponse({
        record: {
          ...newRecord,
          estimatedCost: newRecord.estimatedCost ? Number(newRecord.estimatedCost) : null,
          actualCost: newRecord.actualCost ? Number(newRecord.actualCost) : null,
          scheduledDate: newRecord.scheduledDate.toISOString(),
          startDate: newRecord.startDate?.toISOString() || null,
          endDate: newRecord.endDate?.toISOString() || null,
          createdAt: newRecord.createdAt.toISOString(),
          updatedAt: newRecord.updatedAt.toISOString(),
        },
      });
    },
    { required: true, module: 'maintenance' }
  );
}

