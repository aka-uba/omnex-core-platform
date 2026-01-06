import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { verifyAuth } from '@/lib/auth/jwt';
import { Prisma } from '@prisma/tenant-client';

// Helper to map company data
function mapCompanyData(company: any, tenantInfo?: { id: string; name: string; slug: string } | null, isCurrentTenant: boolean = false) {
  return {
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
    createdAt: company.createdAt instanceof Date ? company.createdAt.toISOString() : company.createdAt,
    updatedAt: company.updatedAt instanceof Date ? company.updatedAt.toISOString() : company.updatedAt,
    usersCount: company._count?.users || 0,
    assetsCount: company._count?.assets || 0,
    contentsCount: company._count?.contents || 0,
    websitesCount: company._count?.websites || 0,
    // Tenant info for hierarchical display
    tenantId: tenantInfo?.id || null,
    tenantName: tenantInfo?.name || null,
    tenantSlug: tenantInfo?.slug || null,
    // isCoreTenant: SuperAdmin'in giriş yaptığı tenant'ın company'leri
    isCoreTenant: isCurrentTenant,
  };
}

/**
 * GET /api/companies
 * List all companies in the current tenant
 * SuperAdmin: Returns all tenants with their companies (hierarchical view)
 * Other roles: Returns only current tenant's companies
 */
export async function GET(request: NextRequest) {
  return withTenant<ApiResponse<{ companies: unknown[]; total: number; currentTenant: unknown; tenants?: unknown[] }>>(
    request,
    async (tenantPrisma) => {
      const searchParams = request.nextUrl.searchParams;

      // Parse query parameters
      const page = parseInt(searchParams.get('page') || '1', 10) || 1;
      const pageSize = parseInt(searchParams.get('pageSize') || '1000', 10) || 1000;
      const search = searchParams.get('search') || undefined;
      const status = searchParams.get('status') || undefined;

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Check if user is SuperAdmin
      const authResult = await verifyAuth(request);
      const isSuperAdmin = authResult.valid && authResult.payload?.role === 'SuperAdmin';

      const { corePrisma } = await import('@/lib/corePrisma');

      // Get current tenant info
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

      // If SuperAdmin, get all tenants with their companies
      if (isSuperAdmin) {
        // Get all active tenants from core database
        const allTenants = await corePrisma.tenant.findMany({
          where: { status: 'active' },
          orderBy: { createdAt: 'asc' },
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

        // Get companies from current tenant (the one SuperAdmin is logged into)
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

        const currentTenantCompanies = await tenantPrisma.company.findMany({
          where,
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

        // Build hierarchical response
        // Core tenant's companies are shown at root level (with isCoreTenant: true)
        // Other tenants are shown as children (expandable)
        const companies = currentTenantCompanies.map(company =>
          mapCompanyData(company, currentTenant, true) // true = current tenant's companies (Core)
        );

        // Add other tenants as "virtual" company entries for hierarchical display
        const tenantsForHierarchy = allTenants
          .filter(t => t.id !== currentTenant?.id) // Exclude current tenant
          .map(tenant => ({
            id: `tenant-${tenant.id}`,
            name: tenant.name,
            industry: 'Tenant',
            website: tenant.subdomain ? `${tenant.subdomain}.onwindos.com` : tenant.customDomain,
            status: tenant.status === 'active' ? 'Active' : 'Inactive',
            logo: null,
            logoFile: null,
            favicon: null,
            address: null,
            city: null,
            state: null,
            postalCode: null,
            country: null,
            phone: null,
            email: null,
            taxNumber: null,
            taxOffice: null,
            registrationNumber: null,
            mersisNumber: null,
            iban: null,
            bankName: null,
            accountHolder: null,
            description: `Database: ${tenant.dbName}`,
            createdAt: tenant.createdAt.toISOString(),
            updatedAt: tenant.createdAt.toISOString(),
            usersCount: 0,
            assetsCount: 0,
            contentsCount: 0,
            websitesCount: 0,
            tenantId: tenant.id,
            tenantName: tenant.name,
            tenantSlug: tenant.slug,
            isCoreTenant: false,
            isTenantEntry: true, // Flag to identify tenant entries
          }));

        return successResponse({
          companies: [...companies, ...tenantsForHierarchy],
          total: companies.length + tenantsForHierarchy.length,
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
          tenants: allTenants.map(t => ({
            id: t.id,
            name: t.name,
            slug: t.slug,
            subdomain: t.subdomain,
            customDomain: t.customDomain,
            status: t.status,
            dbName: t.dbName,
            createdAt: t.createdAt.toISOString(),
          })),
        });
      }

      // Non-SuperAdmin: Return only current tenant's companies
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

      const total = await tenantPrisma.company.count({ where });

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

      return successResponse({
        companies: companies.map(company => mapCompanyData(company, currentTenant, true)),
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
