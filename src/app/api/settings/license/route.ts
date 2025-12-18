// License Service API Route - Tenant
// GET /api/settings/license - Get current tenant license

import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { corePrisma } from '@/lib/corePrisma';
import { getTenantFromRequest } from '@/lib/api/tenantContext';

// GET /api/settings/license - Get current tenant license
export async function GET(request: NextRequest) {
  return withTenant<ApiResponse<{ license: unknown | null }>>(
    request,
    async () => {
      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Get active license for tenant
      const license = await corePrisma.tenantLicense.findFirst({
        where: {
          tenantId: tenantContext.id,
          status: 'active',
        },
        include: {
          package: true,
          payments: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
        orderBy: { endDate: 'desc' },
      });

      if (!license) {
        return successResponse({ license: null });
      }

      return successResponse({
        license: {
          ...license,
          startDate: license.startDate.toISOString(),
          endDate: license.endDate.toISOString(),
          renewalDate: license.renewalDate?.toISOString(),
          lastPaymentDate: license.lastPaymentDate?.toISOString(),
          nextPaymentDate: license.nextPaymentDate?.toISOString(),
          createdAt: license.createdAt.toISOString(),
          updatedAt: license.updatedAt.toISOString(),
          package: {
            ...license.package,
            basePrice: license.package.basePrice.toNumber(),
            createdAt: license.package.createdAt.toISOString(),
            updatedAt: license.package.updatedAt.toISOString(),
          },
          payments: license.payments.map(payment => ({
            ...payment,
            amount: payment.amount.toNumber(),
            approvedAt: payment.approvedAt?.toISOString(),
            paymentDate: payment.paymentDate.toISOString(),
            createdAt: payment.createdAt.toISOString(),
            updatedAt: payment.updatedAt.toISOString(),
          })),
        },
      });
    },
    { required: true, module: 'license' }
  );
}







