// Core Files API Route - Single File Operations
// FAZ 0.1: Merkezi Dosya Yönetim Sistemi
// GET /api/core-files/[id] - Get file details
// DELETE /api/core-files/[id] - Delete file

import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { CoreFileService } from '@/lib/core-file-manager/CoreFileService';
import { verifyAuth } from '@/lib/auth/jwt';
// GET /api/core-files/[id] - Get file details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withTenant<ApiResponse<{ file: unknown }>>(
    request,
    async (tenantPrisma) => {
      // Get user from JWT token or header
      const authResult = await verifyAuth(request);
      const userId = authResult.valid && authResult.payload 
        ? authResult.payload.userId 
        : request.headers.get('x-user-id');
      
      // For file access, userId is required
      if (!userId) {
        return errorResponse('Unauthorized', 'User ID is required', 401);
      }

      const { id } = await params;
      const fileId = id;

      try {
        const fileService = new CoreFileService(tenantPrisma);
        
        // İzin kontrolü
        const hasAccess = await fileService.checkFileAccess(fileId, userId, 'read');
        if (!hasAccess) {
          return errorResponse('Forbidden', 'Unauthorized: No permission to access this file', 403);
        }

        const file = await tenantPrisma.coreFile.findUnique({
          where: { id: fileId },
        });

        if (!file) {
          return errorResponse('Not Found', 'File not found', 404);
        }

        // accessedAt güncelle
        await tenantPrisma.coreFile.update({
          where: { id: fileId },
          data: { accessedAt: new Date() },
        });

        return successResponse({
          file: {
            ...file,
            createdAt: file.createdAt.toISOString(),
            updatedAt: file.updatedAt.toISOString(),
            accessedAt: file.accessedAt?.toISOString() || null,
          },
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to get file';
        return errorResponse('Internal Server Error', errorMessage, 500);
      }
    },
    { required: true, module: 'core-files' }
  );
}

// DELETE /api/core-files/[id] - Delete file
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withTenant<ApiResponse<{ success: boolean }>>(
    request,
    async (tenantPrisma) => {
      // Get user from JWT token or header
      const authResult = await verifyAuth(request);
      const userId = authResult.valid && authResult.payload 
        ? authResult.payload.userId 
        : request.headers.get('x-user-id');
      
      // For delete, userId is required
      if (!userId) {
        return errorResponse('Unauthorized', 'User ID is required', 401);
      }

      const { id } = await params;
      const fileId = id;

      try {
        const fileService = new CoreFileService(tenantPrisma);
        await fileService.deleteFile(fileId, userId);

        return successResponse({ success: true });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete file';
        return errorResponse('Internal Server Error', errorMessage, 500);
      }
    },
    { required: true, module: 'core-files' }
  );
}

