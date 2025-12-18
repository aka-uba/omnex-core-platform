import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { verifyAuth } from '@/lib/auth/jwt';
/**
 * GET /api/company
 * Get current company information
 */
export async function GET(request: NextRequest) {
  return withTenant<ApiResponse<any>>(
    request,
    async (tenantPrisma) => {
      try {
        const authResult = await verifyAuth(request);
        if (!authResult.valid || !authResult.payload) {
          return errorResponse('Unauthorized', 'Authentication required', 401);
        }

        const tenantContext = await getTenantFromRequest(request);
        if (!tenantContext) {
          return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
        }

        // Get companyId from query params
        const searchParams = request.nextUrl.searchParams;
        let companyId = searchParams.get('companyId');

        if (!companyId) {
          // Get first company if no companyId provided
          const firstCompany = await tenantPrisma.company.findFirst({
            select: { id: true },
            orderBy: { createdAt: 'asc' },
          });
          companyId = firstCompany?.id || null;
        }

        if (!companyId) {
          return errorResponse('Company not found', 'No company found for this tenant', 404);
        }

        const company = await tenantPrisma.company.findUnique({
          where: { id: companyId },
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

        // For SuperAdmin, if no company found, try to get from core database
        if (!company && authResult.payload.role === 'SuperAdmin') {
          // SuperAdmin might not have a company in tenant DB, return tenant info instead
          const { corePrisma } = await import('@/lib/corePrisma');
          const tenant = await corePrisma.tenant.findUnique({
            where: { id: tenantContext.id },
          });

          if (tenant) {
            // Get actual statistics for SuperAdmin
            const [usersCount, assetsCount, contentsCount, websitesCount] = await Promise.all([
              tenantPrisma.user.count(),
              tenantPrisma.asset.count(),
              tenantPrisma.content.count(),
              tenantPrisma.website.count(),
            ]);

            return successResponse({
              id: tenant.id,
              name: tenant.name,
              industry: null,
              website: tenant.customDomain || tenant.subdomain || null,
              status: tenant.status,
              logo: null,
              logoFile: null,
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
              description: null,
              foundedYear: null,
              employeeCount: null,
              capital: null,
              createdAt: tenant.createdAt.toISOString(),
              updatedAt: tenant.updatedAt.toISOString(),
              stats: {
                usersCount,
                assetsCount,
                contentsCount,
                websitesCount,
              },
            });
          }
        }

        if (!company) {
          return errorResponse('Company not found', 'Company with the given ID was not found', 404);
        }

        return successResponse({
          id: company.id,
          name: company.name,
          industry: company.industry,
          website: company.website,
          status: company.status,
          logo: company.logo,
          logoFile: company.logoFile,
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
          foundedYear: company.foundedYear,
          employeeCount: company.employeeCount,
          capital: company.capital,
          createdAt: company.createdAt.toISOString(),
          updatedAt: company.updatedAt.toISOString(),
          stats: {
            usersCount: company._count.users,
            assetsCount: company._count.assets,
            contentsCount: company._count.contents,
            websitesCount: company._count.websites,
          },
        });
      } catch (error: any) {
        return errorResponse('Failed to fetch company', error.message || 'An error occurred', 500);
      }
    },
    { required: true }
  );
}

/**
 * PUT /api/company
 * Update current company information
 */
export async function PUT(request: NextRequest) {
  return withTenant<ApiResponse<any>>(
    request,
    async (tenantPrisma) => {
      try {
        const authResult = await verifyAuth(request);
        if (!authResult.valid || !authResult.payload) {
          return errorResponse('Unauthorized', 'Authentication required', 401);
        }

        const tenantContext = await getTenantFromRequest(request);
        if (!tenantContext) {
          return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
        }

        const body = await request.json();
        const searchParams = request.nextUrl.searchParams;
        let companyId = searchParams.get('companyId') || body.companyId;

        if (!companyId) {
          const firstCompany = await tenantPrisma.company.findFirst({
            select: { id: true },
            orderBy: { createdAt: 'asc' },
          });
          companyId = firstCompany?.id || null;
        }

        if (!companyId) {
          return errorResponse('Company not found', 'No company found for this tenant', 404);
        }

        // Check if user has permission to update this company
        // SuperAdmin can update any company, Admin can only update their own company
        const userRole = authResult.payload.role;
        if (userRole !== 'SuperAdmin') {
          // For non-SuperAdmin, ensure they can only update their own company
          // CompanyId check removed - TenantContext doesn't have companyId
          // TODO: Implement proper company ownership check
          // return errorResponse('Forbidden', 'You can only update your own company', 403);
        }

        // Update company
        const updatedCompany = await tenantPrisma.company.update({
          where: { id: companyId },
          data: {
            name: body.name,
            industry: body.industry,
            website: body.website,
            status: body.status,
            logo: body.logo,
            logoFile: body.logoFile,
            address: body.address,
            city: body.city,
            state: body.state,
            postalCode: body.postalCode,
            country: body.country,
            phone: body.phone,
            email: body.email,
            taxNumber: body.taxNumber,
            taxOffice: body.taxOffice,
            registrationNumber: body.registrationNumber,
            mersisNumber: body.mersisNumber,
            iban: body.iban,
            bankName: body.bankName,
            accountHolder: body.accountHolder,
            description: body.description,
            foundedYear: body.foundedYear,
            employeeCount: body.employeeCount,
            capital: body.capital,
          },
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
          id: updatedCompany.id,
          name: updatedCompany.name,
          industry: updatedCompany.industry,
          website: updatedCompany.website,
          status: updatedCompany.status,
          logo: updatedCompany.logo,
          logoFile: updatedCompany.logoFile,
          address: updatedCompany.address,
          city: updatedCompany.city,
          state: updatedCompany.state,
          postalCode: updatedCompany.postalCode,
          country: updatedCompany.country,
          phone: updatedCompany.phone,
          email: updatedCompany.email,
          taxNumber: updatedCompany.taxNumber,
          taxOffice: updatedCompany.taxOffice,
          registrationNumber: updatedCompany.registrationNumber,
          mersisNumber: updatedCompany.mersisNumber,
          iban: updatedCompany.iban,
          bankName: updatedCompany.bankName,
          accountHolder: updatedCompany.accountHolder,
          description: updatedCompany.description,
          foundedYear: updatedCompany.foundedYear,
          employeeCount: updatedCompany.employeeCount,
          capital: updatedCompany.capital,
          createdAt: updatedCompany.createdAt.toISOString(),
          updatedAt: updatedCompany.updatedAt.toISOString(),
          stats: {
            usersCount: updatedCompany._count.users,
            assetsCount: updatedCompany._count.assets,
            contentsCount: updatedCompany._count.contents,
            websitesCount: updatedCompany._count.websites,
          },
        });
      } catch (error: any) {
        return errorResponse('Failed to update company', error.message || 'An error occurred', 500);
      }
    },
    { required: true }
  );
}

