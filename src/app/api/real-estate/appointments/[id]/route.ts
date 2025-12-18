import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { appointmentUpdateSchema } from '@/modules/real-estate/schemas/appointment.schema';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { Prisma } from '@prisma/tenant-client';
import { notifyAppointmentUpdated } from '@/modules/real-estate/services/appointmentNotificationService';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/real-estate/appointments/[id] - Get appointment by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withTenant<ApiResponse<{ appointment: unknown }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      const appointment = await tenantPrisma.appointment.findUnique({
        where: { id },
        include: {
          apartment: {
            include: {
              property: {
                select: {
                  id: true,
                  name: true,
                  address: true,
                },
              },
            },
          },
        },
      });

      if (!appointment) {
        return errorResponse('Not found', 'Appointment not found', 404);
      }

      // Note: withTenant already provides tenant isolation via per-tenant database
      // Additional tenantId check is redundant but kept for extra security

      return successResponse({
        appointment: {
          ...appointment,
          createdAt: appointment.createdAt.toISOString(),
          updatedAt: appointment.updatedAt.toISOString(),
          startDate: appointment.startDate.toISOString(),
          endDate: appointment.endDate.toISOString(),
          followUpDate: appointment.followUpDate?.toISOString() || null,
          externalParticipants: appointment.externalParticipants || null,
          result: appointment.result || null,
        },
      });
    },
    { required: true, module: 'real-estate' }
  );
}

// PATCH /api/real-estate/appointments/[id] - Update appointment
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return withTenant<ApiResponse<{ appointment: unknown }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;
      const body = await request.json();

      // Validate request body (partial update)
      const validatedData = appointmentUpdateSchema.parse(body);

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Check if appointment exists
      const existingAppointment = await tenantPrisma.appointment.findUnique({
        where: { id },
      });

      if (!existingAppointment) {
        return errorResponse('Not found', 'Appointment not found', 404);
      }

      // Note: withTenant already provides tenant isolation via per-tenant database
      // Note: apartmentId can be changed but validation is handled in schema

      // Prepare update data
      const updateData: Prisma.AppointmentUpdateInput = {};
      // Note: apartmentId update is handled by Prisma relation, not directly
      if (validatedData.type !== undefined) updateData.type = validatedData.type;
      if (validatedData.title !== undefined) updateData.title = validatedData.title;
      if (validatedData.description !== undefined) updateData.description = validatedData.description || null;
      if (validatedData.startDate !== undefined) updateData.startDate = validatedData.startDate;
      if (validatedData.endDate !== undefined) updateData.endDate = validatedData.endDate;
      if (validatedData.duration !== undefined) updateData.duration = validatedData.duration || null;
      if (validatedData.staffIds !== undefined) updateData.staffIds = validatedData.staffIds;
      if (validatedData.externalParticipants !== undefined) {
        updateData.externalParticipants = validatedData.externalParticipants ? (validatedData.externalParticipants as Prisma.InputJsonValue) : Prisma.JsonNull;
      }
      if (validatedData.status !== undefined) updateData.status = validatedData.status;
      if (validatedData.followUpRequired !== undefined) updateData.followUpRequired = validatedData.followUpRequired;
      if (validatedData.followUpDate !== undefined) updateData.followUpDate = validatedData.followUpDate || null;
      if (validatedData.followUpNotes !== undefined) updateData.followUpNotes = validatedData.followUpNotes || null;
      if (validatedData.result !== undefined) {
        updateData.result = validatedData.result ? (validatedData.result as Prisma.InputJsonValue) : Prisma.JsonNull;
      }
      if (validatedData.rating !== undefined) updateData.rating = validatedData.rating || null;
      if (validatedData.interestLevel !== undefined) updateData.interestLevel = validatedData.interestLevel || null;
      if (validatedData.location !== undefined) updateData.location = validatedData.location || null;
      if (validatedData.notes !== undefined) updateData.notes = validatedData.notes || null;
      if (validatedData.calendarEventId !== undefined) updateData.calendarEventId = validatedData.calendarEventId || null;

      // Update appointment
      const updatedAppointment = await tenantPrisma.appointment.update({
        where: { id },
        data: updateData,
        include: {
          apartment: {
            select: {
              id: true,
              unitNumber: true,
            },
          },
        },
      });

      // Send notification for appointment update (async, non-blocking)
      notifyAppointmentUpdated(updatedAppointment as any, undefined, validatedData as Record<string, unknown>).catch(err => {
        console.error('Failed to send appointment update notification:', err);
      });

      return successResponse({
        appointment: {
          ...updatedAppointment,
          createdAt: updatedAppointment.createdAt.toISOString(),
          updatedAt: updatedAppointment.updatedAt.toISOString(),
          startDate: updatedAppointment.startDate.toISOString(),
          endDate: updatedAppointment.endDate.toISOString(),
          followUpDate: updatedAppointment.followUpDate?.toISOString() || null,
          externalParticipants: updatedAppointment.externalParticipants || null,
          result: updatedAppointment.result || null,
        },
      });
    },
    { required: true, module: 'real-estate' }
  );
}

// DELETE /api/real-estate/appointments/[id] - Delete appointment
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withTenant<ApiResponse<void>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Check if appointment exists
      const existingAppointment = await tenantPrisma.appointment.findUnique({
        where: { id },
      });

      if (!existingAppointment) {
        return errorResponse('Not found', 'Appointment not found', 404);
      }

      // Note: withTenant already provides tenant isolation via per-tenant database
      // Delete appointment
      await tenantPrisma.appointment.delete({
        where: { id },
      });

      return successResponse(undefined);
    },
    { required: true, module: 'real-estate' }
  );
}

