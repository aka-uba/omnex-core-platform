import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { bulkOperationUpdateSchema } from '@/modules/real-estate/schemas/bulk-operation.schema';
import { z } from 'zod';

// GET /api/real-estate/bulk-operations/[id] - Get single bulk operation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withTenant<ApiResponse<{ operation: unknown }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Get operation
      const operation = await (tenantPrisma as any).bulkOperation.findUnique({
        where: { id },
        include: {
          createdByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!operation) {
        return errorResponse('Operation not found', 'Bulk operation not found', 404);
      }

      // Check tenant access
      if (operation.tenantId !== tenantContext.id) {
        return errorResponse('Forbidden', 'Access denied', 403);
      }

      return successResponse({ operation });
    }
  );
}

// PATCH /api/real-estate/bulk-operations/[id] - Update bulk operation
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withTenant<ApiResponse<{ operation: unknown }>>(
    request,
    async (tenantPrisma) => {
      try {
        const { id } = await params;
        const body = await request.json();

        // Get tenant context
        const tenantContext = await getTenantFromRequest(request);
        if (!tenantContext) {
          return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
        }

        // Get existing operation
        const existing = await (tenantPrisma as any).bulkOperation.findUnique({
          where: { id },
        });

        if (!existing) {
          return errorResponse('Operation not found', 'Bulk operation not found', 404);
        }

        // Check tenant access
        if (existing.tenantId !== tenantContext.id) {
          return errorResponse('Forbidden', 'Access denied', 403);
        }

        // Validate input
        const validatedData = bulkOperationUpdateSchema.parse(body);

        // Update operation
        const operation = await (tenantPrisma as any).bulkOperation.update({
          where: { id },
          data: {
            ...(validatedData.status && { status: validatedData.status }),
            ...(validatedData.affectedCount !== undefined && { affectedCount: validatedData.affectedCount }),
            ...(validatedData.successCount !== undefined && { successCount: validatedData.successCount }),
            ...(validatedData.failedCount !== undefined && { failedCount: validatedData.failedCount }),
            ...(validatedData.results !== undefined && { results: validatedData.results }),
            ...(validatedData.startedAt !== undefined && { startedAt: validatedData.startedAt ? new Date(validatedData.startedAt) : null }),
            ...(validatedData.completedAt !== undefined && { completedAt: validatedData.completedAt ? new Date(validatedData.completedAt) : null }),
          },
        });

        return successResponse({ operation });
      } catch (error) {
        if (error instanceof z.ZodError) {
          const firstError = error.issues[0];
          return errorResponse('Validation error', firstError?.message || 'Invalid input', 400);
        }
        console.error('Error updating bulk operation:', error);
        return errorResponse(
          'Failed to update bulk operation',
          error instanceof Error ? error.message : 'Unknown error',
          500
        );
      }
    }
  );
}

// DELETE /api/real-estate/bulk-operations/[id] - Delete bulk operation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withTenant<ApiResponse<{ success: boolean }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Get existing operation
      const existing = await (tenantPrisma as any).bulkOperation.findUnique({
        where: { id },
      });

      if (!existing) {
        return errorResponse('Operation not found', 'Bulk operation not found', 404);
      }

      // Check tenant access
      if (existing.tenantId !== tenantContext.id) {
        return errorResponse('Forbidden', 'Access denied', 403);
      }

      // Delete operation
      await (tenantPrisma as any).bulkOperation.delete({
        where: { id },
      });

      return successResponse({ success: true });
    }
  );
}








