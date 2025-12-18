import { NextRequest, NextResponse } from 'next/server';
import { getTenantPrismaFromRequest, getTenantFromRequest } from '@/lib/api/tenantContext';

// PUT /api/calendar/appointments/[id]
export async function PUT(
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
    const tenantContext = await getTenantFromRequest(request);

    if (!tenantContext) {
      return NextResponse.json(
        { error: 'Tenant context is required' },
        { status: 400 }
      );
    }

    // Check if appointment exists
    const existingAppointment = await tenantPrisma.calendarEvent.findUnique({
      where: { id },
    });

    if (!existingAppointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Map appointment status to CalendarEvent status
    const eventStatus = body.status === 'confirmed' ? 'scheduled' :
                       body.status === 'cancelled' ? 'needs-revision' :
                       body.status === 'completed' ? 'published' : 'draft';

    // Parse date
    const appointmentDate = body.date ? new Date(body.date) : existingAppointment.date;

    // Update the appointment
    const updatedAppointment = await tenantPrisma.calendarEvent.update({
      where: { id },
      data: {
        title: body.title || existingAppointment.title,
        description: body.description !== undefined ? body.description : existingAppointment.description,
        date: appointmentDate,
        client: body.clientName !== undefined ? body.clientName : existingAppointment.client,
        status: eventStatus,
        color: body.color || existingAppointment.color,
        metadata: {
          ...(existingAppointment.metadata as Record<string, unknown> || {}),
          time: body.time !== undefined ? body.time : (existingAppointment.metadata as any)?.time,
          duration: body.duration !== undefined ? body.duration : (existingAppointment.metadata as any)?.duration,
          reminderMinutes: body.reminderMinutes !== undefined ? body.reminderMinutes : (existingAppointment.metadata as any)?.reminderMinutes,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedAppointment.id,
        title: updatedAppointment.title,
        clientName: updatedAppointment.client,
        date: updatedAppointment.date,
        time: (updatedAppointment.metadata as any)?.time || null,
        duration: (updatedAppointment.metadata as any)?.duration || null,
        reminderMinutes: (updatedAppointment.metadata as any)?.reminderMinutes || null,
        status: body.status || 'pending',
        description: updatedAppointment.description,
        createdAt: updatedAppointment.createdAt,
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

// GET /api/calendar/appointments/[id]
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

    const appointment = await tenantPrisma.calendarEvent.findUnique({
      where: { id },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Transform to appointment format
    const transformedAppointment = {
      id: appointment.id,
      title: appointment.title,
      clientName: appointment.client,
      date: appointment.date,
      time: (appointment.metadata as any)?.time || null,
      duration: (appointment.metadata as any)?.duration || null,
      reminderMinutes: (appointment.metadata as any)?.reminderMinutes || null,
      status: appointment.status === 'scheduled' ? 'confirmed' :
              appointment.status === 'published' ? 'completed' :
              appointment.status === 'needs-revision' ? 'cancelled' : 'pending',
      description: appointment.description,
      createdAt: appointment.createdAt,
    };

    return NextResponse.json({
      success: true,
      data: transformedAppointment,
    });
  } catch (error: any) {
    console.error('Error fetching appointment:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch appointment' },
      { status: 500 }
    );
  }
}

// DELETE /api/calendar/appointments/[id]
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

    // Check if appointment exists
    const existingAppointment = await tenantPrisma.calendarEvent.findUnique({
      where: { id },
    });

    if (!existingAppointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    await tenantPrisma.calendarEvent.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Appointment deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting appointment:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete appointment' },
      { status: 500 }
    );
  }
}
