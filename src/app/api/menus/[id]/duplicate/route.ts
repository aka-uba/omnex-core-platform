import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/jwt';
import { requireTenantPrisma } from '@/lib/api/tenantContext';
import { getCompanyIdFromRequest } from '@/lib/api/companyContext';
import { Prisma } from '@prisma/tenant-client';

/**
 * POST /api/menus/[id]/duplicate
 * Duplicate a menu with all its items
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await verifyAuth(request);
        if (!authResult.valid || !authResult.payload) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get tenant Prisma client
        const prisma = await requireTenantPrisma(request);

        const { id: menuId } = await params;
        const body = await request.json();
        const { name, slug } = body;

        // Fetch original menu with items
        const originalMenu = await prisma.menu.findUnique({
            where: { id: menuId },
            include: {
                items: {
                    include: {
                        children: {
                            include: {
                                children: true,
                            },
                        },
                    },
                },
            },
        });

        if (!originalMenu) {
            return NextResponse.json(
                { success: false, error: 'Menu not found' },
                { status: 404 }
            );
        }

        const userId = authResult.payload.userId;

        // Get companyId - use original menu's companyId or get from request
        let companyId: string | null = originalMenu.companyId;
        if (!companyId) {
            try {
                companyId = await getCompanyIdFromRequest(request, prisma);
            } catch {
                // If can't get companyId, use original menu's companyId (required field)
                companyId = originalMenu.companyId;
            }
        }

        if (!companyId) {
            return NextResponse.json(
                { success: false, error: 'Company ID is required' },
                { status: 400 }
            );
        }

        // Create new menu
        const menuData: any = {
            name: name || `${originalMenu.name} (Copy)`,
            slug: slug || `${originalMenu.slug}-copy-${Date.now()}`,
            locale: originalMenu.locale,
            companyId: companyId as string, // Type assertion since we checked it's not null above
            createdBy: userId,
            isActive: true,
        };
        
        if (originalMenu.description) menuData.description = originalMenu.description;
        if (originalMenu.tenantId !== null && originalMenu.tenantId !== undefined) {
            menuData.tenantId = originalMenu.tenantId;
        }
        
        const newMenu = await prisma.menu.create({
            data: menuData,
        });

        // Duplicate items recursively
        const duplicateItems = async (items: any[], parentId: string | null = null) => {
            for (const item of items) {
                const newItem = await prisma.menuItem.create({
                    data: {
                        menuId: newMenu.id,
                        parentId,
                        tenantId: originalMenu.tenantId || '',
                        companyId: companyId as string,
                        label: String(item.label || ''),
                        href: String(item.href || '#'),
                        icon: String(item.icon || ''),
                        target: (item.target || '_self') as '_self' | '_blank',
                        cssClass: item.cssClass ? String(item.cssClass) : null,
                        description: item.description ? (typeof item.description === 'string' ? item.description : JSON.stringify(item.description)) : Prisma.JsonNull,
                        order: typeof item.order === 'number' ? item.order : 0,
                        visible: item.visible !== undefined ? Boolean(item.visible) : true,
                        moduleSlug: item.moduleSlug ? String(item.moduleSlug) : null,
                        menuGroup: item.menuGroup ? String(item.menuGroup) : null,
                        requiredRole: item.requiredRole ? String(item.requiredRole) : null,
                        requiredPermission: item.requiredPermission ? String(item.requiredPermission) : null,
                    },
                });

                // Duplicate children
                if (item.children && item.children.length > 0) {
                    await duplicateItems(item.children, newItem.id);
                }
            }
        };

        // Get root items (no parent)
        const rootItems = originalMenu.items.filter(item => !item.parentId);
        await duplicateItems(rootItems);

        // Fetch the complete duplicated menu
        const duplicatedMenu = await prisma.menu.findUnique({
            where: { id: newMenu.id },
            include: {
                items: {
                    include: {
                        children: {
                            include: {
                                children: true,
                            },
                        },
                    },
                },
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Menu duplicated successfully',
            data: duplicatedMenu,
        });
    } catch (error) {
        console.error('Error duplicating menu:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to duplicate menu',
                details: error instanceof Error ? error.stack : String(error),
            },
            { status: 500 }
        );
    }
}
