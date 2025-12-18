import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';

// GET /api/web-builder/websites/[id] - Get single website
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withTenant<ApiResponse<{ website: unknown }>>(
        request,
        async (tenantPrisma) => {
            const { id } = await params;
            const website = await tenantPrisma.website.findUnique({
                where: { id },
                include: {
                    company: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    pages: {
                        orderBy: { order: 'asc' },
                    },
                    theme: true,
                },
            });

            if (!website) {
                return errorResponse('Not Found', 'Website not found', 404);
            }

            return successResponse({
                website: {
                    ...website,
                    createdAt: website.createdAt.toISOString(),
                    updatedAt: website.updatedAt.toISOString(),
                    pages: website.pages.map(page => ({
                        ...page,
                        createdAt: page.createdAt.toISOString(),
                        updatedAt: page.updatedAt.toISOString(),
                    })),
                },
            });
        },
        { required: true, module: 'web-builder' }
    );
}

// PATCH /api/web-builder/websites/[id] - Update website
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withTenant<ApiResponse<{ website: unknown }>>(
        request,
        async (tenantPrisma) => {
            const { id } = await params;
            const body = await request.json();
            const { name, domain, status, settings, favicon, themeId } = body;

            // Check if website exists
            const existing = await tenantPrisma.website.findUnique({
                where: { id },
            });

            if (!existing) {
                return errorResponse('Not Found', 'Website not found', 404);
            }

            // Check domain uniqueness if changing
            if (domain && domain !== existing.domain) {
                const domainTaken = await tenantPrisma.website.findUnique({
                    where: { domain },
                });
                if (domainTaken) {
                    return errorResponse('Conflict', 'Domain is already in use', 409);
                }
            }

            const website = await tenantPrisma.website.update({
                where: { id },
                data: {
                    ...(name && { name }),
                    ...(domain !== undefined && { domain }),
                    ...(status && { status }),
                    ...(settings && { settings }),
                    ...(favicon !== undefined && { favicon }),
                    ...(themeId !== undefined && { themeId }),
                },
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

// DELETE /api/web-builder/websites/[id] - Delete website
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withTenant<ApiResponse<{ success: boolean }>>(
        request,
        async (tenantPrisma) => {
            const { id } = await params;
            const website = await tenantPrisma.website.findUnique({
                where: { id },
            });

            if (!website) {
                return errorResponse('Not Found', 'Website not found', 404);
            }

            await tenantPrisma.website.delete({
                where: { id },
            });

            return successResponse({ success: true });
        },
        { required: true, module: 'web-builder' }
    );
}
