import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { getCompanyIdFromRequest, getCompanyIdFromBody } from '@/lib/api/companyContext';
import { reportCreateSchema } from '@/modules/raporlar/schemas/report.schema';
import { Prisma } from '@prisma/tenant-client';
import { verifyAuth } from '@/lib/auth/jwt';

// GET /api/reports - List reports
export async function GET(request: NextRequest) {
  return withTenant<ApiResponse<{ reports: unknown[]; total: number; page: number; pageSize: number }>>(
    request,
    async (tenantPrisma) => {
      try {
        const authResult = await verifyAuth(request);
        if (!authResult.valid || !authResult.payload) {
          return errorResponse('Unauthorized', 'Authentication required', 401);
        }

        const searchParams = request.nextUrl.searchParams;
        
        // Parse query parameters with defaults
        const page = parseInt(searchParams.get('page') || '1', 10) || 1;
        const pageSize = parseInt(searchParams.get('pageSize') || '10', 10) || 10;
        const search = searchParams.get('search') || undefined;
        const reportType = searchParams.get('reportType') || undefined;
        const status = searchParams.get('status') || undefined;
        const userId = searchParams.get('userId') || undefined;
        const companyId = searchParams.get('companyId') || undefined;

        // Get tenant context
        const tenantContext = await getTenantFromRequest(request);
        if (!tenantContext) {
          return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
        }

        // Get companyId from query or use first company
        let finalCompanyId: string | undefined = companyId;
        if (!finalCompanyId) {
          finalCompanyId = (await getCompanyIdFromRequest(request, tenantPrisma)) || undefined;
        }

        if (!finalCompanyId) {
          return errorResponse('Company required', 'No company found', 400);
        }

        // Build where clause
        const where: Prisma.ReportWhereInput = {
          tenantId: tenantContext.id,
          companyId: finalCompanyId,
          ...(reportType && { reportType }),
          ...(status && { status }),
          ...(userId && { userId }),
          ...(search && {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }),
        };

        // Get total count
        const total = await tenantPrisma.report.count({ where });

        // Get reports
        const reports = await tenantPrisma.report.findMany({
          where,
          include: {
            user: {
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
          reports: reports.map(report => ({
            ...report,
            dateRange: report.dateRange ? JSON.parse(JSON.stringify(report.dateRange)) : null,
            filters: report.filters ? JSON.parse(JSON.stringify(report.filters)) : {},
            createdAt: report.createdAt.toISOString(),
            updatedAt: report.updatedAt.toISOString(),
            completedAt: report.completedAt?.toISOString() || null,
          })),
          total,
          page,
          pageSize,
        });
      } catch (error: any) {
        console.error('Error fetching reports:', error);
        return errorResponse(
          'Failed to fetch reports',
          error?.message || 'An error occurred while fetching reports',
          500
        );
      }
    },
    { required: true, module: 'raporlar' }
  );
}

// POST /api/reports - Create report
export async function POST(request: NextRequest) {
  return withTenant<ApiResponse<{ report: unknown }>>(
    request,
    async (tenantPrisma) => {
      try {
        const authResult = await verifyAuth(request);
        if (!authResult.valid || !authResult.payload) {
          return errorResponse('Unauthorized', 'Authentication required', 401);
        }

        const body = await request.json();

        // Validate input
        const validatedData = reportCreateSchema.parse(body);

        // Get tenant context
        const tenantContext = await getTenantFromRequest(request);
        if (!tenantContext) {
          return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
        }

        // Get companyId from body or use first company
        const companyId = await getCompanyIdFromBody(body, tenantPrisma);
        if (!companyId) {
          return errorResponse('Company required', 'No company found', 400);
        }

        // Get userId from auth payload
        const userId = (authResult.payload as any).userId || (authResult.payload as any).id;
        if (!userId) {
          return errorResponse('User required', 'User ID not found in token', 400);
        }

        // Create report
        const report = await tenantPrisma.report.create({
          data: {
            tenantId: tenantContext.id,
            companyId: companyId,
            userId: userId,
            name: validatedData.name,
            reportType: validatedData.type,
            description: validatedData.description || null,
            dateRange: validatedData.dateRange ? JSON.parse(JSON.stringify(validatedData.dateRange)) : null,
            filters: validatedData.filters ? JSON.parse(JSON.stringify(validatedData.filters)) : null,
            visualization: validatedData.visualization ? JSON.stringify(validatedData.visualization) : null,
            status: 'pending',
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        return successResponse({
          report: {
            ...report,
            dateRange: report.dateRange ? JSON.parse(JSON.stringify(report.dateRange)) : null,
            filters: report.filters ? JSON.parse(JSON.stringify(report.filters)) : {},
            visualization: report.visualization ? JSON.parse(report.visualization) : null,
            createdAt: report.createdAt.toISOString(),
            updatedAt: report.updatedAt.toISOString(),
            completedAt: report.completedAt?.toISOString() || null,
          },
        });
      } catch (error: any) {
        console.error('Error creating report:', error);
        
        // Handle Zod validation errors
        if (error.name === 'ZodError') {
          return errorResponse(
            'Validation error',
            'Invalid request data',
            400,
            error.errors
          );
        }

        return errorResponse(
          'Failed to create report',
          error?.message || 'An error occurred while creating report',
          500
        );
      }
    },
    { required: true, module: 'raporlar' }
  );
}







