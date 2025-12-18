import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { Prisma } from '@prisma/tenant-client';

// GET /api/maintenance/analytics - Get maintenance analytics
export async function GET(request: NextRequest) {
  return withTenant<ApiResponse<{
    summary: {
      totalRecords: number;
      scheduled: number;
      inProgress: number;
      completed: number;
      cancelled: number;
      totalEstimatedCost: number;
      totalActualCost: number;
    };
    byType: {
      preventive: number;
      corrective: number;
      emergency: number;
    };
    byStatus: {
      scheduled: number;
      in_progress: number;
      completed: number;
      cancelled: number;
    };
    monthlyTrend: Array<{
      month: string;
      scheduled: number;
      completed: number;
      cost: number;
    }>;
    upcomingMaintenance: Array<{
      id: string;
      title: string;
      equipment: string;
      scheduledDate: string;
      type: string;
    }>;
    overdueMaintenance: Array<{
      id: string;
      title: string;
      equipment: string;
      scheduledDate: string;
      daysOverdue: number;
    }>;
  }>>(
    request,
    async (tenantPrisma) => {
      const searchParams = request.nextUrl.searchParams;
      const companyId = searchParams.get('companyId') || undefined;
      const dateFrom = searchParams.get('dateFrom') || undefined;
      const dateTo = searchParams.get('dateTo') || undefined;

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
      const where: Prisma.MaintenanceRecordWhereInput = {
        tenantId: tenantContext.id,
        ...(finalCompanyId && { companyId: finalCompanyId }),
        ...(dateFrom && {
          scheduledDate: {
            gte: new Date(dateFrom),
          },
        }),
        ...(dateTo && {
          scheduledDate: {
            lte: new Date(dateTo),
          },
        }),
      };

      // Get all records for analytics
      const records = await tenantPrisma.maintenanceRecord.findMany({
        where,
        include: {
          equipment: {
            select: {
              name: true,
            },
          },
        },
      });

      // Calculate summary
      const totalRecords = records.length;
      const scheduled = records.filter(r => r.status === 'scheduled').length;
      const inProgress = records.filter(r => r.status === 'in_progress').length;
      const completed = records.filter(r => r.status === 'completed').length;
      const cancelled = records.filter(r => r.status === 'cancelled').length;
      
      const totalEstimatedCost = records.reduce((sum, r) => sum + (r.estimatedCost ? Number(r.estimatedCost) : 0), 0);
      const totalActualCost = records.reduce((sum, r) => sum + (r.actualCost ? Number(r.actualCost) : 0), 0);

      // By type
      const byType = {
        preventive: records.filter(r => r.type === 'preventive').length,
        corrective: records.filter(r => r.type === 'corrective').length,
        emergency: records.filter(r => r.type === 'emergency').length,
      };

      // By status
      const byStatus = {
        scheduled,
        in_progress: inProgress,
        completed,
        cancelled,
      };

      // Monthly trend (last 12 months)
      const monthlyTrend: Array<{ month: string; scheduled: number; completed: number; cost: number }> = [];
      const now = new Date();
      for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
        
        const monthRecords = records.filter(r => {
          const recordDate = new Date(r.scheduledDate);
          return recordDate.getFullYear() === monthDate.getFullYear() && 
                 recordDate.getMonth() === monthDate.getMonth();
        });

        monthlyTrend.push({
          month: monthKey,
          scheduled: monthRecords.filter(r => r.status === 'scheduled').length,
          completed: monthRecords.filter(r => r.status === 'completed').length,
          cost: monthRecords.reduce((sum, r) => sum + (r.actualCost ? Number(r.actualCost) : 0), 0),
        });
      }

      // Upcoming maintenance (next 30 days)
      const upcomingDate = new Date();
      upcomingDate.setDate(upcomingDate.getDate() + 30);
      const upcomingMaintenance = records
        .filter(r => {
          const scheduledDate = new Date(r.scheduledDate);
          return scheduledDate >= new Date() && 
                 scheduledDate <= upcomingDate && 
                 (r.status === 'scheduled' || r.status === 'in_progress');
        })
        .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
        .slice(0, 10)
        .map(r => ({
          id: r.id,
          title: r.title,
          equipment: r.equipment?.name || 'Unknown',
          scheduledDate: r.scheduledDate.toISOString(),
          type: r.type,
        }));

      // Overdue maintenance
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const overdueMaintenance = records
        .filter(r => {
          const scheduledDate = new Date(r.scheduledDate);
          scheduledDate.setHours(0, 0, 0, 0);
          return scheduledDate < today && 
                 (r.status === 'scheduled' || r.status === 'in_progress');
        })
        .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
        .slice(0, 10)
        .map(r => {
          const scheduledDate = new Date(r.scheduledDate);
          const daysDiff = Math.floor((today.getTime() - scheduledDate.getTime()) / (1000 * 60 * 60 * 24));
          return {
            id: r.id,
            title: r.title,
            equipment: r.equipment?.name || 'Unknown',
            scheduledDate: r.scheduledDate.toISOString(),
            daysOverdue: daysDiff,
          };
        });

      return successResponse({
        summary: {
          totalRecords,
          scheduled,
          inProgress,
          completed,
          cancelled,
          totalEstimatedCost,
          totalActualCost,
        },
        byType,
        byStatus,
        monthlyTrend,
        upcomingMaintenance,
        overdueMaintenance,
      });
    },
    { required: true, module: 'maintenance' }
  );
}







