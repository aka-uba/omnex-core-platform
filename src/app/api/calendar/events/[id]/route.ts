import { NextRequest, NextResponse } from 'next/server';
import { getTenantPrismaFromRequest, getTenantFromRequest } from '@/lib/api/tenantContext';
import { getCompanyIdFromRequest } from '@/lib/api/companyContext';
import { calendarEventUpdateSchema } from '@/lib/schemas/calendar';
// GET /api/calendar/events/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantPrisma = await getTenantPrismaFromRequest(request);
    
    if (!tenantPrisma) {
      return NextResponse.json(
        { error: 'Tenant context is required' },
        { status: 400 }
      );
    }

    const { id } = await params;

    // Get tenant and company context for filtering
    const tenantContext = await getTenantFromRequest(request);
    const companyId = await getCompanyIdFromRequest(request, tenantPrisma);

    const where: Record<string, unknown> = {
      id,
    };

    // Tenant and company filtering (required for multi-tenant isolation)
    if (tenantContext) {
      where.tenantId = tenantContext.id;
    }
    if (companyId) {
      where.companyId = companyId;
    }

    const event = await tenantPrisma.calendarEvent.findFirst({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Calendar event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      event,
    });
  } catch (error) {
    console.error('Error fetching calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar event' },
      { status: 500 }
    );
  }
}

// PATCH /api/calendar/events/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantPrisma = await getTenantPrismaFromRequest(request);
    
    if (!tenantPrisma) {
      return NextResponse.json(
        { error: 'Tenant context is required' },
        { status: 400 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // Validate request body
    const validatedData = calendarEventUpdateSchema.parse(body);

    // Get tenant and company context for filtering
    const tenantContext = await getTenantFromRequest(request);
    const companyId = await getCompanyIdFromRequest(request, tenantPrisma);

    const where: Record<string, unknown> = {
      id,
    };

    // Tenant and company filtering (required for multi-tenant isolation)
    if (tenantContext) {
      where.tenantId = tenantContext.id;
    }
    if (companyId) {
      where.companyId = companyId;
    }

    // Check if event exists
    const existingEvent = await tenantPrisma.calendarEvent.findFirst({
      where,
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Calendar event not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {};
    
    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.date !== undefined) {
      updateData.date = validatedData.date instanceof Date 
        ? validatedData.date 
        : new Date(validatedData.date);
    }
    if (validatedData.client !== undefined) updateData.client = validatedData.client;
    if (validatedData.status !== undefined) updateData.status = validatedData.status;
    if (validatedData.color !== undefined) updateData.color = validatedData.color;
    if (validatedData.locationId !== undefined) updateData.locationId = validatedData.locationId;
    if (validatedData.userId !== undefined) updateData.userId = validatedData.userId;
    if (validatedData.module !== undefined) updateData.module = validatedData.module;
    if (validatedData.metadata !== undefined) updateData.metadata = validatedData.metadata;

    // Update event
    const updatedEvent = await tenantPrisma.calendarEvent.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      event: updatedEvent,
    });
  } catch (error: any) {
    console.error('Error updating calendar event:', error);
    
    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { 
          error: 'Validation error',
          message: 'Invalid request data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    // Handle Prisma not found error
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Calendar event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        error: error?.message || 'Failed to update calendar event',
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE /api/calendar/events/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantPrisma = await getTenantPrismaFromRequest(request);
    
    if (!tenantPrisma) {
      return NextResponse.json(
        { error: 'Tenant context is required' },
        { status: 400 }
      );
    }

    const { id } = await params;

    // Get tenant and company context for filtering
    const tenantContext = await getTenantFromRequest(request);
    const companyId = await getCompanyIdFromRequest(request, tenantPrisma);

    const where: Record<string, unknown> = {
      id,
    };

    // Tenant and company filtering (required for multi-tenant isolation)
    if (tenantContext) {
      where.tenantId = tenantContext.id;
    }
    if (companyId) {
      where.companyId = companyId;
    }

    // Check if event exists
    const existingEvent = await tenantPrisma.calendarEvent.findFirst({
      where,
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Calendar event not found' },
        { status: 404 }
      );
    }

    // Delete event
    await tenantPrisma.calendarEvent.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Calendar event deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting calendar event:', error);
    
    // Handle Prisma not found error
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Calendar event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        error: error?.message || 'Failed to delete calendar event',
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
}




