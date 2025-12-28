import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { Prisma } from '@prisma/tenant-client';

/**
 * GET /api/companies
 * List all companies in the current tenant
 * Returns hierarchical structure with parent-child relationships
 */
export async function GET(request: NextRequest) {
  return withTenant<ApiResponse<{ companies: unknown[]; total: number; currentTenant: unknown }>>(
    request,
    async (tenantPrisma) => {
      const searchParams = request.nextUrl.searchParams;
      
      // Parse query parameters
      const page = parseInt(searchParams.get('page') || '1', 10) || 1;
      const pageSize = parseInt(searchParams.get('pageSize') || '10', 10) || 10; // Get all for hierarchical view
      const search = searchParams.get('search') || undefined;
      const status = searchParams.get('status') || undefined;

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Build where clause
      const where: Prisma.CompanyWhereInput = {};

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { industry: { contains: search, mode: 'insensitive' } },
          { website: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (status) {
        where.status = status;
      }

      // Get total count
      const total = await tenantPrisma.company.count({ where });

      // Get all companies with user counts
      const companies = await tenantPrisma.company.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              users: true,
              assets: true,
              contents: true,
              websites: true,
            },
          },
        },
      });

      // Get current tenant info from core database
      const { corePrisma } = await import('@/lib/corePrisma');
      const currentTenant = await corePrisma.tenant.findUnique({
        where: { id: tenantContext.id },
        select: {
          id: true,
          name: true,
          slug: true,
          subdomain: true,
          customDomain: true,
          status: true,
          dbName: true,
          createdAt: true,
        },
      });

      return successResponse({
        companies: companies.map(company => ({
          id: company.id,
          name: company.name,
          industry: company.industry,
          website: company.website,
          status: company.status,
          // Kurumsal bilgiler (Template'ler için)
          logo: company.logo,
          logoFile: company.logoFile,
          favicon: company.favicon,
          address: company.address,
          city: company.city,
          state: company.state,
          postalCode: company.postalCode,
          country: company.country,
          phone: company.phone,
          email: company.email,
          taxNumber: company.taxNumber,
          taxOffice: company.taxOffice,
          registrationNumber: company.registrationNumber,
          mersisNumber: company.mersisNumber,
          iban: company.iban,
          bankName: company.bankName,
          accountHolder: company.accountHolder,
          description: company.description,
          createdAt: company.createdAt.toISOString(),
          updatedAt: company.updatedAt.toISOString(),
          usersCount: company._count.users,
          assetsCount: company._count.assets,
          contentsCount: company._count.contents,
          websitesCount: company._count.websites,
        })),
        total,
        currentTenant: currentTenant ? {
          id: currentTenant.id,
          name: currentTenant.name,
          slug: currentTenant.slug,
          subdomain: currentTenant.subdomain,
          customDomain: currentTenant.customDomain,
          status: currentTenant.status,
          dbName: currentTenant.dbName,
          createdAt: currentTenant.createdAt.toISOString(),
        } : null,
      });
    },
    { required: true }
  );
}





