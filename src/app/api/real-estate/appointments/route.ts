import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { appointmentCreateSchema } from '@/modules/real-estate/schemas/appointment.schema';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { Prisma } from '@prisma/tenant-client';
import { notifyAppointmentCreated } from '@/modules/real-estate/services/appointmentNotificationService';
import { getAuditContext, logCreate } from '@/lib/api/auditHelper';

// GET /api/real-estate/appointments - List appointments
export async function GET(request: NextRequest) {
  return withTenant<ApiResponse<{ appointments: unknown[]; total: number; page: number; pageSize: number }>>(
    request,
    async (tenantPrisma) => {
      const searchParams = request.nextUrl.searchParams;
      
      // Parse query parameters
      const page = parseInt(searchParams.get('page') || '1', 10) || 1;
      const pageSize = parseInt(searchParams.get('pageSize') || '10', 10) || 10;
      const apartmentId = searchParams.get('apartmentId') || undefined;
      const type = searchParams.get('type') || undefined;
      const status = searchParams.get('status') || undefined;
      const startDate = searchParams.get('startDate') || undefined;
      const endDate = searchParams.get('endDate') || undefined;
      const companyId = searchParams.get('companyId') || undefined;

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Get companyId from query or use first company
      let finalCompanyId = companyId;
      if (!finalCompanyId) {
        const firstCompany = await tenantPrisma.company.findFirst({
          select: { id: true },
          orderBy: { createdAt: 'asc' },
        });
        finalCompanyId = firstCompany?.id;
      }

      // Build where clause
      // Build where clause with tenant and company isolation (defense-in-depth)
      const where: Prisma.AppointmentWhereInput = {
        tenantId: tenantContext.id,
        ...(finalCompanyId && { companyId: finalCompanyId }),
        ...(apartmentId && { apartmentId }),
        ...(type && { type }),
        ...(status && { status }),
        ...(startDate && {
          startDate: {
            gte: new Date(startDate),
          },
        }),
        ...(endDate && {
          endDate: {
            lte: new Date(endDate),
          },
        }),
      };

      // Get total count
      const total = await tenantPrisma.appointment.count({ where });

      // Get paginated appointments
      const appointments = await tenantPrisma.appointment.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { startDate: 'asc' },
        include: {
          apartment: {
            select: {
              id: true,
              unitNumber: true,
              property: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      return successResponse({
        appointments: appointments.map(appointment => ({
          ...appointment,
          createdAt: appointment.createdAt.toISOString(),
          updatedAt: appointment.updatedAt.toISOString(),
          startDate: appointment.startDate.toISOString(),
          endDate: appointment.endDate.toISOString(),
          followUpDate: appointment.followUpDate?.toISOString() || null,
          externalParticipants: appointment.externalParticipants || null,
          result: appointment.result || null,
        })),
        total,
        page,
        pageSize,
      });
    },
    { required: true, module: 'real-estate' }
  );
}

// POST /api/real-estate/appointments - Create appointment
export async function POST(request: NextRequest) {
  return withTenant<ApiResponse<{ appointment: unknown }>>(
    request,
    async (tenantPrisma) => {
      const body = await request.json();

      // Validate request body
      const validatedData = appointmentCreateSchema.parse(body);

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Get companyId from first company
      const firstCompany = await tenantPrisma.company.findFirst({
        select: { id: true },
        orderBy: { createdAt: 'asc' },
      });

      if (!firstCompany) {
        return errorResponse('Validation error', 'No company found for tenant', 404);
      }

      const companyId = firstCompany.id;

      // Check if apartment exists (if provided)
      if (validatedData.apartmentId) {
        const apartment = await tenantPrisma.apartment.findUnique({
          where: { id: validatedData.apartmentId },
        });

        if (!apartment) {
          return errorResponse('Validation error', 'Apartment not found', 404);
        }

        // Ensure apartment belongs to tenant
        if (apartment.tenantId !== tenantContext.id) {
          return errorResponse('Validation error', 'Apartment belongs to different tenant', 403);
        }
      }

      // Create appointment
      const newAppointment = await tenantPrisma.appointment.create({
        data: {
          tenantId: tenantContext.id,
          companyId: companyId,
          apartmentId: validatedData.apartmentId || null,
          type: validatedData.type,
          title: validatedData.title,
          description: validatedData.description || null,
          startDate: validatedData.startDate,
          endDate: validatedData.endDate,
          duration: validatedData.duration || null,
          staffIds: validatedData.staffIds || [],
          externalParticipants: validatedData.externalParticipants ? (validatedData.externalParticipants as Prisma.InputJsonValue) : Prisma.JsonNull,
          status: validatedData.status || 'scheduled',
          followUpRequired: validatedData.followUpRequired ?? false,
          followUpDate: validatedData.followUpDate || null,
          followUpNotes: validatedData.followUpNotes || null,
          result: validatedData.result ? (validatedData.result as Prisma.InputJsonValue) : Prisma.JsonNull,
          rating: validatedData.rating || null,
          interestLevel: validatedData.interestLevel || null,
          location: validatedData.location || null,
          notes: validatedData.notes || null,
          calendarEventId: validatedData.calendarEventId || null,
        },
        include: {
          apartment: {
            select: {
              id: true,
              unitNumber: true,
            },
          },
        },
      });

      // Log audit event
      const auditContext = await getAuditContext(request);
      logCreate(tenantContext, auditContext, 'Appointment', newAppointment.id, companyId, {
        title: newAppointment.title,
        status: newAppointment.status,
      });

      // Send notification for new appointment (async, non-blocking)
      notifyAppointmentCreated(newAppointment as any).catch(err => {
        console.error('Failed to send appointment notification:', err);
      });

      return successResponse({
        appointment: {
          ...newAppointment,
          createdAt: newAppointment.createdAt.toISOString(),
          updatedAt: newAppointment.updatedAt.toISOString(),
          startDate: newAppointment.startDate.toISOString(),
          endDate: newAppointment.endDate.toISOString(),
          followUpDate: newAppointment.followUpDate?.toISOString() || null,
          externalParticipants: newAppointment.externalParticipants || null,
          result: newAppointment.result || null,
        },
      });
    },
    { required: true, module: 'real-estate' }
  );
}

