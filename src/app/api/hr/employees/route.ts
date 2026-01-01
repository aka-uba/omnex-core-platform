import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { employeeCreateSchema } from '@/modules/hr/schemas/hr.schema';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { Prisma } from '@prisma/tenant-client';
import { getAuditContext, logCreate } from '@/lib/api/auditHelper';
// GET /api/hr/employees - List employees
export async function GET(request: NextRequest) {
  return withTenant<ApiResponse<{ employees: unknown[]; total: number; page: number; pageSize: number }>>(
    request,
    async (tenantPrisma) => {
      const searchParams = request.nextUrl.searchParams;
      
      // Parse query parameters
      const page = parseInt(searchParams.get('page') || '1', 10) || 1;
      const pageSize = parseInt(searchParams.get('pageSize') || '10', 10) || 10;
      const search = searchParams.get('search') || undefined;
      const department = searchParams.get('department') || undefined;
      const position = searchParams.get('position') || undefined;
      const workType = searchParams.get('workType') || undefined;
      const isActive = searchParams.get('isActive') === 'true' ? true : searchParams.get('isActive') === 'false' ? false : undefined;
      const managerId = searchParams.get('managerId') || undefined;
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
      const where: Prisma.EmployeeWhereInput = {
        tenantId: tenantContext.id,
        ...(finalCompanyId && { companyId: finalCompanyId }),
        ...(search && {
          OR: [
            { employeeNumber: { contains: search, mode: 'insensitive' } },
            { department: { contains: search, mode: 'insensitive' } },
            { position: { contains: search, mode: 'insensitive' } },
            { user: { name: { contains: search, mode: 'insensitive' } } },
            { user: { email: { contains: search, mode: 'insensitive' } } },
          ],
        }),
        ...(department && { department }),
        ...(position && { position }),
        ...(workType && { workType }),
        ...(isActive !== undefined && { isActive }),
        ...(managerId && { managerId }),
      };

      // Get total count
      const total = await tenantPrisma.employee.count({ where });

      // Get paginated employees
      const employees = await tenantPrisma.employee.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          manager: {
            select: {
              id: true,
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
        employees: employees.map(employee => ({
          ...employee,
          salary: employee.salary ? Number(employee.salary) : null,
          hireDate: employee.hireDate.toISOString(),
          createdAt: employee.createdAt.toISOString(),
          updatedAt: employee.updatedAt.toISOString(),
        })),
        total,
        page,
        pageSize,
      });
    },
    { required: true, module: 'hr' }
  );
}

// POST /api/hr/employees - Create employee
export async function POST(request: NextRequest) {
  return withTenant<ApiResponse<{ employee: unknown }>>(
    request,
    async (tenantPrisma) => {
      const body = await request.json();

      // Validate request body
      const validatedData = employeeCreateSchema.parse(body);

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

      // Verify user exists
      const user = await tenantPrisma.user.findUnique({
        where: { id: validatedData.userId },
        select: { id: true },
      });

      if (!user) {
        return errorResponse('Validation error', 'User not found', 404);
      }

      // Check if employee already exists for this user
      const existingEmployee = await tenantPrisma.employee.findUnique({
        where: { userId: validatedData.userId },
      });

      if (existingEmployee) {
        return errorResponse('Validation error', 'Employee already exists for this user', 409);
      }

      // Verify manager if provided
      if (validatedData.managerId) {
        const manager = await tenantPrisma.employee.findUnique({
          where: { id: validatedData.managerId },
          select: { id: true, tenantId: true },
        });

        if (!manager || manager.tenantId !== tenantContext.id) {
          return errorResponse('Validation error', 'Manager not found', 404);
        }
      }

      // Create employee
      const newEmployee = await tenantPrisma.employee.create({
        data: {
          tenantId: tenantContext.id,
          companyId: companyId,
          userId: validatedData.userId,
          employeeNumber: validatedData.employeeNumber,
          department: validatedData.department,
          position: validatedData.position,
          hireDate: new Date(validatedData.hireDate),
          managerId: validatedData.managerId || null,
          salary: validatedData.salary || null,
          salaryGroup: validatedData.salaryGroup || null,
          currency: validatedData.currency || 'TRY',
          workType: validatedData.workType,
          metadata: validatedData.metadata ? (validatedData.metadata as any) : null,
          isActive: true,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          manager: {
            select: {
              id: true,
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
      logCreate(tenantContext, auditContext, 'Employee', newEmployee.id, companyId, {
        employeeNumber: newEmployee.employeeNumber,
      });

      return successResponse({
        employee: {
          ...newEmployee,
          salary: newEmployee.salary ? Number(newEmployee.salary) : null,
          hireDate: newEmployee.hireDate.toISOString(),
          createdAt: newEmployee.createdAt.toISOString(),
          updatedAt: newEmployee.updatedAt.toISOString(),
        },
      });
    },
    { required: true, module: 'hr' }
  );
}

