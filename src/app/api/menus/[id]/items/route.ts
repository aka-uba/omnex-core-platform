import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/jwt';
import { requireTenantPrisma } from '@/lib/api/tenantContext';
import { getCompanyIdFromBody } from '@/lib/api/companyContext';

/**
 * GET /api/menus/[id]/items
 * Get all items for a specific menu
 */
export async function GET(
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

        const { id: menuId } = await params;

        // Fetch menu items with hierarchy
        const items = await prisma.menuItem.findMany({
            where: { menuId },
            include: {
                children: {
                    include: {
                        children: true, // Support 3 levels deep
                    },
                },
            },
            orderBy: { order: 'asc' },
        });

        // Filter to get only root items (no parent)
        const rootItems = items.filter(item => !item.parentId);

        return NextResponse.json({
            success: true,
            data: rootItems,
        });
    } catch (error) {
        console.error('Error fetching menu items:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch menu items',
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
 * POST /api/menus/[id]/items
 * Add a new item to a menu
 */
export async function POST(
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

        const { id: menuId } = await params;

        // Read body first (before any other operations that might consume it)
        const body = await request.json();
        const {
            label,
            href,
            icon,
            target,
            cssClass,
            description,
            order = 0,
            visible = true,
            moduleSlug,
            menuGroup,
            parentId,
            requiredRole,
            requiredPermission,
        } = body;

        if (!authResult.payload) {
            return NextResponse.json(
                { success: false, error: 'Invalid authentication payload' },
                { status: 401 }
            );
        }

        const tenantId = authResult.payload.tenantId;

        if (!tenantId) {
            return NextResponse.json(
                { success: false, error: 'Tenant ID is required' },
                { status: 400 }
            );
        }

        // Get companyId from body or fallback to first company
        const companyId = await getCompanyIdFromBody(body, prisma);

        if (!companyId) {
            return NextResponse.json(
                { success: false, error: 'Company ID is required' },
                { status: 400 }
            );
        }

        // Validate required fields
        // Label can be string or Json object { tr: "...", en: "..." }
        if (!label || !href) {
            return NextResponse.json(
                { success: false, error: 'Label and href are required' },
                { status: 400 }
            );
        }

        // Normalize label: if string, convert to Json object
        let normalizedLabel: any = label;
        if (typeof label === 'string') {
            normalizedLabel = { tr: label, en: label };
        }

        // Normalize description: if string, convert to Json object
        let normalizedDescription: any = description;
        if (description && typeof description === 'string') {
            normalizedDescription = { tr: description, en: description };
        }

        // Verify menu exists (use findFirst as fallback if findUnique fails)
        let menu;
        try {
            menu = await prisma.menu.findUnique({
                where: { id: menuId },
            });
        } catch {
            // Fallback to findFirst if findUnique fails (Prisma Client might be outdated)
            menu = await prisma.menu.findFirst({
                where: { id: menuId },
            });
        }

        if (!menu) {
            return NextResponse.json(
                { success: false, error: 'Menu not found' },
                { status: 404 }
            );
        }

        // Create menu item - use menuId directly instead of connect
        const item = await prisma.menuItem.create({
            data: {
                menuId,
                tenantId,
                companyId,
                parentId: parentId || null, // Explicitly set to null if not provided
                label: normalizedLabel,
                href,
                icon: icon || null,
                target: target || null,
                cssClass: cssClass || null,
                description: normalizedDescription || null,
                order,
                visible,
                moduleSlug: moduleSlug || null,
                menuGroup: menuGroup || null,
                requiredRole: requiredRole || null,
                requiredPermission: requiredPermission || null,
            },
            include: {
                children: true, // Include children to verify structure
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Menu item created successfully',
            data: item,
        });
    } catch (error) {
        console.error('Error creating menu item:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create menu item',
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
 * PUT /api/menus/[id]/items/[itemId]
 * Update a menu item
 */
export async function PUT(
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

        const body = await request.json();
        const { itemId, ...updates } = body;

        if (!itemId) {
            return NextResponse.json(
                { success: false, error: 'Item ID is required' },
                { status: 400 }
            );
        }

        // Update menu item
        const item = await prisma.menuItem.update({
            where: { id: itemId },
            data: updates,
        });

        return NextResponse.json({
            success: true,
            message: 'Menu item updated successfully',
            data: item,
        });
    } catch (error) {
        console.error('Error updating menu item:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to update menu item',
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
 * DELETE /api/menus/[id]/items
 * Delete a menu item
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
        const itemId = searchParams.get('itemId');

        if (!itemId) {
            return NextResponse.json(
                { success: false, error: 'Item ID is required' },
                { status: 400 }
            );
        }

        // Delete menu item (cascade will delete children)
        await prisma.menuItem.delete({
            where: { id: itemId },
        });

        return NextResponse.json({
            success: true,
            message: 'Menu item deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting menu item:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to delete menu item',
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
