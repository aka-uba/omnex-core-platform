import { NextRequest, NextResponse } from 'next/server';
import { getTenantPrismaFromRequest, getTenantFromRequest } from '@/lib/api/tenantContext';
import { getCompanyIdFromRequest } from '@/lib/api/companyContext';
import { requireAuth } from '@/lib/middleware/authMiddleware';
/**
 * GET /api/access-control/[id]
 * Get a single access control configuration
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await requireAuth(request);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        // Only SuperAdmin and Admin can access
        const userRole = authResult.role;
        if (!['SuperAdmin', 'Admin'].includes(userRole)) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;
        const prisma = await getTenantPrismaFromRequest(request);
        if (!prisma) {
            return NextResponse.json({ success: false, error: 'Tenant context not found' }, { status: 400 });
        }

        // Get tenantId and companyId for data isolation
        const tenantContext = await getTenantFromRequest(request);
        if (!tenantContext) {
            return NextResponse.json({ success: false, error: 'Tenant context is required' }, { status: 400 });
        }

        const companyId = await getCompanyIdFromRequest(request, prisma);
        if (!companyId) {
            return NextResponse.json({ success: false, error: 'Company ID is required' }, { status: 400 });
        }

        // Get configuration with tenant and company isolation
        const configuration = await prisma.accessControlConfiguration.findFirst({
            where: {
                id,
                tenantId: tenantContext.id,
                companyId: companyId,
            },
        });

        if (!configuration) {
            return NextResponse.json(
                { success: false, error: 'Configuration not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: configuration,
        });
    } catch (error: any) {
        console.error('[GET /api/access-control/[id]] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to fetch configuration' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/access-control/[id]
 * Update an access control configuration
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await requireAuth(request);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        // Only SuperAdmin and Admin can update
        const userRole = authResult.role;
        if (!['SuperAdmin', 'Admin'].includes(userRole)) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;
        const body = await request.json();
        const { type, userId, roleId, config, isActive } = body;

        const prisma = await getTenantPrismaFromRequest(request);
        if (!prisma) {
            return NextResponse.json({ success: false, error: 'Tenant context not found' }, { status: 400 });
        }

        // Get tenantId and companyId for data isolation
        const tenantContext = await getTenantFromRequest(request);
        if (!tenantContext) {
            return NextResponse.json({ success: false, error: 'Tenant context is required' }, { status: 400 });
        }

        const companyId = await getCompanyIdFromRequest(request, prisma);
        if (!companyId) {
            return NextResponse.json({ success: false, error: 'Company ID is required' }, { status: 400 });
        }

        const currentUserId = authResult.userId;

        // Check if configuration exists and belongs to this tenant/company
        const existing = await prisma.accessControlConfiguration.findFirst({
            where: {
                id,
                tenantId: tenantContext.id,
                companyId: companyId,
            },
        });

        if (!existing) {
            return NextResponse.json(
                { success: false, error: 'Configuration not found' },
                { status: 404 }
            );
        }

        // Build update data
        const updateData: any = {
            updatedBy: currentUserId,
        };

        if (type !== undefined) updateData.type = type;
        if (userId !== undefined) updateData.userId = userId;
        if (roleId !== undefined) updateData.roleId = roleId;
        if (config !== undefined) updateData.config = config;
        if (isActive !== undefined) updateData.isActive = isActive;

        const configuration = await prisma.accessControlConfiguration.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json({
            success: true,
            data: configuration,
        });
    } catch (error: any) {
        console.error('[PATCH /api/access-control/[id]] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to update configuration' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/access-control/[id]
 * Delete an access control configuration
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await requireAuth(request);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        // Only SuperAdmin and Admin can delete
        const userRole = authResult.role;
        if (!['SuperAdmin', 'Admin'].includes(userRole)) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;
        const prisma = await getTenantPrismaFromRequest(request);
        if (!prisma) {
            return NextResponse.json({ success: false, error: 'Tenant context not found' }, { status: 400 });
        }

        // Get tenantId and companyId for data isolation
        const tenantContext = await getTenantFromRequest(request);
        if (!tenantContext) {
            return NextResponse.json({ success: false, error: 'Tenant context is required' }, { status: 400 });
        }

        const companyId = await getCompanyIdFromRequest(request, prisma);
        if (!companyId) {
            return NextResponse.json({ success: false, error: 'Company ID is required' }, { status: 400 });
        }

        // Check if configuration exists and belongs to this tenant/company
        const existing = await prisma.accessControlConfiguration.findFirst({
            where: {
                id,
                tenantId: tenantContext.id,
                companyId: companyId,
            },
        });

        if (!existing) {
            return NextResponse.json(
                { success: false, error: 'Configuration not found' },
                { status: 404 }
            );
        }

        await prisma.accessControlConfiguration.delete({
            where: { id },
        });

        return NextResponse.json({
            success: true,
            message: 'Configuration deleted successfully',
        });
    } catch (error: any) {
        console.error('[DELETE /api/access-control/[id]] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to delete configuration' },
            { status: 500 }
        );
    }
}
