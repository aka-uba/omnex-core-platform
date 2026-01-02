import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { requireTenant } from '@/lib/api/tenantContext';
import { getCompanyIdFromRequest } from '@/lib/api/companyContext';
import dayjs from 'dayjs';

export const dynamic = 'force-dynamic';

interface ModuleSummary {
  module: string;
  icon: string;
  color: string;
  stats: {
    label: string;
    value: number | string;
    change?: number;
    changeLabel?: string;
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
            { label: 'Gayrimenkul', value: properties },
            { label: 'Daire', value: apartments.length },
            { label: 'Doluluk', value: `${occupancyRate}%` },
            { label: 'Bekleyen Ödeme', value: pendingPayments.length },
          ],
          quickActions: [
            { label: 'Yeni Sözleşme', href: '/modules/real-estate/contracts/new', icon: 'IconPlus' },
            { label: 'Ödemeler', href: '/modules/real-estate/payments', icon: 'IconCash' },
          ],
        });

        // Add upcoming appointments to events
        for (const apt of appointments) {
          upcomingEvents.push({
            id: apt.id,
            module: 'real-estate',
            type: 'appointment',
            title: apt.title || 'Randevu',
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
            title: `${expiringContracts.length} sözleşme sona ermek üzere`,
            description: 'Önümüzdeki 30 gün içinde sona erecek sözleşmeler var.',
            module: 'real-estate',
          });
        }

        // Add notification for pending payments
        if (pendingPayments.length > 0) {
          notifications.push({
            id: 'pending-payments',
            type: pendingPayments.some((p: any) => p.status === 'overdue') ? 'error' : 'warning',
            title: `${pendingPayments.length} bekleyen ödeme`,
            description: `Toplam ${pendingAmount.toLocaleString('tr-TR')} TL bekleyen ödeme bulunuyor.`,
            module: 'real-estate',
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
              { label: 'Dosya', value: files },
              { label: 'Klasör', value: folders },
              { label: 'Toplam Boyut', value: formatBytes(Number(totalStorage)) },
            ],
            quickActions: [
              { label: 'Dosya Yükle', href: '/modules/file-manager/dashboard', icon: 'IconUpload' },
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
            { label: 'Bugünkü Randevu', value: todayAppointments },
            { label: 'Bu Hafta', value: upcomingAppointmentsCount },
          ],
          quickActions: [
            { label: 'Yeni Randevu', href: '/modules/calendar/appointments', icon: 'IconPlus' },
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
              { label: 'Okunmamış Bildirim', value: unreadNotifications },
            ],
            quickActions: [
              { label: 'Tümünü Gör', href: '/modules/notifications/dashboard', icon: 'IconList' },
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
              { label: 'Çalışan', value: employees },
              { label: 'Departman', value: departments },
            ],
            quickActions: [
              { label: 'Çalışanlar', href: '/modules/hr/employees', icon: 'IconUsers' },
            ],
          });
        }
      } catch (e) {
        // Module not available
      }

      // Accounting Module
      try {
        const thisMonthStart = dayjs(now).startOf('month').toDate();
        const lastMonthStart = dayjs(now).subtract(1, 'month').startOf('month').toDate();
        const lastMonthEnd = dayjs(now).subtract(1, 'month').endOf('month').toDate();

        // CashTransaction verilerini çek (ana veri kaynağı)
        const [cashIncomeThisMonth, cashExpenseThisMonth, cashIncomeLastMonth] = await Promise.all([
          tenantPrisma.cashTransaction.aggregate({
            where: {
              tenantId: tenantContext.id,
              companyId,
              transactionDate: { gte: thisMonthStart },
              type: 'income',
            },
            _sum: { amount: true },
          }),
          tenantPrisma.cashTransaction.aggregate({
            where: {
              tenantId: tenantContext.id,
              companyId,
              transactionDate: { gte: thisMonthStart },
              type: 'expense',
            },
            _sum: { amount: true },
          }),
          tenantPrisma.cashTransaction.aggregate({
            where: {
              tenantId: tenantContext.id,
              companyId,
              transactionDate: { gte: lastMonthStart, lte: lastMonthEnd },
              type: 'income',
            },
            _sum: { amount: true },
          }),
        ]);

        const thisMonthRevenue = Number(cashIncomeThisMonth._sum?.amount || 0);
        const lastMonthRevenue = Number(cashIncomeLastMonth._sum?.amount || 0);
        const thisMonthExpenses = Number(cashExpenseThisMonth._sum?.amount || 0);
        const revenueChange = lastMonthRevenue > 0
          ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
          : 0;

        modules.push({
          module: 'accounting',
          icon: 'IconReportMoney',
          color: 'green',
          stats: [
            { label: 'Bu Ay Gelir', value: formatCurrency(thisMonthRevenue), change: revenueChange, changeLabel: 'geçen aya göre' },
            { label: 'Bu Ay Gider', value: formatCurrency(thisMonthExpenses) },
            { label: 'Net', value: formatCurrency(thisMonthRevenue - thisMonthExpenses) },
          ],
          quickActions: [
            { label: 'Kasa İşlemleri', href: '/modules/accounting/cash-transactions', icon: 'IconCash' },
            { label: 'Yeni İşlem', href: '/modules/accounting/cash-transactions', icon: 'IconPlus' },
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
              { label: 'Ürün', value: products },
              { label: 'Aktif Sipariş', value: orders },
            ],
            quickActions: [
              { label: 'Ürünler', href: '/modules/production/products', icon: 'IconBox' },
              { label: 'Siparişler', href: '/modules/production/orders', icon: 'IconShoppingCart' },
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

function formatCurrency(amount: number): string {
  return amount.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' ₺';
}
