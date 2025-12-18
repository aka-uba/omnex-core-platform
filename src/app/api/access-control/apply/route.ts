import { NextRequest, NextResponse } from 'next/server';
import { getTenantPrismaFromRequest, getTenantFromRequest } from '@/lib/api/tenantContext';
import { getCompanyIdFromRequest } from '@/lib/api/companyContext';
import { requireAuth } from '@/lib/middleware/authMiddleware';
/**
 * POST /api/access-control/apply
 * Apply configuration to current user session
 * This endpoint merges configurations based on priority: user > role > tenant
 */
export async function POST(request: NextRequest) {
    try {
        const authResult = await requireAuth(request);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        const body = await request.json();
        const { type } = body; // 'module' | 'menu' | 'ui' | 'layout'

        if (!type || !['module', 'menu', 'ui', 'layout'].includes(type)) {
            return NextResponse.json(
                { success: false, error: 'Invalid type' },
                { status: 400 }
            );
        }

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

        const userId = authResult.userId;
        const userRole = authResult.role;

        // Fetch configurations in priority order with tenant and company isolation
        const configurations = await prisma.accessControlConfiguration.findMany({
            where: {
                tenantId: tenantContext.id,
                companyId: companyId,
                type,
                isActive: true,
                OR: [
                    { userId, roleId: null }, // User-specific
                    { roleId: userRole, userId: null }, // Role-specific
                    { userId: null, roleId: null }, // Tenant-wide
                ],
            },
            orderBy: [
                { userId: 'desc' }, // User configs first
                { roleId: 'desc' }, // Then role configs
                { createdAt: 'asc' }, // Then tenant configs
            ],
        });

        if (configurations.length === 0) {
            return NextResponse.json({
                success: true,
                data: null,
                message: 'No configuration found',
            });
        }

        // Merge configurations (user > role > tenant)
        let mergedConfig: any = {};

        for (const config of configurations.reverse()) {
            if (config.config && typeof config.config === 'object') {
                mergedConfig = {
                    ...mergedConfig,
                    ...(config.config as Record<string, any>),
                };
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                type,
                config: mergedConfig,
                appliedConfigurations: configurations.map((c) => ({
                    id: c.id,
                    scope: c.userId ? 'user' : c.roleId ? 'role' : 'tenant',
                })),
            },
        });
    } catch (error: any) {
        console.error('[POST /api/access-control/apply] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to apply configuration' },
            { status: 500 }
        );
    }
}
