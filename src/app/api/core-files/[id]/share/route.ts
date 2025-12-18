// Core Files API Route - Share File
// FAZ 0.1: Merkezi Dosya Yönetim Sistemi
// POST /api/core-files/[id]/share - Share file

import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { CoreFileService } from '@/lib/core-file-manager/CoreFileService';
import { verifyAuth } from '@/lib/auth/jwt';
// POST /api/core-files/[id]/share - Share file
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withTenant<ApiResponse<{ share: unknown }>>(
    request,
    async (tenantPrisma) => {
      // Get user from JWT token or header
      const authResult = await verifyAuth(request);
      const userId = authResult.valid && authResult.payload 
        ? authResult.payload.userId 
        : request.headers.get('x-user-id');
      
      // For sharing, userId is required
      if (!userId) {
        return errorResponse('Unauthorized', 'User ID is required', 401);
      }

      const { id } = await params;
      const fileId = id;

      try {
        const body = await request.json();
        const { sharedWith, permission, expiresAt, accessCode } = body;

        if (!sharedWith || !permission) {
          return errorResponse('Bad Request', 'sharedWith and permission are required', 400);
        }

        if (!['view', 'download', 'edit'].includes(permission)) {
          return errorResponse('Bad Request', 'Invalid permission. Must be view, download, or edit', 400);
        }

        const fileService = new CoreFileService(tenantPrisma);
        
        const share = await fileService.shareFile(
          fileId,
          userId,
          sharedWith,
          permission,
          expiresAt ? new Date(expiresAt) : undefined,
          accessCode
        );

        return successResponse({
          share: {
            ...share,
            createdAt: share.createdAt.toISOString(),
            expiresAt: share.expiresAt?.toISOString() || null,
          },
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to share file';
        return errorResponse('Internal Server Error', errorMessage, 500);
      }
    },
    { required: true, module: 'core-files' }
  );
}

