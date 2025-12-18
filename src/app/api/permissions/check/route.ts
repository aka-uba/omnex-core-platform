// Permission Check API Route
// FAZ 0.4: Merkezi Yetki Yönetimi Sistemi
// POST /api/permissions/check - Check if user has permission

import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { PermissionService } from '@/lib/access-control/PermissionService';

// POST /api/permissions/check - Check permission
export async function POST(request: NextRequest) {
  return withTenant<ApiResponse<{ hasPermission: boolean }>>(
    request,
    async (tenantPrisma) => {
      try {
        const body = await request.json();
        const { userId, permissionKey, resourceId, resourceType } = body;

        if (!userId || !permissionKey) {
          return errorResponse('Bad Request', 'userId and permissionKey are required', 400);
        }

        const permissionService = new PermissionService(tenantPrisma);
        const hasPermission = await permissionService.hasPermission({
          userId,
          permissionKey,
          resourceId,
          resourceType,
        });

        return successResponse({ hasPermission });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to check permission';
        return errorResponse('Internal Server Error', errorMessage, 500);
      }
    },
    { required: true, module: 'permissions' }
  );
}









