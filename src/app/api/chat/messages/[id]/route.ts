import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { chatMessageUpdateSchema } from '@/modules/sohbet/schemas/chat.schema';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { getCompanyIdFromRequest } from '@/lib/api/companyContext';
import { verifyAuth } from '@/lib/auth/jwt';
interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/chat/messages/[id] - Get chat message
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withTenant<ApiResponse<{ message: unknown }>>(
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

        // Get chat message
        const message = await tenantPrisma.chatMessage.findFirst({
          where: {
            id,
            tenantId: tenantContext.id,
            companyId: finalCompanyId,
          },
        include: {
          room: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      });

        if (!message) {
          return errorResponse('Chat message not found', 'The requested chat message does not exist', 404);
        }

        // Check tenant ownership
        if (message.tenantId !== tenantContext.id) {
          return errorResponse('Forbidden', 'Access denied', 403);
        }

        return successResponse({
          message,
        });
      } catch (error: any) {
        console.error('Error fetching chat message:', error);
        return errorResponse(
          'Failed to fetch chat message',
          error?.message || 'An error occurred while fetching the chat message',
          500
        );
      }
    },
    { required: true, module: 'chat' }
  );
}

// PATCH /api/chat/messages/[id] - Update chat message
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return withTenant<ApiResponse<{ message: unknown }>>(
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
        const validatedData = chatMessageUpdateSchema.parse(body);

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

        // Check if message exists
        const existingMessage = await tenantPrisma.chatMessage.findFirst({
          where: {
            id,
            tenantId: tenantContext.id,
            companyId: finalCompanyId,
          },
        });

        if (!existingMessage) {
          return errorResponse('Chat message not found', 'The requested chat message does not exist', 404);
        }

        // Check tenant ownership
        if (existingMessage.tenantId !== tenantContext.id) {
          return errorResponse('Forbidden', 'Access denied', 403);
        }

        // Update chat message
      const message = await tenantPrisma.chatMessage.update({
        where: { id },
        data: {
          ...(validatedData.content !== undefined && { content: validatedData.content }),
          ...(validatedData.isRead !== undefined && {
            isRead: validatedData.isRead,
            readAt: validatedData.isRead ? new Date() : null,
          }),
          ...(validatedData.metadata !== undefined && { metadata: validatedData.metadata ? (validatedData.metadata as any) : null }),
        },
        include: {
          room: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      });

        return successResponse({
          message,
        });
      } catch (error: any) {
        console.error('Error updating chat message:', error);
        
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
          'Failed to update chat message',
          error?.message || 'An error occurred while updating chat message',
          500
        );
      }
    },
    { required: true, module: 'chat' }
  );
}

// DELETE /api/chat/messages/[id] - Delete chat message
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

        // Check if message exists
        const existingMessage = await tenantPrisma.chatMessage.findFirst({
          where: {
            id,
            tenantId: tenantContext.id,
            companyId: finalCompanyId,
          },
        });

        if (!existingMessage) {
          return errorResponse('Chat message not found', 'The requested chat message does not exist', 404);
        }

        // Check tenant ownership
        if (existingMessage.tenantId !== tenantContext.id) {
          return errorResponse('Forbidden', 'Access denied', 403);
        }

        // Delete chat message
        await tenantPrisma.chatMessage.delete({
          where: { id },
        });

        return successResponse({
          message: 'Chat message deleted successfully',
        });
      } catch (error: any) {
        console.error('Error deleting chat message:', error);
        return errorResponse(
          'Failed to delete chat message',
          error?.message || 'An error occurred while deleting the chat message',
          500
        );
      }
    },
    { required: true, module: 'chat' }
  );
}

