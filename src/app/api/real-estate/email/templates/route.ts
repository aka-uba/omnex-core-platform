import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { emailTemplateCreateSchema } from '@/modules/real-estate/schemas/email-template.schema';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { Prisma } from '@prisma/tenant-client';

// GET /api/real-estate/email/templates - List email templates
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
      const where: Prisma.EmailTemplateWhereInput = {
        tenantId: tenantContext.id,
        ...(finalCompanyId && { companyId: finalCompanyId }),
        ...(category && { category }),
        ...(isActive !== undefined && { isActive }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { subject: { contains: search, mode: 'insensitive' } },
          ],
        }),
      };

      // Get total count
      const total = await tenantPrisma.emailTemplate.count({ where });

      // Get paginated templates
      const templates = await tenantPrisma.emailTemplate.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [
          { isDefault: 'desc' },
          { createdAt: 'desc' },
        ],
      });

      return successResponse({
        templates: templates.map(template => ({
          ...template,
          createdAt: template.createdAt.toISOString(),
          updatedAt: template.updatedAt.toISOString(),
          variables: template.variables || null,
        })),
        total,
        page,
        pageSize,
      });
    },
    { required: true, module: 'real-estate' }
  );
}

// POST /api/real-estate/email/templates - Create email template
export async function POST(request: NextRequest) {
  return withTenant<ApiResponse<{ template: unknown }>>(
    request,
    async (tenantPrisma) => {
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      const body = await request.json();
      const validatedData = emailTemplateCreateSchema.parse(body);

      // Get companyId from body or use first company
      let companyId = body.companyId;
      if (!companyId) {
        const firstCompany = await tenantPrisma.company.findFirst({
          select: { id: true },
          orderBy: { createdAt: 'asc' },
        });
        companyId = firstCompany?.id;
      }

      // If this is set as default, unset other defaults
      if (validatedData.isDefault) {
        await tenantPrisma.emailTemplate.updateMany({
          where: {
            tenantId: tenantContext.id,
            ...(companyId && { companyId }),
            isDefault: true,
          },
          data: { isDefault: false },
        });
      }

      // Create template
      const template = await tenantPrisma.emailTemplate.create({
        data: {
          tenantId: tenantContext.id,
          companyId: companyId || null,
          name: validatedData.name,
          category: validatedData.category,
          subject: validatedData.subject,
          htmlContent: validatedData.htmlContent,
          textContent: validatedData.textContent || null,
          variables: validatedData.variables ? validatedData.variables as any : null,
          isDefault: validatedData.isDefault || false,
          isActive: validatedData.isActive !== undefined ? validatedData.isActive : true,
        },
      });

      return successResponse({
        template: {
          ...template,
          createdAt: template.createdAt.toISOString(),
          updatedAt: template.updatedAt.toISOString(),
          variables: template.variables || null,
        },
      });
    },
    { required: true, module: 'real-estate' }
  );
}








