import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { requireTenant } from '@/lib/api/tenantContext';
import { getCompanyIdFromRequest } from '@/lib/api/companyContext';
import dayjs from 'dayjs';

export const dynamic = 'force-dynamic';


// GET /api/real-estate/dashboard - Get dashboard statistics and analytics
export async function GET(request: NextRequest) {
  return withTenant<ApiResponse<{
    statistics: {
      properties: {
        total: number;
        active: number;
        byType: Record<string, number>;
      };
      apartments: {
        total: number;
        occupied: number;
        vacant: number;
        occupancyRate: number;
      };
      tenants: {
        total: number;
        active: number;
        inactive: number;
      };
      contracts: {
        total: number;
        active: number;
        expired: number;
        expiringSoon: number; // Expiring in next 30 days
        byStatus: Record<string, number>;
      };
      payments: {
        total: number;
        paid: number;
        pending: number;
        overdue: number;
        totalAmount: number;
        paidAmount: number;
        pendingAmount: number;
        overdueAmount: number;
        byStatus: Record<string, { count: number; amount: number }>;
        byType: Record<string, { count: number; amount: number }>;
      };
      appointments: {
        total: number;
        upcoming: number;
        completed: number;
        cancelled: number;
        byStatus: Record<string, number>;
      };
      maintenance: {
        total: number;
        open: number;
        inProgress: number;
        completed: number;
        byType: Record<string, number>;
      };
    };
    revenue: {
      total: number;
      thisMonth: number;
      lastMonth: number;
      monthlyTrend: Array<{
        month: string;
        revenue: number;
        expenses: number;
        net: number;
      }>;
    };
    recentActivity: Array<{
      id: string;
      type: 'payment' | 'contract' | 'appointment' | 'maintenance' | 'tenant';
      title: string;
      description: string;
      date: string;
      icon: string;
      color: string;
    }>;
    upcomingPayments: Array<{
      id: string;
      tenantName: string;
      apartment: string;
      amount: number;
      currency: string;
      dueDate: string;
      daysUntilDue: number;
    }>;
    expiringContracts: Array<{
      id: string;
      contractNumber: string;
      tenantName: string;
      apartment: string;
      endDate: string;
      daysUntilExpiry: number;
    }>;
  }>>(
    request,
    async (tenantPrisma) => {
      const tenantContext = await requireTenant(request);
      const companyId = await getCompanyIdFromRequest(request, tenantPrisma);
      if (!companyId) {
        return errorResponse('Company required', 'No company found for tenant', 400);
      }

      const now = new Date();
      const thirtyDaysFromNow = dayjs(now).add(30, 'days').toDate();

      // Properties Statistics
      const properties = await tenantPrisma.property.findMany({
        where: {
          tenantId: tenantContext.id,
          companyId: companyId,
        },
        select: {
          id: true,
          isActive: true,
          type: true,
        },
      });

      const propertiesByType: Record<string, number> = {};
      properties.forEach((p: any) => {
        const type = p.type || 'other';
        propertiesByType[type] = (propertiesByType[type] || 0) + 1;
      });

      // Apartments Statistics
      const apartments = await tenantPrisma.apartment.findMany({
        where: {
          tenantId: tenantContext.id,
          companyId: companyId,
        },
        select: {
          id: true,
          status: true,
        },
      });

      // Check for active contracts to determine occupancy
      const apartmentIds = apartments.map((a: any) => a.id);
      const activeContractsForOccupancy = await tenantPrisma.contract.findMany({
        where: {
          tenantId: tenantContext.id,
          companyId: companyId,
          apartmentId: { in: apartmentIds },
          status: 'active',
        },
        select: {
          apartmentId: true,
        },
      });

      const occupiedApartmentIds = new Set(activeContractsForOccupancy.map((c: any) => c.apartmentId));
      const occupiedApartments = apartments.filter((a: any) => 
        occupiedApartmentIds.has(a.id) || a.status === 'rented'
      ).length;
      const occupancyRate = apartments.length > 0 
        ? Math.round((occupiedApartments / apartments.length) * 100) 
        : 0;

      // Tenants Statistics
      const tenants = await tenantPrisma.tenant.findMany({
        where: {
          tenantId: tenantContext.id,
        },
        select: {
          id: true,
          isActive: true,
        },
      });

      // Contracts Statistics
      const contracts = await tenantPrisma.contract.findMany({
        where: {
          tenantId: tenantContext.id,
          companyId: companyId,
        },
        select: {
          id: true,
          status: true,
          endDate: true,
        },
      });

      const activeContracts = contracts.filter((c: any) => c.status === 'active').length;
      const expiredContracts = contracts.filter((c: any) => {
        if (!c.endDate) return false;
        return dayjs(c.endDate).isBefore(now, 'day');
      }).length;
      const expiringSoonContracts = contracts.filter((c: any) => {
        if (!c.endDate || c.status !== 'active') return false;
        const endDate = dayjs(c.endDate);
        return endDate.isAfter(now, 'day') && endDate.isBefore(thirtyDaysFromNow, 'day');
      }).length;

      const contractsByStatus: Record<string, number> = {};
      contracts.forEach((c: any) => {
        const status = c.status || 'unknown';
        contractsByStatus[status] = (contractsByStatus[status] || 0) + 1;
      });

      // Payments Statistics
      const payments = await tenantPrisma.payment.findMany({
        where: {
          tenantId: tenantContext.id,
          companyId: companyId,
        },
        select: {
          id: true,
          status: true,
          type: true,
          amount: true,
          totalAmount: true,
          currency: true,
          dueDate: true,
          paidDate: true,
        },
      });

      const paidPayments = payments.filter((p: any) => p.status === 'paid');
      const pendingPayments = payments.filter((p: any) => p.status === 'pending');
      const overduePayments = payments.filter((p: any) => {
        if (p.status === 'paid') return false;
        if (!p.dueDate) return false;
        return dayjs(p.dueDate).isBefore(now, 'day');
      });

      const totalAmount = payments.reduce((sum: number, p: any) => sum + Number(p.totalAmount || p.amount || 0), 0);
      const paidAmount = paidPayments.reduce((sum: number, p: any) => sum + Number(p.totalAmount || p.amount || 0), 0);
      const pendingAmount = pendingPayments.reduce((sum: number, p: any) => sum + Number(p.totalAmount || p.amount || 0), 0);
      const overdueAmount = overduePayments.reduce((sum: number, p: any) => sum + Number(p.totalAmount || p.amount || 0), 0);

      const paymentsByStatus: Record<string, { count: number; amount: number }> = {};
      payments.forEach((p: any) => {
        const status = p.status || 'unknown';
        if (!paymentsByStatus[status]) {
          paymentsByStatus[status] = { count: 0, amount: 0 };
        }
        paymentsByStatus[status].count += 1;
        paymentsByStatus[status].amount += Number(p.totalAmount || p.amount || 0);
      });

      const paymentsByType: Record<string, { count: number; amount: number }> = {};
      payments.forEach((p: any) => {
        const type = p.type || 'unknown';
        if (!paymentsByType[type]) {
          paymentsByType[type] = { count: 0, amount: 0 };
        }
        paymentsByType[type].count += 1;
        paymentsByType[type].amount += Number(p.totalAmount || p.amount || 0);
      });

      // Appointments Statistics
      const appointments = await tenantPrisma.appointment.findMany({
        where: {
          tenantId: tenantContext.id,
          companyId: companyId,
        },
        select: {
          id: true,
          status: true,
          startDate: true,
        },
      });

      const upcomingAppointments = appointments.filter((a: any) => {
        if (!a.startDate) return false;
        return dayjs(a.startDate).isAfter(now);
      }).length;

      const appointmentsByStatus: Record<string, number> = {};
      appointments.forEach((a: any) => {
        const status = a.status || 'unknown';
        appointmentsByStatus[status] = (appointmentsByStatus[status] || 0) + 1;
      });

      // Maintenance Statistics
      const maintenanceRecords = await tenantPrisma.realEstateMaintenanceRecord.findMany({
        where: {
          tenantId: tenantContext.id,
          companyId: companyId,
        },
        select: {
          id: true,
          status: true,
          type: true,
        },
      });

      const maintenanceByType: Record<string, number> = {};
      maintenanceRecords.forEach((m: any) => {
        const type = m.type || 'unknown';
        maintenanceByType[type] = (maintenanceByType[type] || 0) + 1;
      });

      // Revenue Calculations
      const thisMonthStart = dayjs(now).startOf('month').toDate();
      const lastMonthStart = dayjs(now).subtract(1, 'month').startOf('month').toDate();
      const lastMonthEnd = dayjs(now).subtract(1, 'month').endOf('month').toDate();

      const thisMonthPayments = paidPayments.filter((p: any) => {
        if (!p.paidDate) return false;
        return dayjs(p.paidDate).isAfter(thisMonthStart) || dayjs(p.paidDate).isSame(thisMonthStart, 'day');
      });
      const lastMonthPayments = paidPayments.filter((p: any) => {
        if (!p.paidDate) return false;
        return dayjs(p.paidDate).isAfter(lastMonthStart) && dayjs(p.paidDate).isBefore(lastMonthEnd) || dayjs(p.paidDate).isSame(lastMonthStart, 'day') || dayjs(p.paidDate).isSame(lastMonthEnd, 'day');
      });

      const thisMonthRevenue = thisMonthPayments.reduce((sum: number, p: any) => sum + Number(p.totalAmount || p.amount || 0), 0);
      const lastMonthRevenue = lastMonthPayments.reduce((sum: number, p: any) => sum + Number(p.totalAmount || p.amount || 0), 0);

      // Monthly Trend (last 12 months)
      const monthlyTrend = [];
      for (let i = 11; i >= 0; i--) {
        const monthStart = dayjs(now).subtract(i, 'months').startOf('month').toDate();
        const monthEnd = dayjs(now).subtract(i, 'months').endOf('month').toDate();
        
        const monthPayments = paidPayments.filter((p: any) => {
          if (!p.paidDate) return false;
          return dayjs(p.paidDate).isAfter(monthStart) && dayjs(p.paidDate).isBefore(monthEnd) || dayjs(p.paidDate).isSame(monthStart, 'day') || dayjs(p.paidDate).isSame(monthEnd, 'day');
        });

        const monthRevenue = monthPayments.reduce((sum: number, p: any) => sum + Number(p.totalAmount || p.amount || 0), 0);
        // Expenses would come from accounting module - for now set to 0
        const monthExpenses = 0;

        monthlyTrend.push({
          month: dayjs(monthStart).format('YYYY-MM'),
          revenue: monthRevenue,
          expenses: monthExpenses,
          net: monthRevenue - monthExpenses,
        });
      }

      // Upcoming Payments (next 30 days)
      const upcomingPaymentsData = await tenantPrisma.payment.findMany({
        where: {
          tenantId: tenantContext.id,
          companyId: companyId,
          status: { in: ['pending', 'overdue'] },
          dueDate: {
            gte: now,
            lte: thirtyDaysFromNow,
          },
        },
        include: {
          contract: {
            include: {
              tenantRecord: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
              apartment: {
                select: {
                  unitNumber: true,
                },
              },
            },
          },
        },
        orderBy: {
          dueDate: 'asc',
        },
        take: 10,
      });

      const upcomingPayments = upcomingPaymentsData.map((p: any) => {
        const tenant = p.contract?.tenantRecord;
        const tenantName = tenant 
          ? `${tenant.firstName || ''} ${tenant.lastName || ''}`.trim() || '-'
          : '-';
        const apartment = p.contract?.apartment?.unitNumber || '-';
        const daysUntilDue = dayjs(p.dueDate).diff(now, 'days');

        return {
          id: p.id,
          tenantName,
          apartment,
          amount: Number(p.totalAmount || p.amount || 0),
          currency: p.currency || 'TRY',
          dueDate: p.dueDate.toISOString(),
          daysUntilDue,
        };
      });

      // Expiring Contracts (next 30 days)
      const expiringContractsData = await tenantPrisma.contract.findMany({
        where: {
          tenantId: tenantContext.id,
          companyId: companyId,
          status: 'active',
          endDate: {
            gte: now,
            lte: thirtyDaysFromNow,
          },
        },
        include: {
          tenantRecord: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          apartment: {
            select: {
              unitNumber: true,
            },
          },
        },
        orderBy: {
          endDate: 'asc',
        },
        take: 10,
      });

      const expiringContracts = expiringContractsData.map((c: any) => {
        const tenant = c.tenantRecord;
        const tenantName = tenant 
          ? `${tenant.firstName || ''} ${tenant.lastName || ''}`.trim() || '-'
          : '-';
        const apartment = c.apartment?.unitNumber || '-';
        const daysUntilExpiry = dayjs(c.endDate).diff(now, 'days');

        return {
          id: c.id,
          contractNumber: c.contractNumber || '-',
          tenantName,
          apartment,
          endDate: c.endDate.toISOString(),
          daysUntilExpiry,
        };
      });

      // Recent Activity (last 20 activities)
      const recentPayments = await tenantPrisma.payment.findMany({
        where: {
          tenantId: tenantContext.id,
          companyId: companyId,
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: 5,
        include: {
          contract: {
            include: {
              tenantRecord: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });

      const recentContracts = await tenantPrisma.contract.findMany({
        where: {
          tenantId: tenantContext.id,
          companyId: companyId,
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: 5,
        include: {
          tenantRecord: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      const recentAppointments = await tenantPrisma.appointment.findMany({
        where: {
          tenantId: tenantContext.id,
          companyId: companyId,
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: 5,
      });

      const recentActivity = [
        ...recentPayments.map((p: any) => {
          const tenant = p.contract?.tenantRecord;
          const tenantName = tenant 
            ? `${tenant.firstName || ''} ${tenant.lastName || ''}`.trim() || 'Bilinmeyen'
            : 'Bilinmeyen';
          return {
            id: p.id,
            type: 'payment' as const,
            title: `${tenantName} - ${p.status === 'paid' ? 'Ödeme Alındı' : p.status === 'pending' ? 'Bekleyen Ödeme' : 'Vadesi Geçmiş Ödeme'}`,
            description: `${Number(p.totalAmount || p.amount || 0).toLocaleString('tr-TR')} ${p.currency || 'TRY'}`,
            date: p.updatedAt.toISOString(),
            icon: 'IconCurrencyDollar',
            color: p.status === 'paid' ? 'green' : p.status === 'overdue' ? 'red' : 'yellow',
          };
        }),
        ...recentContracts.map((c: any) => {
          const tenant = c.tenantRecord;
          const tenantName = tenant 
            ? `${tenant.firstName || ''} ${tenant.lastName || ''}`.trim() || 'Bilinmeyen'
            : 'Bilinmeyen';
          return {
            id: c.id,
            type: 'contract' as const,
            title: `${tenantName} - ${c.status === 'active' ? 'Aktif Sözleşme' : c.status === 'expired' ? 'Süresi Dolmuş' : 'Sözleşme'}`,
            description: c.contractNumber || '-',
            date: c.updatedAt.toISOString(),
            icon: 'IconFileText',
            color: c.status === 'active' ? 'blue' : 'gray',
          };
        }),
        ...recentAppointments.map((a: any) => ({
          id: a.id,
          type: 'appointment' as const,
          title: `${a.status === 'completed' ? 'Tamamlanan Randevu' : a.status === 'cancelled' ? 'İptal Edilen Randevu' : 'Yaklaşan Randevu'}`,
          description: a.notes || '-',
          date: a.updatedAt.toISOString(),
          icon: 'IconCalendar',
          color: a.status === 'completed' ? 'green' : a.status === 'cancelled' ? 'red' : 'blue',
        })),
      ]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 20);

      return successResponse({
        statistics: {
          properties: {
            total: properties.length,
            active: properties.filter((p: any) => p.isActive).length,
            byType: propertiesByType,
          },
          apartments: {
            total: apartments.length,
            occupied: occupiedApartments,
            vacant: apartments.length - occupiedApartments,
            occupancyRate,
          },
          tenants: {
            total: tenants.length,
            active: tenants.filter((t: any) => t.isActive).length,
            inactive: tenants.filter((t: any) => t.isActive === false).length,
          },
          contracts: {
            total: contracts.length,
            active: activeContracts,
            expired: expiredContracts,
            expiringSoon: expiringSoonContracts,
            byStatus: contractsByStatus,
          },
          payments: {
            total: payments.length,
            paid: paidPayments.length,
            pending: pendingPayments.length,
            overdue: overduePayments.length,
            totalAmount,
            paidAmount,
            pendingAmount,
            overdueAmount,
            byStatus: paymentsByStatus,
            byType: paymentsByType,
          },
          appointments: {
            total: appointments.length,
            upcoming: upcomingAppointments,
            completed: appointments.filter((a: any) => a.status === 'completed').length,
            cancelled: appointments.filter((a: any) => a.status === 'cancelled').length,
            byStatus: appointmentsByStatus,
          },
          maintenance: {
            total: maintenanceRecords.length,
            open: maintenanceRecords.filter((m: any) => m.status === 'open').length,
            inProgress: maintenanceRecords.filter((m: any) => m.status === 'in_progress').length,
            completed: maintenanceRecords.filter((m: any) => m.status === 'completed').length,
            byType: maintenanceByType,
          },
        },
        revenue: {
          total: paidAmount,
          thisMonth: thisMonthRevenue,
          lastMonth: lastMonthRevenue,
          monthlyTrend,
        },
        recentActivity,
        upcomingPayments,
        expiringContracts,
      });
    },
    { required: true, module: 'real-estate' }
  );
}

