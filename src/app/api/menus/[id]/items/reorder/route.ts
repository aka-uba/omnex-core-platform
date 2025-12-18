import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/jwt';
import { requireTenantPrisma } from '@/lib/api/tenantContext';

/**
 * POST /api/menus/[id]/items/reorder
 * Reorder menu items
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    await params; // id removed - unused
    // menuId removed - using id instead
    try {
        const authResult = await verifyAuth(request);
        if (!authResult.valid) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get tenant Prisma client
        const prisma = await requireTenantPrisma(request);

        const body = await request.json();
        const { items } = body; // Array of { id, order, parentId }

        if (!Array.isArray(items)) {
            return NextResponse.json(
                { success: false, error: 'Items array is required' },
                { status: 400 }
            );
        }

        // Update all items in a transaction
        await prisma.$transaction(
            items.map(item =>
                prisma.menuItem.update({
                    where: { id: item.id },
                    data: {
                        order: item.order,
                        ...(item.parentId !== undefined && { parentId: item.parentId }),
                    },
                })
            )
        );

        return NextResponse.json({
            success: true,
            message: 'Menu items reordered successfully',
        });
    } catch (error) {
        console.error('Error reordering menu items:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to reorder menu items',
                details: error instanceof Error ? error.stack : String(error),
            },
            { status: 500 }
        );
    }
}
