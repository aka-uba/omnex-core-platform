import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { getCompanyIdFromRequest } from '@/lib/api/companyContext';
import { Prisma } from '@prisma/tenant-client';

// GET /api/real-estate/email/campaigns - List email campaigns
export async function GET(request: NextRequest) {
  return withTenant<ApiResponse<{ campaigns: unknown[]; total: number; page: number; pageSize: number }>>(
    request,
    async (tenantPrisma) => {
      const searchParams = request.nextUrl.searchParams;
      
      // Parse query parameters
      const page = parseInt(searchParams.get('page') || '1', 10) || 1;
      const pageSize = parseInt(searchParams.get('pageSize') || '10', 10) || 10;
      const search = searchParams.get('search') || undefined;
      const status = searchParams.get('status') || undefined;
      const templateId = searchParams.get('templateId') || undefined;
      const apartmentId = searchParams.get('apartmentId') || undefined;
      const companyId = searchParams.get('companyId') || undefined;

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Get companyId using helper function (cached)
      const finalCompanyId: string | undefined = companyId || ((await getCompanyIdFromRequest(request, tenantPrisma)) || undefined);

      // Build where clause
      // Build where clause with tenant and company isolation (defense-in-depth)
      const where: Prisma.EmailCampaignWhereInput = {
        tenantId: tenantContext.id,
        ...(finalCompanyId && { companyId: finalCompanyId }),
        ...(status && { status }),
        ...(templateId && { templateId }),
        ...(apartmentId && { apartmentId }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { notes: { contains: search, mode: 'insensitive' } },
          ],
        }),
      };

      // Get total count
      const total = await tenantPrisma.emailCampaign.count({ where });

      // Get campaigns
      const campaigns = await tenantPrisma.emailCampaign.findMany({
        where,
        include: {
          template: {
            select: {
              id: true,
              name: true,
              category: true,
              subject: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      });

      return successResponse({
        campaigns,
        total,
        page,
        pageSize,
      });
    }
  );
}








