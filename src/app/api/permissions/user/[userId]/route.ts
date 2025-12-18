// User Permissions API Route
// FAZ 0.4: Merkezi Yetki Yönetimi Sistemi
// GET /api/permissions/user/[userId] - Get user permissions

import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { PermissionService } from '@/lib/access-control/PermissionService';

// GET /api/permissions/user/[userId] - Get user permissions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  return withTenant<ApiResponse<{ permissions: unknown; role: string; customPermissions: unknown }>>(
    request,
    async (tenantPrisma) => {
      const { userId } = await params;

      try {
        const permissionService = new PermissionService(tenantPrisma);
        const userPermissions = await permissionService.getUserPermissions(userId);

        return successResponse({
          permissions: userPermissions.permissions,
          role: userPermissions.role,
          customPermissions: userPermissions.customPermissions,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to get user permissions';
        return errorResponse('Internal Server Error', errorMessage, 500);
      }
    },
    { required: true, module: 'permissions' }
  );
}

