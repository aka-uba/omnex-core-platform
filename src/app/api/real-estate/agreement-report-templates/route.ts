import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { agreementReportTemplateCreateSchema } from '@/modules/real-estate/schemas/agreement-report-template.schema';
import { Prisma } from '@prisma/tenant-client';
import { z } from 'zod';

// GET /api/real-estate/agreement-report-templates - List templates
export async function GET(request: NextRequest) {
  return withTenant<ApiResponse<{ templates: unknown[]; total: number; page: number; pageSize: number }>>(
    request,
    async (tenantPrisma) => {
      const searchParams = request.nextUrl.searchParams;
      
      // Parse query parameters
      const page = parseInt(searchParams.get('page') || '1', 10) || 1;
      const pageSize = parseInt(searchParams.get('pageSize') || '10', 10) || 10;
      const search = searchParams.get('search') || undefined;
      const category = searchParams.get('category') || undefined;
      const isActive = searchParams.get('isActive') === 'true' ? true : searchParams.get('isActive') === 'false' ? false : undefined;
      const companyId = searchParams.get('companyId') || undefined;

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Get companyId from query or use first company
      let finalCompanyId = companyId;
      if (!finalCompanyId) {
        const firstCompany = await tenantPrisma.company.findFirst({
          select: { id: true },
          orderBy: { createdAt: 'asc' },
        });
        finalCompanyId = firstCompany?.id;
      }

      // Build where clause
      // Build where clause with tenant and company isolation (defense-in-depth)
      const where: Prisma.AgreementReportTemplateWhereInput = {
        tenantId: tenantContext.id,
        ...(finalCompanyId && { companyId: finalCompanyId }),
        ...(category && { category }),
        ...(isActive !== undefined && { isActive }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }),
      };

      // Get total count
      const total = await tenantPrisma.agreementReportTemplate.count({ where });

      // Get templates
      const templates = await tenantPrisma.agreementReportTemplate.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      });

      return successResponse({
        templates,
        total,
        page,
        pageSize,
      });
    }
  );
}

// POST /api/real-estate/agreement-report-templates - Create template
export async function POST(request: NextRequest) {
  return withTenant<ApiResponse<{ template: unknown }>>(
    request,
    async (tenantPrisma) => {
      try {
        const body = await request.json();

        // Validate input
        const validatedData = agreementReportTemplateCreateSchema.parse(body);

        // Get tenant context
        const tenantContext = await getTenantFromRequest(request);
        if (!tenantContext) {
          return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
        }

        // Get companyId from query or use first company
        const searchParams = request.nextUrl.searchParams;
        let companyId = searchParams.get('companyId') || undefined;
        if (!companyId) {
          const firstCompany = await tenantPrisma.company.findFirst({
            select: { id: true },
            orderBy: { createdAt: 'asc' },
          });
          companyId = firstCompany?.id;
        }

        // If this is set as default, unset other defaults
        if (validatedData.isDefault) {
          await tenantPrisma.agreementReportTemplate.updateMany({
            where: {
              tenantId: tenantContext.id,
              ...(companyId && { companyId }),
              isDefault: true,
            },
            data: { isDefault: false },
          });
        }

        // Create template
        const template = await tenantPrisma.agreementReportTemplate.create({
          data: {
            tenantId: tenantContext.id,
            companyId: companyId || null,
            name: validatedData.name,
            category: validatedData.category,
            description: validatedData.description || null,
            content: validatedData.htmlContent || validatedData.textContent || '',
            variables: validatedData.variables ? (validatedData.variables as any) : null,
            isDefault: validatedData.isDefault || false,
            isActive: validatedData.isActive !== undefined ? validatedData.isActive : true,
          },
        });

        return successResponse({ template });
      } catch (error) {
        if (error instanceof z.ZodError) {
          const firstError = error.issues[0];
          return errorResponse('Validation error', firstError?.message || 'Invalid input', 400);
        }
        console.error('Error creating agreement report template:', error);
        return errorResponse(
          'Failed to create agreement report template',
          error instanceof Error ? error.message : 'Unknown error',
          500
        );
      }
    }
  );
}








