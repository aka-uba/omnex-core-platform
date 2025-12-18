import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { contractTemplateCreateSchema } from '@/modules/real-estate/schemas/contract-template.schema';
import { getTenantFromRequest } from '@/lib/api/tenantContext';

// GET /api/real-estate/contract-templates - List contract templates
export async function GET(request: NextRequest) {
  return withTenant<ApiResponse<{ templates: unknown[]; total: number; page: number; pageSize: number }>>(
    request,
    async (tenantPrisma) => {
      const searchParams = request.nextUrl.searchParams;
      
      // Parse query parameters
      const page = parseInt(searchParams.get('page') || '1', 10) || 1;
      const pageSize = parseInt(searchParams.get('pageSize') || '10', 10) || 10;
      const search = searchParams.get('search') || undefined;
      const type = searchParams.get('type') || undefined;
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
      const where: any = {
        tenantId: tenantContext.id,
        ...(finalCompanyId && { companyId: finalCompanyId }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(type && { type }),
        ...(category && { category }),
        ...(isActive !== undefined && { isActive }),
      };

      // Get total count
      const total = await tenantPrisma.contractTemplate.count({ where });

      // Get paginated templates
      const templates = await tenantPrisma.contractTemplate.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              contracts: true,
            },
          },
        },
      });

      return successResponse({
        templates: templates.map((template: any) => ({
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

// POST /api/real-estate/contract-templates - Create contract template
export async function POST(request: NextRequest) {
  return withTenant<ApiResponse<{ template: unknown }>>(
    request,
    async (tenantPrisma) => {
      const body = await request.json();

      // Validate request body
      const validationResult = contractTemplateCreateSchema.safeParse(body);
      if (!validationResult.success) {
        return errorResponse(
          'Validation error',
          validationResult.error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', '),
          400
        );
      }

      const data = validationResult.data;

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Get companyId from body or use first company
      let companyId = body.companyId;
      if (!companyId) {
        const firstCompany = await tenantPrisma.company.findFirst({
          select: { id: true },
          orderBy: { createdAt: 'asc' },
        });
        if (!firstCompany) {
          return errorResponse('Company required', 'No company found for this tenant', 400);
        }
        companyId = firstCompany.id;
      }

      // Check if default template exists and unset others if this is default
      if (data.isDefault) {
        await tenantPrisma.contractTemplate.updateMany({
          where: {
            tenantId: tenantContext.id,
            companyId,
            isDefault: true,
          },
          data: {
            isDefault: false,
          },
        });
      }

      // Create template
      const template = await tenantPrisma.contractTemplate.create({
        data: {
          tenantId: tenantContext.id,
          companyId,
          name: data.name,
          description: data.description || null,
          type: data.type,
          category: data.category || null,
          content: data.content,
          variables: data.variables ? (data.variables as any) : null,
          isDefault: data.isDefault || false,
          isActive: true,
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

