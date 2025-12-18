/**
 * Web Builder - Page Publishing API (FAZ 3)
 * Publish/unpublish pages
 */

import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { getTenantFromRequest } from '@/lib/api/tenantContext';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// POST /api/web-builder/pages/[id]/publish - Publish page
export async function POST(request: NextRequest, { params }: RouteParams) {
  return withTenant<ApiResponse<{ page: unknown; message: string }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;
      const body = await request.json();
      const { status = 'published' } = body;

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Check if page exists
      const existingPage = await tenantPrisma.page.findUnique({
        where: { id },
        include: {
          website: {
            select: {
              id: true,
              companyId: true,
            },
          },
        },
      });

      if (!existingPage) {
        return errorResponse('Page not found', 'The requested page does not exist', 404);
      }

      // Validate status
      if (!['draft', 'published', 'archived'].includes(status)) {
        return errorResponse('Invalid status', 'Status must be draft, published, or archived', 400);
      }

      // Update page status
      const updateData: any = {
        status,
      };

      // Set publishedAt if publishing
      if (status === 'published' && !existingPage.publishedAt) {
        updateData.publishedAt = new Date();
      }

      // Clear publishedAt if unpublishing
      if (status === 'draft' || status === 'archived') {
        updateData.publishedAt = null;
      }

      const page = await tenantPrisma.page.update({
        where: { id },
        data: updateData,
        include: {
          website: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return successResponse({
        page: {
          ...page,
          createdAt: page.createdAt.toISOString(),
          updatedAt: page.updatedAt.toISOString(),
          publishedAt: page.publishedAt?.toISOString() || null,
        },
        message: status === 'published' ? 'Page published successfully' : `Page status updated to ${status}`,
      });
    },
    { required: true, module: 'web-builder' }
  );
}

// DELETE /api/web-builder/pages/[id]/publish - Unpublish page
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withTenant<ApiResponse<{ page: unknown; message: string }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Check if page exists
      const existingPage = await tenantPrisma.page.findUnique({
        where: { id },
      });

      if (!existingPage) {
        return errorResponse('Page not found', 'The requested page does not exist', 404);
      }

      // Unpublish page
      const page = await tenantPrisma.page.update({
        where: { id },
        data: {
          status: 'draft',
          publishedAt: null,
        },
        include: {
          website: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return successResponse({
        page: {
          ...page,
          createdAt: page.createdAt.toISOString(),
          updatedAt: page.updatedAt.toISOString(),
          publishedAt: null,
        },
        message: 'Page unpublished successfully',
      });
    },
    { required: true, module: 'web-builder' }
  );
}







