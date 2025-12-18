import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { notifyMaintenanceReminder, notifyMaintenanceOverdue } from '@/modules/maintenance/services/maintenanceNotificationService';
import dayjs from 'dayjs';
/**
 * POST /api/maintenance/reminders
 * Send reminder notifications for upcoming and overdue maintenance records
 * This endpoint should be called by a cron job or scheduled task
 */
export async function POST(request: NextRequest) {
  return withTenant<ApiResponse<{ sent: number; upcoming: number; overdue: number }>>(
    request,
    async (tenantPrisma) => {
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
      const today = new Date();
      const todayStart = dayjs(today).startOf('day').toDate();

      // Find scheduled maintenance records that need reminders
      // 1. Upcoming maintenance (1, 3, 7 days before scheduled date)
      const upcomingRecords = await tenantPrisma.maintenanceRecord.findMany({
        where: {
          tenantId: tenantContext.id,
          companyId: companyId,
          status: 'scheduled',
          isActive: true,
          scheduledDate: {
            gte: todayStart,
            lte: dayjs(today).add(7, 'days').endOf('day').toDate(),
          },
        },
        include: {
          location: {
            select: {
              id: true,
              name: true,
            },
          },
          equipment: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });

      // 2. Overdue maintenance (past scheduled date, still scheduled)
      const overdueRecords = await tenantPrisma.maintenanceRecord.findMany({
        where: {
          tenantId: tenantContext.id,
          companyId: companyId,
          status: 'scheduled',
          isActive: true,
          scheduledDate: {
            lt: todayStart,
          },
        },
        include: {
          location: {
            select: {
              id: true,
              name: true,
            },
          },
          equipment: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });

      let sentCount = 0;
      let upcomingCount = 0;
      let overdueCount = 0;

      // Send reminders for upcoming maintenance
      for (const record of upcomingRecords) {
        const scheduledDate = dayjs(record.scheduledDate);
        const daysUntil = scheduledDate.diff(today, 'day');

        // Send reminder if 1, 3, or 7 days before
        if (daysUntil === 1 || daysUntil === 3 || daysUntil === 7) {
          try {
            await notifyMaintenanceReminder(
              {
                ...record,
                estimatedCost: record.estimatedCost ? Number(record.estimatedCost) : null,
                actualCost: record.actualCost ? Number(record.actualCost) : null,
                scheduledDate: record.scheduledDate,
                startDate: record.startDate || null,
                endDate: record.endDate || null,
                createdAt: record.createdAt,
                updatedAt: record.updatedAt,
              },
              daysUntil
            );
            upcomingCount++;
            sentCount++;
          } catch (error) {
            console.error(`Error sending reminder for maintenance record ${record.id}:`, error);
          }
        }
      }

      // Send notifications for overdue maintenance
      for (const record of overdueRecords) {
        const scheduledDate = dayjs(record.scheduledDate);
        const daysOverdue = dayjs(today).diff(scheduledDate, 'day');

        // Send overdue notification (once per day, but we'll send it if called)
        try {
          await notifyMaintenanceOverdue(
            {
              ...record,
              estimatedCost: record.estimatedCost ? Number(record.estimatedCost) : null,
              actualCost: record.actualCost ? Number(record.actualCost) : null,
              scheduledDate: record.scheduledDate,
              startDate: record.startDate || null,
              endDate: record.endDate || null,
              createdAt: record.createdAt,
              updatedAt: record.updatedAt,
            } as any,
            daysOverdue
          );
          overdueCount++;
          sentCount++;
        } catch (error) {
          console.error(`Error sending overdue notification for maintenance record ${record.id}:`, error);
        }
      }

      return successResponse({
        sent: sentCount,
        upcoming: upcomingCount,
        overdue: overdueCount,
      });
    },
    { required: true, module: 'maintenance' }
  );
}

