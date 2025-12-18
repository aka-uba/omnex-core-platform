import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { getCompanyIdFromRequest } from '@/lib/api/companyContext';

// GET /api/web-builder/pages/[id] - Get single page with sections
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withTenant<ApiResponse<{ page: unknown }>>(
        request,
        async (tenantPrisma) => {
            const { id } = await params;
            const page = await tenantPrisma.page.findUnique({
                where: { id },
                include: {
                    website: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    sections: {
                        orderBy: { order: 'asc' },
                        include: {
                            elements: {
                                orderBy: { order: 'asc' },
                            },
                        },
                    },
                },
            });

            if (!page) {
                return errorResponse('Not Found', 'Page not found', 404);
            }

            return successResponse({
                page: {
                    ...page,
                    createdAt: page.createdAt.toISOString(),
                    updatedAt: page.updatedAt.toISOString(),
                    sections: page.sections.map(section => ({
                        ...section,
                        createdAt: section.createdAt.toISOString(),
                        updatedAt: section.updatedAt.toISOString(),
                        elements: section.elements.map(element => ({
                            ...element,
                            createdAt: element.createdAt.toISOString(),
                            updatedAt: element.updatedAt.toISOString(),
                        })),
                    })),
                },
            });
        },
        { required: true, module: 'web-builder' }
    );
}

// PATCH /api/web-builder/pages/[id] - Update page
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withTenant<ApiResponse<{ page: unknown }>>(
        request,
        async (tenantPrisma) => {
            const { id } = await params;
            const body = await request.json();
            const { title, slug, description, status, isHome, settings, sections } = body;

            const existing = await tenantPrisma.page.findUnique({
                where: { id },
            });

            if (!existing) {
                return errorResponse('Not Found', 'Page not found', 404);
            }

            // Check slug uniqueness if changing
            if (slug && slug !== existing.slug) {
                const slugTaken = await tenantPrisma.page.findUnique({
                    where: {
                        websiteId_slug: {
                            websiteId: existing.websiteId,
                            slug,
                        },
                    },
                });
                if (slugTaken) {
                    return errorResponse('Conflict', 'Page with this slug already exists', 409);
                }
            }

            // Update page
            await tenantPrisma.page.update({
                where: { id },
                data: {
                    ...(title && { title }),
                    ...(slug && { slug }),
                    ...(description !== undefined && { description }),
                    ...(status && { status }),
                    ...(isHome !== undefined && { isHome }),
                    ...(settings && { settings }),
                },
            });

            // Update sections if provided
            if (sections && Array.isArray(sections)) {
                // Get tenantId and companyId
                const tenantContext = await getTenantFromRequest(request);
                if (!tenantContext) {
                    return errorResponse('Tenant context required', 'Tenant context is required', 400);
                }

                const companyId = await getCompanyIdFromRequest(request, tenantPrisma);
                if (!companyId) {
                    return errorResponse('Company ID required', 'Company ID is required', 400);
                }

                // Delete existing sections
                await tenantPrisma.pageSection.deleteMany({
                    where: { pageId: id },
                });

                // Create new sections with elements
                for (const section of sections) {
                    await tenantPrisma.pageSection.create({
                        data: {
                            tenantId: tenantContext.id,
                            companyId,
                            pageId: id,
                            type: section.type,
                            order: section.order,
                            settings: section.settings || {},
                            content: section.content || {},
                            elements: {
                                create: (section.elements || []).map((element: any, index: number) => ({
                                    tenantId: tenantContext.id,
                                    companyId,
                                    type: element.type,
                                    order: element.order || index,
                                    content: element.content || {},
                                    settings: element.settings || {},
                                })),
                            },
                        },
                    });
                }
            }

            // Fetch updated page with sections
            const updatedPage = await tenantPrisma.page.findUnique({
                where: { id },
                include: {
                    sections: {
                        orderBy: { order: 'asc' },
                        include: {
                            elements: {
                                orderBy: { order: 'asc' },
                            },
                        },
                    },
                },
            });

            return successResponse({
                page: {
                    ...updatedPage,
                    createdAt: updatedPage!.createdAt.toISOString(),
                    updatedAt: updatedPage!.updatedAt.toISOString(),
                },
            });
        },
        { required: true, module: 'web-builder' }
    );
}

// DELETE /api/web-builder/pages/[id] - Delete page
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withTenant<ApiResponse<{ success: boolean }>>(
        request,
        async (tenantPrisma) => {
            const { id } = await params;
            const page = await tenantPrisma.page.findUnique({
                where: { id },
            });

            if (!page) {
                return errorResponse('Not Found', 'Page not found', 404);
            }

            await tenantPrisma.page.delete({
                where: { id },
            });

            return successResponse({ success: true });
        },
        { required: true, module: 'web-builder' }
    );
}
