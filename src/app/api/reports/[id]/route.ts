import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { verifyAuth } from '@/lib/auth/jwt';

// GET /api/reports/[id] - Get single report
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withTenant<ApiResponse<{ report: unknown }>>(
    request,
    async (tenantPrisma) => {
      try {
        const authResult = await verifyAuth(request);
        if (!authResult.valid || !authResult.payload) {
          return errorResponse('Unauthorized', 'Authentication required', 401);
        }

        const { id } = await params;

        // Get tenant context
        const tenantContext = await getTenantFromRequest(request);
        if (!tenantContext) {
          return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
        }

        // Get report
        const report = await tenantPrisma.report.findUnique({
          where: { id },
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

        if (!report) {
          return errorResponse('Report not found', 'Report not found', 404);
        }

        // Check tenant access
        if (report.tenantId !== tenantContext.id) {
          return errorResponse('Forbidden', 'Access denied', 403);
        }

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
        console.error('Error fetching report:', error);
        return errorResponse(
          'Failed to fetch report',
          error?.message || 'An error occurred while fetching report',
          500
        );
      }
    },
    { required: true, module: 'raporlar' }
  );
}

// PATCH /api/reports/[id] - Update report
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withTenant<ApiResponse<{ report: unknown }>>(
    request,
    async (tenantPrisma) => {
      try {
        const authResult = await verifyAuth(request);
        if (!authResult.valid || !authResult.payload) {
          return errorResponse('Unauthorized', 'Authentication required', 401);
        }

        const { id } = await params;
        const body = await request.json();

        // Get tenant context
        const tenantContext = await getTenantFromRequest(request);
        if (!tenantContext) {
          return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
        }

        // Get report
        const existingReport = await tenantPrisma.report.findUnique({
          where: { id },
        });

        if (!existingReport) {
          return errorResponse('Report not found', 'Report not found', 404);
        }

        // Check tenant access
        if (existingReport.tenantId !== tenantContext.id) {
          return errorResponse('Forbidden', 'Access denied', 403);
        }

        // Update report
        const report = await tenantPrisma.report.update({
          where: { id },
          data: {
            ...(body.name && { name: body.name }),
            ...(body.description !== undefined && { description: body.description }),
            ...(body.status && { status: body.status }),
            ...(body.outputUrl !== undefined && { outputUrl: body.outputUrl }),
            ...(body.errorMessage !== undefined && { errorMessage: body.errorMessage }),
            ...(body.completedAt !== undefined && { completedAt: body.completedAt ? new Date(body.completedAt) : null }),
            ...(body.dateRange && { dateRange: JSON.parse(JSON.stringify(body.dateRange)) }),
            ...(body.filters && { filters: JSON.parse(JSON.stringify(body.filters)) }),
            ...(body.visualization && { visualization: JSON.stringify(body.visualization) }),
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
        console.error('Error updating report:', error);
        return errorResponse(
          'Failed to update report',
          error?.message || 'An error occurred while updating report',
          500
        );
      }
    },
    { required: true, module: 'raporlar' }
  );
}

// DELETE /api/reports/[id] - Delete report
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withTenant<ApiResponse<{ success: boolean }>>(
    request,
    async (tenantPrisma) => {
      try {
        const authResult = await verifyAuth(request);
        if (!authResult.valid || !authResult.payload) {
          return errorResponse('Unauthorized', 'Authentication required', 401);
        }

        const { id } = await params;

        // Get tenant context
        const tenantContext = await getTenantFromRequest(request);
        if (!tenantContext) {
          return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
        }

        // Get report
        const report = await tenantPrisma.report.findUnique({
          where: { id },
        });

        if (!report) {
          return errorResponse('Report not found', 'Report not found', 404);
        }

        // Check tenant access
        if (report.tenantId !== tenantContext.id) {
          return errorResponse('Forbidden', 'Access denied', 403);
        }

        // Delete report
        await tenantPrisma.report.delete({
          where: { id },
        });

        return successResponse({ success: true });
      } catch (error: any) {
        console.error('Error deleting report:', error);
        return errorResponse(
          'Failed to delete report',
          error?.message || 'An error occurred while deleting report',
          500
        );
      }
    },
    { required: true, module: 'raporlar' }
  );
}















