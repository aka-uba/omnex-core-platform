import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';

// PATCH /api/users/[id]/status - Update user status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  return withTenant<ApiResponse<{ user: { id: string; status: string } }>>(
    request,
    async (tenantPrisma) => {
      const body = await request.json();
      const { status } = body;

      // Validate status
      if (!status || !['active', 'inactive', 'pending'].includes(status)) {
        return errorResponse('Validation error', 'Invalid status. Must be active, inactive, or pending', 400);
      }

      // Check if user exists
      const existingUser = await tenantPrisma.user.findUnique({
        where: { id },
        select: { id: true, status: true },
      });

      if (!existingUser) {
        return errorResponse('Not found', 'User not found', 404);
      }

      // Update user status
      const updatedUser = await tenantPrisma.user.update({
        where: { id },
        data: { status },
        select: {
          id: true,
          status: true,
        },
      });

      return successResponse({
        user: updatedUser,
      });
    },
    { required: true, module: 'users' }
  );
}
