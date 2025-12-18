import { NextRequest, NextResponse } from 'next/server';
import { getTenantPrismaFromRequest, getTenantFromRequest } from '@/lib/api/tenantContext';
import { requireAuth } from '@/lib/middleware/authMiddleware';
import { requireCompanyId, getCompanyIdFromRequest } from '@/lib/api/companyContext';
/**
 * GET /api/access-control
 * List all access control configurations
 * Query params: type, userId, roleId
 */
export async function GET(request: NextRequest) {
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

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const userId = searchParams.get('userId');
        const roleId = searchParams.get('roleId');

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

        // Build where clause with tenant and company isolation
        const where: any = {
            tenantId: tenantContext.id,
            companyId: companyId,
            isActive: true,
        };

        if (type) where.type = type;
        if (userId) where.userId = userId;
        if (roleId) where.roleId = roleId;

        const configurations = await prisma.accessControlConfiguration.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({
            success: true,
            data: configurations,
        });
    } catch (error: any) {
        console.error('[GET /api/access-control] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to fetch configurations' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/access-control
 * Create a new access control configuration
 */
export async function POST(request: NextRequest) {
    try {
        const authResult = await requireAuth(request);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        // Only SuperAdmin and Admin can create
        const userRole = authResult.role;
        if (!['SuperAdmin', 'Admin'].includes(userRole)) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { type, userId, roleId, config } = body;

        // Validation
        if (!type || !['module', 'menu', 'ui', 'layout'].includes(type)) {
            return NextResponse.json(
                { success: false, error: 'Invalid type. Must be: module, menu, ui, or layout' },
                { status: 400 }
            );
        }

        if (!config || typeof config !== 'object') {
            return NextResponse.json(
                { success: false, error: 'Config must be a valid JSON object' },
                { status: 400 }
            );
        }

        const prisma = await getTenantPrismaFromRequest(request);
        if (!prisma) {
            return NextResponse.json({ success: false, error: 'Tenant context not found' }, { status: 400 });
        }

        // Get tenantId from tenant context (not slug)
        const tenantContext = await getTenantFromRequest(request);
        if (!tenantContext) {
            return NextResponse.json({ success: false, error: 'Tenant context is required' }, { status: 400 });
        }

        const tenantId = tenantContext.id;
        const currentUserId = authResult.userId;
        const companyId = await requireCompanyId(request, prisma);

        const configuration = await prisma.accessControlConfiguration.create({
            data: {
                tenantId,
                companyId,
                type,
                userId: userId || null,
                roleId: roleId || null,
                config,
                createdBy: currentUserId,
                updatedBy: currentUserId,
            },
        });

        return NextResponse.json({
            success: true,
            data: configuration,
        });
    } catch (error: any) {
        console.error('[POST /api/access-control] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to create configuration' },
            { status: 500 }
        );
    }
}
