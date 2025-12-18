import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { chatMessageCreateSchema } from '@/modules/sohbet/schemas/chat.schema';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { getCompanyIdFromRequest, getCompanyIdFromBody } from '@/lib/api/companyContext';
import { verifyAuth } from '@/lib/auth/jwt';
import { Prisma } from '@prisma/tenant-client';
import { sendChatMessageNotifications } from '@/modules/sohbet/services/chatNotificationService';
// GET /api/chat/messages - List chat messages
export async function GET(request: NextRequest) {
  return withTenant<ApiResponse<{ messages: unknown[]; total: number; page: number; pageSize: number }>>(
    request,
    async (tenantPrisma) => {
      try {
        const authResult = await verifyAuth(request);
        if (!authResult.valid || !authResult.payload) {
          return errorResponse('Unauthorized', 'Authentication required', 401);
        }

        const searchParams = request.nextUrl.searchParams;
        const roomId = searchParams.get('roomId');
        const page = parseInt(searchParams.get('page') || '1', 10) || 1;
        const pageSize = parseInt(searchParams.get('pageSize') || '10', 10) || 10;
        const search = searchParams.get('search') || undefined;
        const type = searchParams.get('type') || undefined;
        const isRead = searchParams.get('isRead') === 'true' ? true : searchParams.get('isRead') === 'false' ? false : undefined;
        const senderId = searchParams.get('senderId') || undefined;
        const companyId = searchParams.get('companyId') || undefined;

        if (!roomId) {
          return errorResponse('Invalid request', 'roomId is required', 400);
        }

        // Get tenant context
        const tenantContext = await getTenantFromRequest(request);
        if (!tenantContext) {
          return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
        }

        // Get companyId from query or use first company
        let finalCompanyId: string | undefined = companyId;
        if (!finalCompanyId) {
          finalCompanyId = (await getCompanyIdFromRequest(request, tenantPrisma)) || undefined;
        }

        if (!finalCompanyId) {
          return errorResponse('Company required', 'No company found', 400);
        }

        // Verify room exists and belongs to tenant/company
        const room = await tenantPrisma.chatRoom.findUnique({
          where: {
            id: roomId,
            tenantId: tenantContext.id,
            companyId: finalCompanyId,
          },
        });

        if (!room) {
          return errorResponse('Chat room not found', 'The requested chat room does not exist', 404);
        }

        // Build where clause
        const where: Prisma.ChatMessageWhereInput = {
          tenantId: tenantContext.id,
          companyId: finalCompanyId,
          roomId,
        };

      if (search) {
        where.content = { contains: search, mode: 'insensitive' };
      }

      if (type) {
        where.type = type;
      }

      if (isRead !== undefined) {
        where.isRead = isRead;
      }

      if (senderId) {
        where.senderId = senderId;
      }

      // Get total count
      const total = await tenantPrisma.chatMessage.count({ where });

      // Get messages
      const messages = await tenantPrisma.chatMessage.findMany({
        where,
        include: {
          room: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      });

      return successResponse({
        messages: messages.reverse(), // Reverse to show oldest first
        total,
        page,
        pageSize,
      });
      } catch (error: any) {
        console.error('Error fetching chat messages:', error);
        return errorResponse(
          'Failed to fetch chat messages',
          error?.message || 'An error occurred while fetching chat messages',
          500
        );
      }
    },
    { required: true, module: 'chat' }
  );
}

// POST /api/chat/messages - Create chat message
export async function POST(request: NextRequest) {
  return withTenant<ApiResponse<{ message: unknown }>>(
    request,
    async (tenantPrisma) => {
      try {
        const authResult = await verifyAuth(request);
        if (!authResult.valid || !authResult.payload) {
          return errorResponse('Unauthorized', 'Authentication required', 401);
        }

        const body = await request.json();

        // Validate request body
        const validatedData = chatMessageCreateSchema.parse(body);

        // Get tenant context
        const tenantContext = await getTenantFromRequest(request);
        if (!tenantContext) {
          return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
        }

        // Get companyId from body or use first company
        const companyId = await getCompanyIdFromBody(body, tenantPrisma);
        if (!companyId) {
          return errorResponse('Company required', 'No company found', 400);
        }

        // Check if room exists
        const room = await tenantPrisma.chatRoom.findUnique({
          where: {
            id: validatedData.roomId,
            tenantId: tenantContext.id,
            companyId: companyId,
          },
        });

        if (!room) {
          return errorResponse('Chat room not found', 'The requested chat room does not exist', 404);
        }

        // Get sender ID from auth payload or validated data
        const senderId = authResult.payload.userId || validatedData.senderId;
        if (!senderId) {
          return errorResponse('Invalid request', 'senderId is required', 400);
        }

        // Create chat message
        const message = await tenantPrisma.chatMessage.create({
          data: {
            tenantId: tenantContext.id,
            companyId: companyId,
            roomId: validatedData.roomId,
            senderId,
            content: validatedData.content,
            type: validatedData.type || 'text',
            fileId: validatedData.fileId || null,
            fileName: validatedData.fileName || null,
            fileSize: validatedData.fileSize || null,
            fileType: validatedData.fileType || null,
            metadata: validatedData.metadata ? (validatedData.metadata as any) : null,
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

      // Update room's updatedAt
      await tenantPrisma.chatRoom.update({
        where: { id: validatedData.roomId },
        data: { updatedAt: new Date() },
      });

      // Send notifications to room participants (non-blocking)
      sendChatMessageNotifications({
        roomId: validatedData.roomId,
        roomName: room.name,
        senderId,
        messageContent: validatedData.content,
        messageType: validatedData.type || 'text',
        participants: room.participants || [],
      }).catch((error) => {
        // Log error but don't fail the request
        console.error('Failed to send chat notifications:', error);
      });

        return successResponse({
          message,
        });
      } catch (error: any) {
        console.error('Error creating chat message:', error);
        
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
          'Failed to create chat message',
          error?.message || 'An error occurred while creating chat message',
          500
        );
      }
    },
    { required: true, module: 'chat' }
  );
}

