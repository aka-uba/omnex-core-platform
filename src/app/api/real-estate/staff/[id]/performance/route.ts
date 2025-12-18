import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { Prisma } from '@prisma/tenant-client';
import dayjs from 'dayjs';

// GET /api/real-estate/staff/[id]/performance - Get staff performance metrics
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withTenant<ApiResponse<{
    performance: {
      assignedUnits: number;
      collectionRate: number;
      averageVacancyDays: number | null;
      customerSatisfaction: number | null;
      totalContracts: number;
      totalMaintenance: number;
      completedMaintenance: number;
      maintenanceCompletionRate: number;
      totalDue: number;
      totalPaid: number;
      emptyApartments: number;
      byStatus: {
        paid: { count: number; amount: number };
        pending: { count: number; amount: number };
        overdue: { count: number; amount: number };
      };
      monthlyTrend: Array<{
        month: string;
        collectionRate: number;
        maintenanceCompletionRate: number;
        totalDue: number;
        totalPaid: number;
        completedMaintenance: number;
        totalMaintenance: number;
      }>;
    };
  }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;
      const searchParams = request.nextUrl.searchParams;
      const dateFrom = searchParams.get('dateFrom') || undefined;
      const dateTo = searchParams.get('dateTo') || undefined;

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Get staff
      const staff = await tenantPrisma.realEstateStaff.findUnique({
        where: { id },
      });

      if (!staff) {
        return errorResponse('Staff not found', 'Real estate staff not found', 404);
      }

      // Check tenant access
      if (staff.tenantId !== tenantContext.id) {
        return errorResponse('Forbidden', 'Access denied', 403);
      }

      // Calculate performance metrics
      const apartmentIds = staff.apartmentIds;

      // Build date filter for payments
      const paymentDateFilter: Prisma.PaymentWhereInput = {};
      if (dateFrom) {
        paymentDateFilter.dueDate = { gte: new Date(dateFrom) };
      }
      if (dateTo) {
        const existingDueDate = paymentDateFilter.dueDate;
        if (existingDueDate && typeof existingDueDate === 'object') {
          paymentDateFilter.dueDate = { ...existingDueDate, lte: new Date(dateTo) };
        } else {
          paymentDateFilter.dueDate = { lte: new Date(dateTo) };
        }
      }

      // Get contracts for assigned apartments
      const contracts = await tenantPrisma.contract.findMany({
        where: {
          apartmentId: { in: apartmentIds },
          isActive: true,
        },
        include: {
          payments: {
            where: {
              ...paymentDateFilter,
            },
          },
        },
      });

      // Calculate collection rate
      let totalDue = 0;
      let totalPaid = 0;
      let paidCount = 0;
      let pendingCount = 0;
      let overdueCount = 0;
      let paidAmount = 0;
      let pendingAmount = 0;
      let overdueAmount = 0;

      contracts.forEach((contract) => {
        const rentAmount = contract.rentAmount ? Number(contract.rentAmount) : 0;
        totalDue += rentAmount;
        contract.payments.forEach((payment) => {
          const amount = payment.amount ? Number(payment.amount) : 0;
          if (payment.status === 'paid') {
            totalPaid += amount;
            paidCount++;
            paidAmount += amount;
          } else if (payment.status === 'pending') {
            pendingCount++;
            pendingAmount += amount;
            // Check if overdue
            if (payment.dueDate && dayjs(payment.dueDate).isBefore(dayjs(), 'day')) {
              overdueCount++;
              overdueAmount += amount;
            }
          } else if (payment.status === 'overdue') {
            overdueCount++;
            overdueAmount += amount;
          }
        });
      });
      const collectionRate = totalDue > 0 ? (totalPaid / totalDue) * 100 : 0;

      // Calculate average vacancy days (simplified - would need move-in/move-out dates)
      const emptyApartments = await tenantPrisma.apartment.count({
        where: {
          id: { in: apartmentIds },
          status: 'empty',
        },
      });
      const averageVacancyDays = staff.averageVacancyDays ? Number(staff.averageVacancyDays) : null;

      // Build date filter for maintenance
      const maintenanceDateFilter: Prisma.RealEstateMaintenanceRecordWhereInput = {};
      if (dateFrom) {
        maintenanceDateFilter.createdAt = { gte: new Date(dateFrom) };
      }
      if (dateTo) {
        const existingCreatedAt = maintenanceDateFilter.createdAt;
        if (existingCreatedAt && typeof existingCreatedAt === 'object') {
          maintenanceDateFilter.createdAt = { ...existingCreatedAt, lte: new Date(dateTo) };
        } else {
          maintenanceDateFilter.createdAt = { lte: new Date(dateTo) };
        }
      }

      // Get maintenance records
      const maintenanceRecords = await tenantPrisma.realEstateMaintenanceRecord.findMany({
        where: {
          apartmentId: { in: apartmentIds },
          assignedStaffId: id,
          ...maintenanceDateFilter,
        },
      });

      const completedMaintenance = maintenanceRecords.filter((m) => m.status === 'completed').length;
      const totalMaintenance = maintenanceRecords.length;
      const maintenanceCompletionRate = totalMaintenance > 0 ? (completedMaintenance / totalMaintenance) * 100 : 0;

      // Calculate monthly trend (last 12 months)
      const monthlyTrend: Array<{
        month: string;
        collectionRate: number;
        maintenanceCompletionRate: number;
        totalDue: number;
        totalPaid: number;
        completedMaintenance: number;
        totalMaintenance: number;
      }> = [];

      for (let i = 11; i >= 0; i--) {
        const monthStart = dayjs().subtract(i, 'month').startOf('month');
        const monthEnd = dayjs().subtract(i, 'month').endOf('month');
        const monthKey = monthStart.format('YYYY-MM');

        // Get payments for this month
        const monthPayments = await tenantPrisma.payment.findMany({
          where: {
            contract: {
              apartmentId: { in: apartmentIds },
            },
            dueDate: {
              gte: monthStart.toDate(),
              lte: monthEnd.toDate(),
            },
          },
        });

        let monthDue = 0;
        let monthPaid = 0;
        monthPayments.forEach((payment) => {
          const amount = payment.amount ? Number(payment.amount) : 0;
          monthDue += amount;
          if (payment.status === 'paid') {
            monthPaid += amount;
          }
        });

        const monthCollectionRate = monthDue > 0 ? (monthPaid / monthDue) * 100 : 0;

        // Get maintenance for this month
        const monthMaintenance = await tenantPrisma.realEstateMaintenanceRecord.findMany({
          where: {
            apartmentId: { in: apartmentIds },
            assignedStaffId: id,
            createdAt: {
              gte: monthStart.toDate(),
              lte: monthEnd.toDate(),
            },
          },
        });

        const monthCompletedMaintenance = monthMaintenance.filter((m) => m.status === 'completed').length;
        const monthTotalMaintenance = monthMaintenance.length;
        const monthMaintenanceCompletionRate = monthTotalMaintenance > 0 ? (monthCompletedMaintenance / monthTotalMaintenance) * 100 : 0;

        monthlyTrend.push({
          month: monthKey,
          collectionRate: monthCollectionRate,
          maintenanceCompletionRate: monthMaintenanceCompletionRate,
          totalDue: monthDue,
          totalPaid: monthPaid,
          completedMaintenance: monthCompletedMaintenance,
          totalMaintenance: monthTotalMaintenance,
        });
      }

      const performance = {
        assignedUnits: staff.assignedUnits,
        collectionRate: staff.collectionRate ? Number(staff.collectionRate) : collectionRate,
        averageVacancyDays: averageVacancyDays,
        customerSatisfaction: staff.customerSatisfaction ? Number(staff.customerSatisfaction) : null,
        totalContracts: contracts.length,
        totalMaintenance: totalMaintenance,
        completedMaintenance,
        maintenanceCompletionRate,
        totalDue,
        totalPaid,
        emptyApartments,
        byStatus: {
          paid: { count: paidCount, amount: paidAmount },
          pending: { count: pendingCount, amount: pendingAmount },
          overdue: { count: overdueCount, amount: overdueAmount },
        },
        monthlyTrend,
      };

      return successResponse({ performance });
    }
  );
}








