import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { getCompanyIdFromRequest } from '@/lib/api/companyContext';

// GET /api/web-builder/pages - List pages
export async function GET(request: NextRequest) {
    return withTenant<ApiResponse<{ pages: unknown[]; total: number }>>(
        request,
        async (tenantPrisma) => {
            const searchParams = request.nextUrl.searchParams;
            const websiteId = searchParams.get('websiteId');
            const page = parseInt(searchParams.get('page') || '1', 10) || 1;
            const pageSize = parseInt(searchParams.get('pageSize') || '10', 10) || 10;

            if (!websiteId) {
                return errorResponse('Validation error', 'websiteId is required', 400);
            }

            const where = { websiteId };

            const [pages, total] = await Promise.all([
                tenantPrisma.page.findMany({
                    where,
                    skip: (page - 1) * pageSize,
                    take: pageSize,
                    orderBy: { order: 'asc' },
                    include: {
                        website: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                        _count: {
                            select: {
                                sections: true,
                            },
                        },
                    },
                }),
                tenantPrisma.page.count({ where }),
            ]);

            return successResponse({
                pages: pages.map(p => ({
                    ...p,
                    createdAt: p.createdAt.toISOString(),
                    updatedAt: p.updatedAt.toISOString(),
                })),
                total,
            });
        },
        { required: true, module: 'web-builder' }
    );
}

// POST /api/web-builder/pages - Create page
export async function POST(request: NextRequest) {
    return withTenant<ApiResponse<{ page: unknown }>>(
        request,
        async (tenantPrisma) => {
            const body = await request.json();
            const { websiteId, title, slug, description, status = 'draft', isHome = false } = body;

            if (!websiteId || !title || !slug) {
                return errorResponse('Validation error', 'websiteId, title, and slug are required', 400);
            }

            // Check if slug is unique within website
            const existing = await tenantPrisma.page.findUnique({
                where: {
                    websiteId_slug: {
                        websiteId,
                        slug,
                    },
                },
            });

            if (existing) {
                return errorResponse('Conflict', 'Page with this slug already exists', 409);
            }

            // Get tenantId and companyId
            const tenantContext = await getTenantFromRequest(request);
            if (!tenantContext) {
                return errorResponse('Tenant context required', 'Tenant context is required', 400);
            }

            const companyId = await getCompanyIdFromRequest(request, tenantPrisma);
            if (!companyId) {
                return errorResponse('Company ID required', 'Company ID is required', 400);
            }

            // Get max order
            const maxOrder = await tenantPrisma.page.aggregate({
                where: { websiteId },
                _max: { order: true },
            });

            const pageData: any = {
                tenantId: tenantContext.id,
                companyId,
                websiteId,
                title,
                slug,
                status,
                isHome,
                order: (maxOrder._max.order || 0) + 1,
            };

            if (description !== undefined && description !== null) {
                pageData.description = description;
            }

            const page = await tenantPrisma.page.create({
                data: pageData,
                include: {
                    website: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            });

            return successResponse({
                page: {
                    ...page,
                    createdAt: page.createdAt.toISOString(),
                    updatedAt: page.updatedAt.toISOString(),
                },
            });
        },
        { required: true, module: 'web-builder' }
    );
}
