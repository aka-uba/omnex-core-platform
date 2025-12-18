import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { getTenantFromRequest } from '@/lib/api/tenantContext';

// GET /api/web-builder/websites - List websites
export async function GET(request: NextRequest) {
    return withTenant<ApiResponse<{ websites: unknown[]; total: number }>>(
        request,
        async (tenantPrisma) => {
            const searchParams = request.nextUrl.searchParams;
            const page = parseInt(searchParams.get('page') || '1', 10) || 1;
            const pageSize = parseInt(searchParams.get('pageSize') || '10', 10) || 10;
            const status = searchParams.get('status');

            const where: { status?: string } = {};
            if (status) {
                where.status = status;
            }

            const [websites, total] = await Promise.all([
                tenantPrisma.website.findMany({
                    where,
                    skip: (page - 1) * pageSize,
                    take: pageSize,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        company: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                        _count: {
                            select: {
                                pages: true,
                            },
                        },
                    },
                }),
                tenantPrisma.website.count({ where }),
            ]);

            return successResponse({
                websites: websites.map(site => ({
                    ...site,
                    createdAt: site.createdAt.toISOString(),
                    updatedAt: site.updatedAt.toISOString(),
                })),
                total,
            });
        },
        { required: true, module: 'web-builder' }
    );
}

// POST /api/web-builder/websites - Create website
export async function POST(request: NextRequest) {
    return withTenant<ApiResponse<{ website: unknown }>>(
        request,
        async (tenantPrisma) => {
            const body = await request.json();
            const { name, domain, companyId, status = 'draft' } = body;

            if (!name || !companyId) {
                return errorResponse('Validation error', 'Name and companyId are required', 400);
            }

            // Get tenantId
            const tenantContext = await getTenantFromRequest(request);
            if (!tenantContext) {
                return errorResponse('Tenant context required', 'Tenant context is required', 400);
            }

            // Check if domain is already taken
            if (domain) {
                const existing = await tenantPrisma.website.findUnique({
                    where: { domain },
                });
                if (existing) {
                    return errorResponse('Conflict', 'Domain is already in use', 409);
                }
            }

            const websiteData: any = {
                tenantId: tenantContext.id,
                name,
                companyId,
                status,
            };

            if (domain !== undefined && domain !== null) {
                websiteData.domain = domain;
            }

            const website = await tenantPrisma.website.create({
                data: websiteData,
                include: {
                    company: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            });

            return successResponse({
                website: {
                    ...website,
                    createdAt: website.createdAt.toISOString(),
                    updatedAt: website.updatedAt.toISOString(),
                },
            });
        },
        { required: true, module: 'web-builder' }
    );
}
