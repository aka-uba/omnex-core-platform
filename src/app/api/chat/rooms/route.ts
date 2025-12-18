import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { chatRoomCreateSchema } from '@/modules/sohbet/schemas/chat.schema';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { getCompanyIdFromRequest, getCompanyIdFromBody } from '@/lib/api/companyContext';
import { verifyAuth } from '@/lib/auth/jwt';
import { Prisma } from '@prisma/tenant-client';
// GET /api/chat/rooms - List chat rooms
export async function GET(request: NextRequest) {
  return withTenant<ApiResponse<{ rooms: unknown[]; total: number; page: number; pageSize: number }>>(
    request,
    async (tenantPrisma) => {
      try {
        const authResult = await verifyAuth(request);
        if (!authResult.valid || !authResult.payload) {
          return errorResponse('Unauthorized', 'Authentication required', 401);
        }

        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1', 10) || 1;
        const pageSize = parseInt(searchParams.get('pageSize') || '10', 10) || 10;
        const search = searchParams.get('search') || undefined;
        const type = searchParams.get('type') || undefined;
        const isActive = searchParams.get('isActive') === 'true' ? true : searchParams.get('isActive') === 'false' ? false : undefined;
        const participantId = searchParams.get('participantId') || undefined;
        const companyId = searchParams.get('companyId') || undefined;

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

        // Build where clause
        const where: Prisma.ChatRoomWhereInput = {
          tenantId: tenantContext.id,
          companyId: finalCompanyId,
        };

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (type) {
        where.type = type;
      }

      if (isActive !== undefined) {
        where.isActive = isActive;
      }

      if (participantId) {
        where.participants = { has: participantId };
      }

      // Get total count
      const total = await tenantPrisma.chatRoom.count({ where });

      // Get rooms
      const rooms = await tenantPrisma.chatRoom.findMany({
        where,
        include: {
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
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
        orderBy: {
          updatedAt: 'desc',
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      });

      return successResponse({
        rooms: rooms.map((room) => ({
          ...room,
          participants: room.participants || [],
        })),
        total,
        page,
        pageSize,
      });
      } catch (error: any) {
        console.error('Error fetching chat rooms:', error);
        return errorResponse(
          'Failed to fetch chat rooms',
          error?.message || 'An error occurred while fetching chat rooms',
          500
        );
      }
    },
    { required: true, module: 'chat' }
  );
}

// POST /api/chat/rooms - Create chat room
export async function POST(request: NextRequest) {
  return withTenant<ApiResponse<{ room: unknown }>>(
    request,
    async (tenantPrisma) => {
      let body: any = null;
      try {
        const authResult = await verifyAuth(request);
        if (!authResult.valid || !authResult.payload) {
          return errorResponse('Unauthorized', 'Authentication required', 401);
        }

        body = await request.json();

        // Validate request body
        const validatedData = chatRoomCreateSchema.parse(body);

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

        // Create chat room
        const room = await tenantPrisma.chatRoom.create({
          data: {
            tenantId: tenantContext.id,
            companyId: companyId,
            name: validatedData.name || null,
            type: validatedData.type || 'direct',
            participants: validatedData.participants,
            description: validatedData.description || null,
            avatarUrl: validatedData.avatarUrl || null,
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
        console.error('Error creating chat room:', error);
        
        // Handle Zod validation errors
        if (error.name === 'ZodError' || error.issues) {
          const zodErrors = error.issues || error.errors || [];
          return errorResponse(
            'Validation error',
            'Invalid request data',
            400,
            zodErrors
          );
        }

        // Handle Prisma errors
        if (error.code === 'P2002') {
          return errorResponse(
            'Duplicate entry',
            'A chat room with these participants already exists',
            409
          );
        }

        return errorResponse(
          'Failed to create chat room',
          error?.message || 'An error occurred while creating chat room',
          500
        );
      }
    },
    { required: true, module: 'chat' }
  );
}







