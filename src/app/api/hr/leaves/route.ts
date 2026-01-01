import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { leaveCreateSchema } from '@/modules/hr/schemas/hr.schema';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { Prisma } from '@prisma/tenant-client';
import { getAuditContext, logCreate } from '@/lib/api/auditHelper';
// GET /api/hr/leaves - List leaves
export async function GET(request: NextRequest) {
  return withTenant<ApiResponse<{ leaves: unknown[]; total: number; page: number; pageSize: number }>>(
    request,
    async (tenantPrisma) => {
      const searchParams = request.nextUrl.searchParams;
      
      // Parse query parameters
      const page = parseInt(searchParams.get('page') || '1', 10) || 1;
      const pageSize = parseInt(searchParams.get('pageSize') || '10', 10) || 10;
      const search = searchParams.get('search') || undefined;
      const employeeId = searchParams.get('employeeId') || undefined;
      const type = searchParams.get('type') || undefined;
      const status = searchParams.get('status') || undefined;
      const startDateFrom = searchParams.get('startDateFrom') || undefined;
      const startDateTo = searchParams.get('startDateTo') || undefined;
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
      const where: Prisma.LeaveWhereInput = {
        tenantId: tenantContext.id,
        ...(finalCompanyId && { companyId: finalCompanyId }),
        ...(search && {
          OR: [
            { reason: { contains: search, mode: 'insensitive' } },
            { employee: { employeeNumber: { contains: search, mode: 'insensitive' } } },
            { employee: { user: { name: { contains: search, mode: 'insensitive' } } } },
            { employee: { user: { email: { contains: search, mode: 'insensitive' } } } },
          ],
        }),
        ...(employeeId && { employeeId }),
        ...(type && { type }),
        ...(status && { status }),
        ...(startDateFrom && {
          startDate: {
            gte: new Date(startDateFrom),
          },
        }),
        ...(startDateTo && {
          startDate: {
            lte: new Date(startDateTo),
          },
        }),
      };

      // Get total count
      const total = await tenantPrisma.leave.count({ where });

      // Get paginated leaves
      const leaves = await tenantPrisma.leave.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { startDate: 'desc' },
        include: {
          employee: {
            select: {
              id: true,
              employeeNumber: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      return successResponse({
        leaves: leaves.map(leave => ({
          ...leave,
          startDate: leave.startDate.toISOString(),
          endDate: leave.endDate.toISOString(),
          approvedAt: leave.approvedAt?.toISOString() || null,
          createdAt: leave.createdAt.toISOString(),
          updatedAt: leave.updatedAt.toISOString(),
        })),
        total,
        page,
        pageSize,
      });
    },
    { required: true, module: 'hr' }
  );
}

// POST /api/hr/leaves - Create leave
export async function POST(request: NextRequest) {
  return withTenant<ApiResponse<{ leave: unknown }>>(
    request,
    async (tenantPrisma) => {
      const body = await request.json();

      // Validate request body
      const validatedData = leaveCreateSchema.parse(body);

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

      // Verify employee exists
      const employee = await tenantPrisma.employee.findUnique({
        where: { id: validatedData.employeeId },
        select: { id: true, tenantId: true },
      });

      if (!employee || employee.tenantId !== tenantContext.id) {
        return errorResponse('Validation error', 'Employee not found', 404);
      }

      // Calculate days
      const startDate = new Date(validatedData.startDate);
      const endDate = new Date(validatedData.endDate);
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      // Create leave
      const newLeave = await tenantPrisma.leave.create({
        data: {
          tenantId: tenantContext.id,
          companyId: companyId,
          employeeId: validatedData.employeeId,
          type: validatedData.type,
          startDate: startDate,
          endDate: endDate,
          days: validatedData.days || days,
          reason: validatedData.reason || null,
          status: 'pending',
        },
        include: {
          employee: {
            select: {
              id: true,
              employeeNumber: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      // Log audit event
      const auditContext = await getAuditContext(request);
      logCreate(tenantContext, auditContext, 'Leave', newLeave.id, companyId, {
        type: newLeave.type,
        status: newLeave.status,
      });

      return successResponse({
        leave: {
          ...newLeave,
          startDate: newLeave.startDate.toISOString(),
          endDate: newLeave.endDate.toISOString(),
          approvedAt: newLeave.approvedAt?.toISOString() || null,
          createdAt: newLeave.createdAt.toISOString(),
          updatedAt: newLeave.updatedAt.toISOString(),
        },
      });
    },
    { required: true, module: 'hr' }
  );
}







