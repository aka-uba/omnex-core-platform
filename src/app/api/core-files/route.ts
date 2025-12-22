// Core Files API Route
// FAZ 0.1: Merkezi Dosya Yönetim Sistemi
// GET /api/core-files - List files
// POST /api/core-files - Upload file

import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { CoreFileService } from '@/lib/core-file-manager/CoreFileService';
import { verifyAuth } from '@/lib/auth/jwt';
// GET /api/core-files - List files
export async function GET(request: NextRequest) {
  return withTenant<ApiResponse<{ files: unknown[]; total: number }>>(
    request,
    async (tenantPrisma) => {
      const { getTenantFromRequest } = await import('@/lib/api/tenantContext');
      const tenantContext = await getTenantFromRequest(request);
      
      if (!tenantContext) {
        return errorResponse('Bad Request', 'Tenant context not found', 400);
      }

      const searchParams = request.nextUrl.searchParams;
      const module = searchParams.get('module');
      const entityType = searchParams.get('entityType');
      const entityId = searchParams.get('entityId');

      const fileService = new CoreFileService(tenantPrisma);
      
      const files = await fileService.getFiles({
        tenantId: tenantContext.id,
        ...(module ? { module } : {}),
        ...(entityType ? { entityType } : {}),
        ...(entityId ? { entityId } : {}),
      });

      return successResponse({
        files: files.map(file => ({
          ...file,
          createdAt: file.createdAt.toISOString(),
          updatedAt: file.updatedAt.toISOString(),
          accessedAt: file.accessedAt?.toISOString() || null,
        })),
        total: files.length,
      });
    },
    { required: true, module: 'core-files' }
  );
}

// POST /api/core-files - Upload file
export async function POST(request: NextRequest) {
  return withTenant<ApiResponse<{ file: unknown }>>(
    request,
    async (tenantPrisma) => {
      const { getTenantFromRequest } = await import('@/lib/api/tenantContext');
      const tenantContext = await getTenantFromRequest(request);
      
      if (!tenantContext) {
        return errorResponse('Bad Request', 'Tenant context not found', 400);
      }

      // Get user from JWT token or header
      const authResult = await verifyAuth(request);
      const userId = authResult.valid && authResult.payload 
        ? authResult.payload.userId 
        : request.headers.get('x-user-id');
      
      // For upload, userId is required
      if (!userId) {
        return errorResponse('Unauthorized', 'User ID is required', 401);
      }

      try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const module = formData.get('module') as string;
        const entityType = formData.get('entityType') as string | null;
        const entityId = formData.get('entityId') as string | null;
        const title = formData.get('title') as string | null;
        const description = formData.get('description') as string | null;
        const tags = formData.get('tags') as string | null;
        const companyId = formData.get('companyId') as string | null;

        if (!file || !module) {
          return errorResponse('Bad Request', 'File and module are required', 400);
        }

        // Get companyId from form data or use first company
        let finalCompanyId = companyId;
        if (!finalCompanyId) {
          const firstCompany = await tenantPrisma.company.findFirst({
            select: { id: true },
            orderBy: { createdAt: 'asc' },
          });
          finalCompanyId = firstCompany?.id ?? null;
        }

        if (!finalCompanyId) {
          return errorResponse('Bad Request', 'Company ID is required', 400);
        }

        const fileService = new CoreFileService(tenantPrisma);

        const uploadedFile = await fileService.uploadFile({
          tenantId: tenantContext.id,
          tenantSlug: tenantContext.slug, // Used for file path (e.g., ./storage/tenants/{slug}/...)
          companyId: finalCompanyId,
          module,
          ...(entityType ? { entityType } : {}),
          ...(entityId ? { entityId } : {}),
          file,
          userId,
          metadata: {
            ...(title ? { title } : {}),
            ...(description ? { description } : {}),
            ...(tags ? { tags: tags.split(',').map(t => t.trim()) } : {}),
          },
        });

        return successResponse({
          file: {
            ...uploadedFile,
            createdAt: uploadedFile.createdAt.toISOString(),
            updatedAt: uploadedFile.updatedAt.toISOString(),
            accessedAt: uploadedFile.accessedAt?.toISOString() || null,
          },
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'File upload failed';
        return errorResponse('Internal Server Error', errorMessage, 500);
      }
    },
    { required: true, module: 'core-files' }
  );
}

