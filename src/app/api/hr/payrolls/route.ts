import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { payrollCreateSchema } from '@/modules/hr/schemas/hr.schema';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { Prisma } from '@prisma/tenant-client';
import { getAuditContext, logCreate } from '@/lib/api/auditHelper';
// GET /api/hr/payrolls - List payrolls
export async function GET(request: NextRequest) {
  return withTenant<ApiResponse<{ payrolls: unknown[]; total: number; page: number; pageSize: number }>>(
    request,
    async (tenantPrisma) => {
      const searchParams = request.nextUrl.searchParams;
      
      // Parse query parameters
      const page = parseInt(searchParams.get('page') || '1', 10) || 1;
      const pageSize = parseInt(searchParams.get('pageSize') || '10', 10) || 10;
      const search = searchParams.get('search') || undefined;
      const employeeId = searchParams.get('employeeId') || undefined;
      const period = searchParams.get('period') || undefined;
      const status = searchParams.get('status') || undefined;
      const payDateFrom = searchParams.get('payDateFrom') || undefined;
      const payDateTo = searchParams.get('payDateTo') || undefined;
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
      const where: Prisma.PayrollWhereInput = {
        tenantId: tenantContext.id,
        ...(finalCompanyId && { companyId: finalCompanyId }),
        ...(search && {
          OR: [
            { period: { contains: search, mode: 'insensitive' } },
            { notes: { contains: search, mode: 'insensitive' } },
            { employee: { employeeNumber: { contains: search, mode: 'insensitive' } } },
            { employee: { user: { name: { contains: search, mode: 'insensitive' } } } },
            { employee: { user: { email: { contains: search, mode: 'insensitive' } } } },
          ],
        }),
        ...(employeeId && { employeeId }),
        ...(period && { period }),
        ...(status && { status }),
        ...(payDateFrom && {
          payDate: {
            gte: new Date(payDateFrom),
          },
        }),
        ...(payDateTo && {
          payDate: {
            lte: new Date(payDateTo),
          },
        }),
      };

      // Get total count
      const total = await tenantPrisma.payroll.count({ where });

      // Get paginated payrolls
      const payrolls = await tenantPrisma.payroll.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { payDate: 'desc' },
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
        payrolls: payrolls.map(payroll => ({
          ...payroll,
          grossSalary: Number(payroll.grossSalary),
          deductions: Number(payroll.deductions),
          netSalary: Number(payroll.netSalary),
          taxDeduction: payroll.taxDeduction ? Number(payroll.taxDeduction) : null,
          sgkDeduction: payroll.sgkDeduction ? Number(payroll.sgkDeduction) : null,
          otherDeductions: payroll.otherDeductions ? Number(payroll.otherDeductions) : null,
          bonuses: Number(payroll.bonuses),
          overtime: Number(payroll.overtime),
          payDate: payroll.payDate.toISOString(),
          createdAt: payroll.createdAt.toISOString(),
          updatedAt: payroll.updatedAt.toISOString(),
        })),
        total,
        page,
        pageSize,
      });
    },
    { required: true, module: 'hr' }
  );
}

// POST /api/hr/payrolls - Create payroll
export async function POST(request: NextRequest) {
  return withTenant<ApiResponse<{ payroll: unknown }>>(
    request,
    async (tenantPrisma) => {
      const body = await request.json();

      // Validate request body
      const validatedData = payrollCreateSchema.parse(body);

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

      // Create payroll
      const newPayroll = await tenantPrisma.payroll.create({
        data: {
          tenantId: tenantContext.id,
          companyId: companyId,
          employeeId: validatedData.employeeId,
          period: validatedData.period,
          payDate: new Date(validatedData.payDate),
          grossSalary: validatedData.grossSalary,
          deductions: validatedData.deductions || 0,
          netSalary: validatedData.netSalary,
          taxDeduction: validatedData.taxDeduction || null,
          sgkDeduction: validatedData.sgkDeduction || null,
          otherDeductions: validatedData.otherDeductions || null,
          bonuses: validatedData.bonuses || 0,
          overtime: validatedData.overtime || 0,
          status: 'draft',
          notes: validatedData.notes || null,
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
      logCreate(tenantContext, auditContext, 'Payroll', newPayroll.id, companyId, {
        period: newPayroll.period,
      });

      return successResponse({
        payroll: {
          ...newPayroll,
          grossSalary: Number(newPayroll.grossSalary),
          deductions: Number(newPayroll.deductions),
          netSalary: Number(newPayroll.netSalary),
          taxDeduction: newPayroll.taxDeduction ? Number(newPayroll.taxDeduction) : null,
          sgkDeduction: newPayroll.sgkDeduction ? Number(newPayroll.sgkDeduction) : null,
          otherDeductions: newPayroll.otherDeductions ? Number(newPayroll.otherDeductions) : null,
          bonuses: Number(newPayroll.bonuses),
          overtime: Number(newPayroll.overtime),
          payDate: newPayroll.payDate.toISOString(),
          createdAt: newPayroll.createdAt.toISOString(),
          updatedAt: newPayroll.updatedAt.toISOString(),
        },
      });
    },
    { required: true, module: 'hr' }
  );
}

