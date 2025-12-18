import { NextRequest, NextResponse } from 'next/server';
import { getTenantPrismaFromRequest, getTenantFromRequest } from '@/lib/api/tenantContext';
import { getCompanyIdFromRequest, getCompanyIdFromBody } from '@/lib/api/companyContext';
import { calendarEventCreateSchema, calendarEventQuerySchema } from '@/lib/schemas/calendar';
// GET /api/calendar/events
export async function GET(request: NextRequest) {
  try {
    // Get tenant Prisma client (optional - returns null if no tenant context)
    const tenantPrisma = await getTenantPrismaFromRequest(request);
    
    // If no tenant context, return empty result (e.g., on login page)
    if (!tenantPrisma) {
      return NextResponse.json({
        events: [],
        total: 0,
        page: 1,
        pageSize: 10,
      });
    }

    const searchParams = request.nextUrl.searchParams;
    
    // Parse and validate query parameters
    const query = calendarEventQuerySchema.parse({
      page: searchParams.get('page'),
      pageSize: searchParams.get('pageSize'),
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
      client: searchParams.get('client') || undefined,
      module: searchParams.get('module') || undefined,
      locationId: searchParams.get('locationId') || undefined,
      userId: searchParams.get('userId') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      companyId: searchParams.get('companyId') || undefined,
    });

    // Get tenant and company context for filtering
    const tenantContext = await getTenantFromRequest(request);
    const companyId = await getCompanyIdFromRequest(request, tenantPrisma);

    const where: Record<string, unknown> = {};

    // Tenant and company filtering (required for multi-tenant isolation)
    if (tenantContext) {
      where.tenantId = tenantContext.id;
    }
    if (companyId) {
      where.companyId = companyId;
    }

    // Apply filters
    if (query.status) where.status = query.status;
    if (query.client) where.client = { contains: query.client, mode: 'insensitive' };
    if (query.module) where.module = query.module;
    if (query.locationId) where.locationId = query.locationId;
    if (query.userId) where.userId = query.userId;
    
    // Date range filter
    if (query.dateFrom || query.dateTo) {
      (where as any).date = {};
      if (query.dateFrom) {
        (where as any).date.gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        (where as any).date.lte = new Date(query.dateTo);
      }
    }
    
    // Search filter - search in title and description
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { client: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const page = parseInt(query.page);
    const pageSize = parseInt(query.pageSize);

    const [events, total] = await Promise.all([
      tenantPrisma.calendarEvent.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { date: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      tenantPrisma.calendarEvent.count({ where }),
    ]);

    return NextResponse.json({
      events,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar events' },
      { status: 500 }
    );
  }
}

// POST /api/calendar/events
export async function POST(request: NextRequest) {
  try {
    // Get tenant Prisma client (required for creating events)
    const tenantPrisma = await getTenantPrismaFromRequest(request);
    
    if (!tenantPrisma) {
      return NextResponse.json(
        { error: 'Tenant context is required' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validatedData = calendarEventCreateSchema.parse(body);

    // Get tenant and company context (required for multi-tenant isolation)
    const tenantContext = await getTenantFromRequest(request);
    if (!tenantContext) {
      return NextResponse.json(
        { error: 'Tenant context is required' },
        { status: 400 }
      );
    }

    const companyId = await getCompanyIdFromBody(body, tenantPrisma);
    if (!companyId) {
      return NextResponse.json(
        { error: 'Company context is required' },
        { status: 400 }
      );
    }

    // Parse date (handle both string and Date)
    const eventDate = validatedData.date instanceof Date 
      ? validatedData.date 
      : new Date(validatedData.date);

    // Create calendar event with tenant and company IDs
    const calendarEvent = await tenantPrisma.calendarEvent.create({
      data: {
        tenantId: tenantContext.id,
        companyId: companyId,
        title: validatedData.title,
        description: validatedData.description || null,
        date: eventDate,
        client: validatedData.client || null,
        status: validatedData.status || 'scheduled',
        color: validatedData.color || 'blue',
        locationId: validatedData.locationId || null,
        userId: validatedData.userId || null,
        module: validatedData.module || null,
        metadata: validatedData.metadata ? (validatedData.metadata as any) : undefined,
      },
    });

    // Fetch created event with relations
    const createdEvent = await tenantPrisma.calendarEvent.findUnique({
      where: { id: calendarEvent.id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Create notification for the event (skip if it's an appointment - handled separately)
    if (validatedData.module !== 'appointments') {
      try {
        const formattedDate = eventDate.toLocaleDateString('tr-TR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
        const clientInfo = validatedData.client ? ` - ${validatedData.client}` : '';

        await tenantPrisma.notification.create({
          data: {
            tenantId: tenantContext.id,
            companyId: companyId,
            title: 'Yeni Etkinlik Oluşturuldu',
            message: `${validatedData.title}${clientInfo} - ${formattedDate}`,
            type: 'info',
            priority: 'medium',
            module: 'calendar',
            isGlobal: false,
            status: 'unread',
            actionUrl: `/modules/calendar/dashboard`,
            actionText: 'Etkinliği Görüntüle',
            data: {
              eventId: calendarEvent.id,
              eventTitle: validatedData.title,
              eventDate: eventDate.toISOString(),
            },
          },
        });
      } catch (notificationError) {
        // Don't fail the event creation if notification fails
        console.error('Error creating notification for event:', notificationError);
      }
    }

    return NextResponse.json({
      success: true,
      event: createdEvent,
    });
  } catch (error: any) {
    console.error('Error creating calendar event:', error);
    
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

    return NextResponse.json(
      { 
        error: error?.message || 'Failed to create calendar event',
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
}






