import { NextRequest, NextResponse } from 'next/server';
import { getTenantPrismaFromRequest, getTenantFromRequest } from '@/lib/api/tenantContext';
import { getCompanyIdFromRequest } from '@/lib/api/companyContext';

// GET /api/calendar/appointments
export async function GET(request: NextRequest) {
  try {
    // Get tenant Prisma client (optional - returns null if no tenant context)
    const tenantPrisma = await getTenantPrismaFromRequest(request);

    // If no tenant context, return empty result
    if (!tenantPrisma) {
      return NextResponse.json({
        data: [],
        total: 0,
        page: 1,
        pageSize: 10,
      });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;

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
    if (status) where.status = status;

    // Search filter
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { clientName: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Check if Appointment model exists, otherwise use CalendarEvent as fallback
    try {
      // First try to use CalendarEvent model with appointment type filtering
      const [appointments, total] = await Promise.all([
        tenantPrisma.calendarEvent.findMany({
          where: {
            ...where,
            // Filter events that are appointment-type
            module: 'appointments',
          },
          orderBy: { date: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        tenantPrisma.calendarEvent.count({
          where: {
            ...where,
            module: 'appointments',
          }
        }),
      ]);

      // Transform CalendarEvent to Appointment format
      const transformedAppointments = appointments.map((event: any) => ({
        id: event.id,
        title: event.title,
        clientName: event.client,
        date: event.date,
        time: event.metadata?.time || null,
        duration: event.metadata?.duration || null,
        reminderMinutes: event.metadata?.reminderMinutes || null,
        status: event.status === 'scheduled' ? 'pending' :
                event.status === 'published' ? 'confirmed' :
                event.status === 'draft' ? 'pending' :
                event.status === 'needs-revision' ? 'cancelled' : event.status,
        description: event.description,
        createdAt: event.createdAt,
      }));

      return NextResponse.json({
        data: transformedAppointments,
        total,
        page,
        pageSize,
      });
    } catch (modelError) {
      // If CalendarEvent doesn't have the right fields, return empty
      console.error('Error fetching appointments:', modelError);
      return NextResponse.json({
        data: [],
        total: 0,
        page,
        pageSize,
      });
    }
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}

// PATCH /api/calendar/appointments - Update appointment status
export async function PATCH(request: NextRequest) {
  try {
    const tenantPrisma = await getTenantPrismaFromRequest(request);

    if (!tenantPrisma) {
      return NextResponse.json(
        { error: 'Tenant context is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Appointment ID is required' },
        { status: 400 }
      );
    }

    // Map appointment status to CalendarEvent status
    const eventStatus = status === 'confirmed' ? 'scheduled' :
                       status === 'cancelled' ? 'needs-revision' :
                       status === 'completed' ? 'published' : 'draft';

    const updatedAppointment = await tenantPrisma.calendarEvent.update({
      where: { id },
      data: {
        status: eventStatus,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedAppointment.id,
        status: status,
      },
    });
  } catch (error: any) {
    console.error('Error updating appointment:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update appointment' },
      { status: 500 }
    );
  }
}

// POST /api/calendar/appointments
export async function POST(request: NextRequest) {
  try {
    const tenantPrisma = await getTenantPrismaFromRequest(request);

    if (!tenantPrisma) {
      return NextResponse.json(
        { error: 'Tenant context is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const tenantContext = await getTenantFromRequest(request);

    if (!tenantContext) {
      return NextResponse.json(
        { error: 'Tenant context is required' },
        { status: 400 }
      );
    }

    const companyId = await getCompanyIdFromRequest(request, tenantPrisma);
    if (!companyId) {
      return NextResponse.json(
        { error: 'Company context is required' },
        { status: 400 }
      );
    }

    // Create as CalendarEvent with module='appointments'
    const appointmentDate = new Date(body.date);
    const appointment = await tenantPrisma.calendarEvent.create({
      data: {
        tenantId: tenantContext.id,
        companyId: companyId,
        title: body.title,
        description: body.description || null,
        date: appointmentDate,
        client: body.clientName || null,
        status: body.status === 'confirmed' ? 'scheduled' :
                body.status === 'cancelled' ? 'needs-revision' : 'draft',
        color: body.color || 'blue',
        module: 'appointments',
        metadata: {
          time: body.time || null,
          duration: body.duration || null,
          reminderMinutes: body.reminderMinutes || null,
        },
      },
    });

    // Create notification for the appointment
    try {
      const formattedDate = appointmentDate.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      const timeInfo = body.time ? ` saat ${body.time}` : '';
      const clientInfo = body.clientName ? ` - ${body.clientName}` : '';

      await tenantPrisma.notification.create({
        data: {
          tenantId: tenantContext.id,
          companyId: companyId,
          title: 'Yeni Randevu Oluşturuldu',
          message: `${body.title}${clientInfo} - ${formattedDate}${timeInfo}`,
          type: 'info',
          priority: 'medium',
          module: 'calendar',
          isGlobal: false,
          status: 'unread',
          actionUrl: `/modules/calendar/appointments`,
          actionText: 'Randevuyu Görüntüle',
          data: {
            appointmentId: appointment.id,
            appointmentTitle: body.title,
            appointmentDate: appointmentDate.toISOString(),
            appointmentTime: body.time || null,
          },
        },
      });
    } catch (notificationError) {
      // Don't fail the appointment creation if notification fails
      console.error('Error creating notification for appointment:', notificationError);
    }

    return NextResponse.json({
      success: true,
      data: {
        id: appointment.id,
        title: appointment.title,
        clientName: appointment.client,
        date: appointment.date,
        time: (appointment.metadata as any)?.time || null,
        duration: (appointment.metadata as any)?.duration || null,
        reminderMinutes: (appointment.metadata as any)?.reminderMinutes || null,
        status: body.status || 'pending',
        description: appointment.description,
        createdAt: appointment.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create appointment' },
      { status: 500 }
    );
  }
}
