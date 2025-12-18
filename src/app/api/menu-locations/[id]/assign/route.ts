import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/jwt';
import { requireTenantPrisma } from '@/lib/api/tenantContext';
import { getCompanyIdFromBody } from '@/lib/api/companyContext';
/**
 * POST /api/menu-locations/[id]/assign
 * Assign a menu to a location
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    let prisma;
    try {
        const authResult = await verifyAuth(request);
        if (!authResult.valid || !authResult.payload) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get tenant Prisma client
        prisma = await requireTenantPrisma(request);

        const { id: locationId } = await params;

        // Read body first (before any other operations that might consume it)
        const body = await request.json();
        const {
            menuId,
            assignmentType = 'default', // 'default', 'role', 'user', 'branch'
            assignmentId, // roleId, userId, or branchId
            priority = 0,
        } = body;

        const tenantId = authResult.payload.tenantId;

        // Get companyId from body or fallback to first company
        const companyId = await getCompanyIdFromBody(body, prisma);

        if (!companyId) {
            return NextResponse.json(
                { success: false, error: 'Company ID is required' },
                { status: 400 }
            );
        }

        // Validate required fields
        if (!menuId) {
            return NextResponse.json(
                { success: false, error: 'Menu ID is required' },
                { status: 400 }
            );
        }

        // Check if assignment already exists
        // For 'default' type, assignmentId is null
        const existing = await prisma.menuLocationAssignment.findFirst({
            where: {
                locationId,
                assignmentType,
                assignmentId: assignmentType === 'default' ? null : assignmentId,
                ...(tenantId ? { tenantId } : {}),
                companyId,
            },
        });

        if (existing) {
            // Update existing assignment
            const updated = await prisma.menuLocationAssignment.update({
                where: { id: existing.id },
                data: {
                    menuId,
                    priority,
                    isActive: true,
                    companyId, // Ensure companyId is updated
                },
                include: {
                    menu: true,
                    location: true,
                },
            });

            return NextResponse.json({
                success: true,
                message: 'Menu assignment updated successfully',
                data: updated,
            });
        }

        // Create new assignment
        const assignment = await prisma.menuLocationAssignment.create({
            data: {
                locationId,
                menuId,
                ...(tenantId ? { tenantId } : {}),
                companyId,
                assignmentType,
                assignmentId: assignmentType === 'default' ? null : assignmentId,
                priority,
                isActive: true,
            },
            include: {
                menu: true,
                location: true,
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Menu assigned to location successfully',
            data: assignment,
        });
    } catch (error) {
        console.error('Error assigning menu to location:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to assign menu to location',
                details: error instanceof Error ? error.stack : String(error),
            },
            { status: 500 }
        );
    } finally {
        if (prisma) {
            await prisma.$disconnect();
        }
    }
}

/**
 * DELETE /api/menu-locations/[id]/assign
 * Remove a menu assignment from a location
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    let prisma;
    try {
        const authResult = await verifyAuth(request);
        if (!authResult.valid) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get tenant Prisma client
        prisma = await requireTenantPrisma(request);

        const { searchParams } = new URL(request.url);
        const assignmentId = searchParams.get('assignmentId');

        if (!assignmentId) {
            return NextResponse.json(
                { success: false, error: 'Assignment ID is required' },
                { status: 400 }
            );
        }

        // Delete assignment
        await prisma.menuLocationAssignment.delete({
            where: { id: assignmentId },
        });

        return NextResponse.json({
            success: true,
            message: 'Menu assignment removed successfully',
        });
    } catch (error) {
        console.error('Error removing menu assignment:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to remove menu assignment',
                details: error instanceof Error ? error.stack : String(error),
            },
            { status: 500 }
        );
    } finally {
        if (prisma) {
            await prisma.$disconnect();
        }
    }
}
