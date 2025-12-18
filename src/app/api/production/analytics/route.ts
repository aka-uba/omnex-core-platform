import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { Prisma } from '@prisma/tenant-client';
import dayjs from 'dayjs';

// GET /api/production/analytics - Get production analytics
export async function GET(request: NextRequest) {
  return withTenant<ApiResponse<{
    summary: {
      totalProducts: number;
      totalOrders: number;
      activeOrders: number;
      completedOrders: number;
      totalStockValue: number;
    };
    ordersByStatus: Array<{ status: string; count: number }>;
    ordersByMonth: Array<{ month: string; count: number; completed: number }>;
    lowStockProducts: number;
  }>>(
    request,
    async (tenantPrisma) => {
      const searchParams = request.nextUrl.searchParams;
      const dateFrom = searchParams.get('dateFrom');
      const dateTo = searchParams.get('dateTo');

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Build date filter
      const whereDate: Prisma.ProductionOrderWhereInput = {};
      if (dateFrom || dateTo) {
        whereDate.createdAt = {};
        if (dateFrom) {
          whereDate.createdAt.gte = new Date(dateFrom);
        }
        if (dateTo) {
          whereDate.createdAt.lte = new Date(dateTo);
        }
      }

      // Get summary
      const [totalProducts, totalOrders, activeOrders, completedOrders, ordersByStatus, ordersByMonth, productsForLowStock] = await Promise.all([
        // Total products
        tenantPrisma.product.count({
          where: {
            tenantId: tenantContext.id,
            isActive: true,
          },
        }),
        // Total orders
        tenantPrisma.productionOrder.count({
          where: {
            tenantId: tenantContext.id,
            ...whereDate,
          },
        }),
        // Active orders
        tenantPrisma.productionOrder.count({
          where: {
            tenantId: tenantContext.id,
            status: { in: ['pending', 'in_progress'] },
            isActive: true,
            ...whereDate,
          },
        }),
        // Completed orders
        tenantPrisma.productionOrder.count({
          where: {
            tenantId: tenantContext.id,
            status: 'completed',
            ...whereDate,
          },
        }),
        // Orders by status
        tenantPrisma.productionOrder.groupBy({
          by: ['status'],
          where: {
            tenantId: tenantContext.id,
            ...whereDate,
          },
          _count: true,
        }),
        // Orders by month (last 12 months)
        tenantPrisma.productionOrder.findMany({
          where: {
            tenantId: tenantContext.id,
            createdAt: {
              gte: dayjs().subtract(12, 'months').toDate(),
            },
          },
          select: {
            createdAt: true,
            status: true,
          },
        }),
        // Low stock products - get all products and filter in JS
        tenantPrisma.product.findMany({
          where: {
            tenantId: tenantContext.id,
            isActive: true,
            minStockLevel: { not: null },
          },
          select: {
            stockQuantity: true,
            minStockLevel: true,
          },
        }),
      ]);

      // Calculate low stock products count
      const lowStockProducts = productsForLowStock.filter((p) => {
        const stockQty = Number(p.stockQuantity);
        const minLevel = p.minStockLevel ? Number(p.minStockLevel) : null;
        return minLevel !== null && stockQty <= minLevel;
      }).length;

      // Calculate total stock value
      const products = await tenantPrisma.product.findMany({
        where: {
          tenantId: tenantContext.id,
          isActive: true,
        },
        select: {
          stockQuantity: true,
          costPrice: true,
        },
      });

      const totalStockValue = products.reduce((sum, p) => {
        const quantity = Number(p.stockQuantity);
        const price = p.costPrice ? Number(p.costPrice) : 0;
        return sum + (quantity * price);
      }, 0);

      // Process orders by month
      const monthlyData: Record<string, { count: number; completed: number }> = {};
      ordersByMonth.forEach((order) => {
        const month = dayjs(order.createdAt).format('YYYY-MM');
        if (!monthlyData[month]) {
          monthlyData[month] = { count: 0, completed: 0 };
        }
        monthlyData[month].count++;
        if (order.status === 'completed') {
          monthlyData[month].completed++;
        }
      });

      const ordersByMonthFormatted = Object.entries(monthlyData)
        .map(([month, data]) => ({
          month,
          count: data.count,
          completed: data.completed,
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

      return successResponse({
        summary: {
          totalProducts,
          totalOrders,
          activeOrders,
          completedOrders,
          totalStockValue,
        },
        ordersByStatus: ordersByStatus.map((item) => ({
          status: item.status,
          count: item._count,
        })),
        ordersByMonth: ordersByMonthFormatted,
        lowStockProducts,
      });
    },
    { required: true, module: 'production' }
  );
}


