import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { chatRoomUpdateSchema } from '@/modules/sohbet/schemas/chat.schema';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { getCompanyIdFromRequest } from '@/lib/api/companyContext';
import { verifyAuth } from '@/lib/auth/jwt';
interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/chat/rooms/[id] - Get chat room
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withTenant<ApiResponse<{ room: unknown }>>(
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

        // Get companyId from query or use first company
        const searchParams = request.nextUrl.searchParams;
        const companyId = searchParams.get('companyId') || undefined;
        let finalCompanyId: string | undefined = companyId;
        if (!finalCompanyId) {
          finalCompanyId = (await getCompanyIdFromRequest(request, tenantPrisma)) || undefined;
        }

        if (!finalCompanyId) {
          return errorResponse('Company required', 'No company found', 400);
        }

        // Get chat room
        const room = await tenantPrisma.chatRoom.findFirst({
          where: {
            id,
            tenantId: tenantContext.id,
            companyId: finalCompanyId,
          },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: {
              room: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                },
              },
            },
          },
        },
      });

        if (!room) {
          return errorResponse('Chat room not found', 'The requested chat room does not exist', 404);
        }

        // Check tenant ownership
        if (room.tenantId !== tenantContext.id) {
          return errorResponse('Forbidden', 'Access denied', 403);
        }

        return successResponse({
          room: {
            ...room,
            participants: room.participants || [],
          },
        });
      } catch (error: any) {
        console.error('Error fetching chat room:', error);
        return errorResponse(
          'Failed to fetch chat room',
          error?.message || 'An error occurred while fetching the chat room',
          500
        );
      }
    },
    { required: true, module: 'chat' }
  );
}

// PATCH /api/chat/rooms/[id] - Update chat room
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return withTenant<ApiResponse<{ room: unknown }>>(
    request,
    async (tenantPrisma) => {
      try {
        const authResult = await verifyAuth(request);
        if (!authResult.valid || !authResult.payload) {
          return errorResponse('Unauthorized', 'Authentication required', 401);
        }

        const { id } = await params;
        const body = await request.json();

        // Validate request body
        const validatedData = chatRoomUpdateSchema.parse(body);

        // Get tenant context
        const tenantContext = await getTenantFromRequest(request);
        if (!tenantContext) {
          return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
        }

        // Get companyId from query or use first company
        const searchParams = request.nextUrl.searchParams;
        const companyId = searchParams.get('companyId') || undefined;
        let finalCompanyId: string | undefined = companyId;
        if (!finalCompanyId) {
          finalCompanyId = (await getCompanyIdFromRequest(request, tenantPrisma)) || undefined;
        }

        if (!finalCompanyId) {
          return errorResponse('Company required', 'No company found', 400);
        }

        // Check if room exists
        const existingRoom = await tenantPrisma.chatRoom.findFirst({
          where: {
            id,
            tenantId: tenantContext.id,
            companyId: finalCompanyId,
          },
        });

        if (!existingRoom) {
          return errorResponse('Chat room not found', 'The requested chat room does not exist', 404);
        }

        // Check tenant ownership
        if (existingRoom.tenantId !== tenantContext.id) {
          return errorResponse('Forbidden', 'Access denied', 403);
        }

        // Update chat room
      const room = await tenantPrisma.chatRoom.update({
        where: { id },
        data: {
          ...(validatedData.name !== undefined && { name: validatedData.name || null }),
          ...(validatedData.type !== undefined && { type: validatedData.type }),
          ...(validatedData.participants !== undefined && { participants: validatedData.participants }),
          ...(validatedData.description !== undefined && { description: validatedData.description || null }),
          ...(validatedData.avatarUrl !== undefined && { avatarUrl: validatedData.avatarUrl || null }),
          ...(validatedData.isActive !== undefined && { isActive: validatedData.isActive }),
        },
        include: {
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      return successResponse({
        room: {
          ...room,
          participants: room.participants || [],
        },
      });
      } catch (error: any) {
        console.error('Error updating chat room:', error);
        
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
          'Failed to update chat room',
          error?.message || 'An error occurred while updating chat room',
          500
        );
      }
    },
    { required: true, module: 'chat' }
  );
}

// DELETE /api/chat/rooms/[id] - Delete chat room
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withTenant<ApiResponse<{ message: string }>>(
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

        // Get companyId from query or use first company
        const searchParams = request.nextUrl.searchParams;
        const companyId = searchParams.get('companyId') || undefined;
        let finalCompanyId: string | undefined = companyId;
        if (!finalCompanyId) {
          finalCompanyId = (await getCompanyIdFromRequest(request, tenantPrisma)) || undefined;
        }

        if (!finalCompanyId) {
          return errorResponse('Company required', 'No company found', 400);
        }

        // Check if room exists
        const existingRoom = await tenantPrisma.chatRoom.findFirst({
          where: {
            id,
            tenantId: tenantContext.id,
            companyId: finalCompanyId,
          },
        });

        if (!existingRoom) {
          return errorResponse('Chat room not found', 'The requested chat room does not exist', 404);
        }

        // Check tenant ownership
        if (existingRoom.tenantId !== tenantContext.id) {
          return errorResponse('Forbidden', 'Access denied', 403);
        }

        // Delete chat room (messages will be cascade deleted)
        await tenantPrisma.chatRoom.delete({
          where: { id },
        });

        return successResponse({
          message: 'Chat room deleted successfully',
        });
      } catch (error: any) {
        console.error('Error deleting chat room:', error);
        return errorResponse(
          'Failed to delete chat room',
          error?.message || 'An error occurred while deleting the chat room',
          500
        );
      }
    },
    { required: true, module: 'chat' }
  );
}







