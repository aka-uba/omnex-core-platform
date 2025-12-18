// License Stats API Route - Admin
// GET /api/admin/licenses/stats - Get license statistics

import { NextRequest } from 'next/server';
import { withoutTenant } from '@/lib/api/withTenant';
import { successResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { corePrisma } from '@/lib/corePrisma';

interface DashboardStats {
  totalTypes: number;
  totalPackages: number;
  totalLicenses: number;
  activeLicenses: number;
  trialLicenses: number;
  expiredLicenses: number;
  pendingPayments: number;
  totalRevenue: number;
  expiringThisMonth: number;
}

// GET /api/admin/licenses/stats - Get dashboard statistics
export async function GET(request: NextRequest) {
  return withoutTenant<ApiResponse<DashboardStats>>(
    async () => {
      // Get current date for calculations
      const now = new Date();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Run all queries in parallel
      const [
        totalTypes,
        totalPackages,
        totalLicenses,
        activeLicenses,
        trialLicenses,
        expiredLicenses,
        pendingPayments,
        expiringThisMonth,
      ] = await Promise.all([
        // Total license types
        corePrisma.licenseType.count(),
        // Total packages
        corePrisma.licensePackage.count(),
        // Total licenses
        corePrisma.tenantLicense.count(),
        // Active licenses
        corePrisma.tenantLicense.count({
          where: { status: 'active' },
        }),
        // Trial licenses
        corePrisma.tenantLicense.count({
          where: { status: 'trial' },
        }),
        // Expired licenses
        corePrisma.tenantLicense.count({
          where: { status: 'expired' },
        }),
        // Pending payments
        corePrisma.tenantLicense.count({
          where: { paymentStatus: 'pending' },
        }),
        // Expiring this month
        corePrisma.tenantLicense.count({
          where: {
            status: 'active',
            endDate: {
              gte: now,
              lte: endOfMonth,
            },
          },
        }),
      ]);

      // Calculate total revenue (simplified - sum of all packages' base prices)
      const totalRevenue = 0; // Can be calculated from payment records if available

      return successResponse({
        totalTypes,
        totalPackages,
        totalLicenses,
        activeLicenses,
        trialLicenses,
        expiredLicenses,
        pendingPayments,
        totalRevenue,
        expiringThisMonth,
      });
    },
    'license'
  );
}
