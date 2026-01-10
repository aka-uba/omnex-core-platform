import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { requireTenant } from '@/lib/api/tenantContext';
import { getCompanyIdFromRequest } from '@/lib/api/companyContext';
import dayjs from 'dayjs';

export const revalidate = 300; // 5 min cache

interface ModuleSummary {
  module: string;
  icon: string;
  color: string;
  stats: {
    label: string;
    value: number | string;
    change?: number;
    changeLabel?: string;
    isCurrency?: boolean;
  }[];
  quickActions?: {
    label: string;
    href: string;
    icon: string;
  }[];
}

interface DashboardSummary {
  modules: ModuleSummary[];
  recentActivities: {
    id: string;
    module: string;
    type: string;
    title: string;
    description: string;
    date: string;
    icon: string;
    color: string;
  }[];
  upcomingEvents: {
    id: string;
    module: string;
    type: string;
    title: string;
    date: string;
    icon: string;
    color: string;
  }[];
  notifications: {
    id: string;
    type: 'warning' | 'info' | 'success' | 'error';
    title: string;
    description: string;
    module: string;
    meta?: {
      count?: number;
      amount?: number;
    };
  }[];
}

// GET /api/dashboard/summary - Get aggregated dashboard data from active modules
export async function GET(request: NextRequest) {
  return withTenant<ApiResponse<DashboardSummary>>(
    request,
    async (tenantPrisma) => {
      const tenantContext = await requireTenant(request);
      const companyId = await getCompanyIdFromRequest(request, tenantPrisma);
      if (!companyId) {
        return errorResponse('Company required', 'No company found for tenant', 400);
      }

      const now = new Date();
      const thirtyDaysFromNow = dayjs(now).add(30, 'days').toDate();
      const sevenDaysFromNow = dayjs(now).add(7, 'days').toDate();

      const modules: ModuleSummary[] = [];
      const recentActivities: DashboardSummary['recentActivities'] = [];
      const upcomingEvents: DashboardSummary['upcomingEvents'] = [];
      const notifications: DashboardSummary['notifications'] = [];

      // Real Estate Module
      try {
        const [properties, apartments, contracts, payments, appointments] = await Promise.all([
          tenantPrisma.property.count({
            where: { tenantId: tenantContext.id, companyId },
          }),
          tenantPrisma.apartment.findMany({
            where: { tenantId: tenantContext.id, companyId },
            select: { id: true, status: true },
          }),
          tenantPrisma.contract.findMany({
            where: { tenantId: tenantContext.id, companyId },
            select: { id: true, status: true, endDate: true },
          }),
          tenantPrisma.payment.findMany({
            where: { tenantId: tenantContext.id, companyId },
            select: { id: true, status: true, totalAmount: true, amount: true, dueDate: true },
          }),
          tenantPrisma.appointment.findMany({
            where: { tenantId: tenantContext.id, companyId, startDate: { gte: now } },
            select: { id: true, title: true, startDate: true, status: true },
            orderBy: { startDate: 'asc' },
            take: 5,
          }),
        ]);

        const activeContracts = contracts.filter((c: any) => c.status === 'active');
        const occupiedApartmentIds = new Set(activeContracts.map((c: any) => c.apartmentId));
        const occupancyRate = apartments.length > 0
          ? Math.round((apartments.filter((a: any) => occupiedApartmentIds.has(a.id) || a.status === 'rented').length / apartments.length) * 100)
          : 0;

        const pendingPayments = payments.filter((p: any) => p.status === 'pending' || p.status === 'overdue');
        const pendingAmount = pendingPayments.reduce((sum: number, p: any) => sum + Number(p.totalAmount || p.amount || 0), 0);

        const expiringContracts = contracts.filter((c: any) => {
          if (!c.endDate || c.status !== 'active') return false;
          return dayjs(c.endDate).isBefore(thirtyDaysFromNow) && dayjs(c.endDate).isAfter(now);
        });

        modules.push({
          module: 'real-estate',
          icon: 'IconBuilding',
          color: 'blue',
          stats: [
            { label: 'stats.properties', value: properties },
            { label: 'stats.apartments', value: apartments.length },
            { label: 'stats.occupancy', value: `${occupancyRate}%` },
            { label: 'stats.pendingPayments', value: pendingPayments.length },
          ],
          quickActions: [
            { label: 'actions.newContract', href: '/modules/real-estate/contracts/new', icon: 'IconPlus' },
            { label: 'actions.payments', href: '/modules/real-estate/payments', icon: 'IconCash' },
          ],
        });

        // Add upcoming appointments to events
        for (const apt of appointments) {
          upcomingEvents.push({
            id: apt.id,
            module: 'real-estate',
            type: 'appointment',
            title: apt.title || '',
            date: apt.startDate.toISOString(),
            icon: 'IconCalendar',
            color: 'blue',
          });
        }

        // Add notifications for expiring contracts
        if (expiringContracts.length > 0) {
          notifications.push({
            id: 'expiring-contracts',
            type: 'warning',
            title: 'notifications.expiringContracts',
            description: String(expiringContracts.length),
            module: 'real-estate',
          });
        }

        // Add notification for pending payments
        if (pendingPayments.length > 0) {
          notifications.push({
            id: 'pending-payments',
            type: pendingPayments.some((p: any) => p.status === 'overdue') ? 'error' : 'warning',
            title: 'notifications.pendingPayments',
            description: `${pendingPayments.length}`,
            module: 'real-estate',
            // Additional data for frontend formatting
            meta: {
              count: pendingPayments.length,
              amount: pendingAmount,
            },
          });
        }
      } catch (e) {
        // Module not available or error
      }

      // File Manager Module
      try {
        const prismaAny = tenantPrisma as any;
        if (prismaAny.file && prismaAny.folder) {
          const [files, folders] = await Promise.all([
            prismaAny.file.count({
              where: { tenantId: tenantContext.id, companyId },
            }),
            prismaAny.folder.count({
              where: { tenantId: tenantContext.id, companyId },
            }),
          ]);

          const totalStorageResult = await prismaAny.file.aggregate({
            where: { tenantId: tenantContext.id, companyId },
            _sum: { size: true },
          });
          const totalStorage = totalStorageResult._sum?.size || 0;

          modules.push({
            module: 'file-manager',
            icon: 'IconFolder',
            color: 'orange',
            stats: [
              { label: 'stats.files', value: files },
              { label: 'stats.folders', value: folders },
              { label: 'stats.totalSize', value: formatBytes(Number(totalStorage)) },
            ],
            quickActions: [
              { label: 'actions.uploadFile', href: '/modules/file-manager/dashboard', icon: 'IconUpload' },
            ],
          });
        }
      } catch (e) {
        // Module not available
      }

      // Calendar/Appointments Module
      try {
        const todayStart = dayjs(now).startOf('day').toDate();
        const todayEnd = dayjs(now).endOf('day').toDate();

        const [todayAppointments, upcomingAppointmentsCount] = await Promise.all([
          tenantPrisma.appointment.count({
            where: {
              tenantId: tenantContext.id,
              companyId,
              startDate: { gte: todayStart, lte: todayEnd },
            },
          }),
          tenantPrisma.appointment.count({
            where: {
              tenantId: tenantContext.id,
              companyId,
              startDate: { gte: now, lte: sevenDaysFromNow },
            },
          }),
        ]);

        modules.push({
          module: 'calendar',
          icon: 'IconCalendar',
          color: 'grape',
          stats: [
            { label: 'stats.todayAppointments', value: todayAppointments },
            { label: 'stats.thisWeek', value: upcomingAppointmentsCount },
          ],
          quickActions: [
            { label: 'actions.newAppointment', href: '/modules/calendar/appointments', icon: 'IconPlus' },
          ],
        });
      } catch (e) {
        // Module not available
      }

      // Notifications Module
      try {
        const unreadNotifications = await tenantPrisma.notification.count({
          where: {
            tenantId: tenantContext.id,
            isRead: false,
          },
        });

        if (unreadNotifications > 0) {
          modules.push({
            module: 'notifications',
            icon: 'IconBell',
            color: 'red',
            stats: [
              { label: 'stats.unreadNotifications', value: unreadNotifications },
            ],
            quickActions: [
              { label: 'actions.viewAll', href: '/modules/notifications/dashboard', icon: 'IconList' },
            ],
          });
        }
      } catch (e) {
        // Module not available
      }

      // HR Module
      try {
        const prismaAny = tenantPrisma as any;
        const employees = await tenantPrisma.employee.count({
          where: { tenantId: tenantContext.id, companyId, isActive: true },
        });
        const departments = prismaAny.department
          ? await prismaAny.department.count({ where: { tenantId: tenantContext.id, companyId } })
          : 0;

        if (employees > 0 || departments > 0) {
          modules.push({
            module: 'hr',
            icon: 'IconUsers',
            color: 'teal',
            stats: [
              { label: 'stats.employees', value: employees },
              { label: 'stats.departments', value: departments },
            ],
            quickActions: [
              { label: 'actions.employees', href: '/modules/hr/employees', icon: 'IconUsers' },
            ],
          });
        }
      } catch (e) {
        // Module not available
      }

      // Accounting Module - aggregate from multiple sources like cash-transactions API
      try {
        // 1. Income from paid Payments (Real Estate - rents)
        const paidPayments = await tenantPrisma.payment.aggregate({
          where: {
            tenantId: tenantContext.id,
            companyId,
            status: 'paid',
          },
          _sum: { totalAmount: true, amount: true },
          _count: true,
        });

        // 2. Income from paid Invoices
        const paidInvoices = await tenantPrisma.invoice.aggregate({
          where: {
            tenantId: tenantContext.id,
            companyId,
            status: 'paid',
          },
          _sum: { totalAmount: true },
          _count: true,
        });

        // 3. Expense from Expenses
        const approvedExpenses = await tenantPrisma.expense.aggregate({
          where: {
            tenantId: tenantContext.id,
            companyId,
            status: 'approved',
            isActive: true,
          },
          _sum: { amount: true },
          _count: true,
        });

        // 4. Expense from PropertyExpenses
        const propertyExpenses = await tenantPrisma.propertyExpense.aggregate({
          where: {
            tenantId: tenantContext.id,
            companyId,
            isActive: true,
          },
          _sum: { amount: true },
          _count: true,
        });

        // Calculate totals
        const paymentIncome = Number(paidPayments._sum?.totalAmount || paidPayments._sum?.amount || 0);
        const invoiceIncome = Number(paidInvoices._sum?.totalAmount || 0);
        const totalIncomeAmount = paymentIncome + invoiceIncome;

        const expenseAmount = Number(approvedExpenses._sum?.amount || 0);
        const propertyExpenseAmount = Number(propertyExpenses._sum?.amount || 0);
        const totalExpenseAmount = expenseAmount + propertyExpenseAmount;

        const netBalance = totalIncomeAmount - totalExpenseAmount;
        const transactionCount = (paidPayments._count || 0) + (paidInvoices._count || 0) +
                                 (approvedExpenses._count || 0) + (propertyExpenses._count || 0);

        modules.push({
          module: 'accounting',
          icon: 'IconReportMoney',
          color: 'green',
          stats: [
            { label: 'stats.totalIncome', value: totalIncomeAmount, isCurrency: true },
            { label: 'stats.totalExpense', value: totalExpenseAmount, isCurrency: true },
            { label: 'stats.currentBalance', value: netBalance, isCurrency: true },
            { label: 'stats.transactionCount', value: transactionCount },
          ],
          quickActions: [
            { label: 'actions.cashTransactions', href: '/modules/accounting/cash-transactions', icon: 'IconCash' },
            { label: 'actions.newTransaction', href: '/modules/accounting/cash-transactions', icon: 'IconPlus' },
          ],
        });
      } catch (e) {
        // Module not available
      }

      // Production Module
      try {
        const prismaAny = tenantPrisma as any;
        const products = await tenantPrisma.product.count({
          where: { tenantId: tenantContext.id, companyId, isActive: true },
        });
        const orders = prismaAny.order
          ? await prismaAny.order.count({ where: { tenantId: tenantContext.id, companyId, status: { in: ['pending', 'processing'] } } })
          : 0;

        if (products > 0 || orders > 0) {
          modules.push({
            module: 'production',
            icon: 'IconBox',
            color: 'indigo',
            stats: [
              { label: 'stats.products', value: products },
              { label: 'stats.activeOrders', value: orders },
            ],
            quickActions: [
              { label: 'actions.products', href: '/modules/production/products', icon: 'IconBox' },
              { label: 'actions.orders', href: '/modules/production/orders', icon: 'IconShoppingCart' },
            ],
          });
        }
      } catch (e) {
        // Module not available
      }

      return successResponse({
        modules,
        recentActivities,
        upcomingEvents,
        notifications,
      });
    },
    { required: true }
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

