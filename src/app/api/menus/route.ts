import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/jwt';
import { requireTenantPrisma } from '@/lib/api/tenantContext';
import { getCompanyIdFromRequest, getCompanyIdFromBody } from '@/lib/api/companyContext';

/**
 * GET /api/menus
 * List all menus for the current tenant
 * Query params: locale (optional)
 */
export async function GET(request: NextRequest) {
    let prisma;
    try {
        // Verify authentication
        const authResult = await verifyAuth(request);
        if (!authResult.valid || !authResult.payload) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get tenant Prisma client
        try {
            prisma = await requireTenantPrisma(request);
        } catch (tenantError: any) {
            console.error('Tenant context error:', tenantError);
            return NextResponse.json(
                {
                    success: false,
                    error: tenantError.message || 'Tenant context is required',
                    message: 'Tenant not found. Please run core seed to create tenant record in core database.',
                    details: process.env.NODE_ENV === 'development'
                        ? tenantError.stack
                        : undefined,
                },
                { status: 400 }
            );
        }

        const { searchParams } = new URL(request.url);
        const locale = searchParams.get('locale');
        const tenantId = authResult.payload.tenantId;
        const userRole = authResult.payload.role || '';
        const userId = authResult.payload.userId;
        const isSuperAdmin = userRole.toLowerCase() === 'superadmin' || userRole === 'SuperAdmin';
        const isTenantAdmin = userRole.toLowerCase() === 'admin' || userRole === 'Admin' || isSuperAdmin;

        // Get companyId - required for Menu model (from query params or first company)
        let companyId: string | null;
        try {
            companyId = await getCompanyIdFromRequest(request, prisma);
        } catch (companyError: any) {
            console.error('Company ID error:', companyError);
            return NextResponse.json(
                {
                    success: false,
                    error: companyError.message || 'Company ID is required',
                },
                { status: 400 }
            );
        }

        if (!companyId) {
            return NextResponse.json(
                { success: false, error: 'Company ID is required' },
                { status: 400 }
            );
        }

        // Fetch menus for this tenant
        const menus = await prisma.menu.findMany({
            where: {
                OR: [
                    ...(tenantId ? [{ tenantId }] : []),
                    { tenantId: null }, // Global menus
                ],
                isActive: true,
            },
            include: {
                items: {
                    where: { visible: true },
                    include: {
                        children: {
                            where: { visible: true },
                            include: {
                                children: {
                                    where: { visible: true },
                                },
                            },
                            orderBy: { order: 'asc' },
                        },
                    },
                    orderBy: { order: 'asc' },
                },
                assignments: {
                    include: {
                        location: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        // If no menus exist and user is admin, create default admin menu
        if (menus.length === 0 && (isSuperAdmin || isTenantAdmin)) {
            const defaultMenuName = isSuperAdmin ? 'Süper Admin' : 'Admin';
            const defaultMenuSlug = isSuperAdmin ? 'super-admin-default' : 'admin-default';

            // Check if default menu already exists
            const existingDefault = await prisma.menu.findFirst({
                where: {
                    slug: defaultMenuSlug,
                    ...(tenantId ? { tenantId } : {}),
                    ...(locale ? { locale } : {}),
                },
            });

            if (!existingDefault) {
                // Create default menu
                const defaultMenu = await prisma.menu.create({
                    data: {
                        name: defaultMenuName,
                        slug: defaultMenuSlug,
                        description: `${defaultMenuName} varsayılan menüsü`,
                        ...(locale ? { locale } : {}),
                        ...(tenantId ? { tenantId } : {}),
                        companyId: companyId,
                        createdBy: userId,
                        isActive: true,
                    },
                });

                // Create menu items
                const menuItems: any[] = [];

                if (isSuperAdmin) {
                    menuItems.push(
                        {
                            label: { tr: 'Firmalar', en: 'Companies' },
                            href: '/management/companies',
                            icon: 'Building',
                            order: 1,
                            visible: true,
                            menuGroup: 'Süper Admin',
                        },
                        {
                            label: { tr: 'Firma Oluştur', en: 'Create Company' },
                            href: '/management/companies/create',
                            icon: 'BuildingFactory',
                            order: 2,
                            visible: true,
                            menuGroup: 'Süper Admin',
                        }
                    );
                }

                if (isTenantAdmin) {
                    menuItems.push(
                        {
                            label: { tr: 'Firmam', en: 'My Company' },
                            href: '/settings/company',
                            icon: 'Building',
                            order: 3,
                            visible: true,
                            menuGroup: 'Admin',
                        },
                        {
                            label: { tr: 'Lokasyonlar', en: 'Locations' },
                            href: '/settings/company/locations',
                            icon: 'MapPin',
                            order: 4,
                            visible: true,
                            menuGroup: 'Admin',
                        },
                        {
                            label: { tr: 'Menü Yönetimi', en: 'Menu Management' },
                            href: '/settings/menu-management',
                            icon: 'Menu2',
                            order: 5,
                            visible: true,
                            menuGroup: 'Admin',
                        },
                        {
                            label: { tr: 'Genel Ayarlar', en: 'General Settings' },
                            href: '/settings/general',
                            icon: 'Settings',
                            order: 6,
                            visible: true,
                            menuGroup: 'Admin',
                        },
                        {
                            label: { tr: 'Bildirim Ayarları', en: 'Notification Settings' },
                            href: '/settings/notifications',
                            icon: 'Bell',
                            order: 7,
                            visible: true,
                            menuGroup: 'Admin',
                        },
                        {
                            label: { tr: 'Güvenlik', en: 'Security' },
                            href: '/settings/security',
                            icon: 'Shield',
                            order: 8,
                            visible: true,
                            menuGroup: 'Admin',
                        },
                        {
                            label: { tr: 'Entegrasyonlar', en: 'Integrations' },
                            href: '/settings/integrations',
                            icon: 'Plug',
                            order: 9,
                            visible: true,
                            menuGroup: 'Admin',
                        },
                        {
                            label: { tr: 'Export Şablonları', en: 'Export Templates' },
                            href: '/settings/export-templates',
                            icon: 'FileExport',
                            order: 10,
                            visible: true,
                            menuGroup: 'Admin',
                        }
                    );
                }

                // Create menu items
                if (!tenantId || !companyId) {
                    return NextResponse.json(
                        { success: false, error: 'Tenant ID and Company ID are required' },
                        { status: 400 }
                    );
                }
                
                for (const itemData of menuItems) {
                    await prisma.menuItem.create({
                        data: {
                            menuId: defaultMenu.id,
                            tenantId: tenantId,
                            companyId: companyId,
                            label: itemData.label,
                            href: itemData.href,
                            icon: itemData.icon,
                            order: itemData.order,
                            visible: itemData.visible,
                            menuGroup: itemData.menuGroup,
                        },
                    });
                }

                // Fetch the created menu with items
                const createdMenu = await prisma.menu.findUnique({
                    where: { id: defaultMenu.id },
                    include: {
                        items: {
                            where: { visible: true },
                            include: {
                                children: {
                                    where: { visible: true },
                                    include: {
                                        children: {
                                            where: { visible: true },
                                        },
                                    },
                                    orderBy: { order: 'asc' },
                                },
                            },
                            orderBy: { order: 'asc' },
                        },
                        assignments: {
                            include: {
                                location: true,
                            },
                        },
                    },
                });

                if (createdMenu) {
                    menus.push(createdMenu);
                }
            }
        }

        return NextResponse.json({
            success: true,
            data: menus,
            locale,
        });
    } catch (error) {
        console.error('Error fetching menus:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch menus',
            },
            { status: 500 }
        );
    } finally {
        if (prisma) {
            try {
                await prisma.$disconnect();
            } catch (disconnectError) {
                // Ignore disconnect errors
            }
        }
    }
}

/**
 * POST /api/menus
 * Create a new menu
 */
export async function POST(request: NextRequest) {
    let prisma;
    try {
        // Verify authentication
        const authResult = await verifyAuth(request);
        if (!authResult.valid || !authResult.payload) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get tenant Prisma client
        prisma = await requireTenantPrisma(request);

        const body = await request.json();
        const { name, slug, description, locale = 'tr' } = body;
        const tenantId = authResult.payload.tenantId;
        const userId = authResult.payload.userId;

        // Get companyId from body or fallback to first company
        const companyId = await getCompanyIdFromBody(body, prisma);

        if (!companyId) {
            return NextResponse.json(
                { success: false, error: 'Company ID is required' },
                { status: 400 }
            );
        }

        // Validate required fields
        if (!name || !slug) {
            return NextResponse.json(
                { success: false, error: 'Name and slug are required' },
                { status: 400 }
            );
        }

        // Check if slug already exists for this tenant
        const existing = await prisma.menu.findFirst({
            where: {
                slug,
                ...(tenantId ? { tenantId } : {}),
                locale,
            },
        });

        if (existing) {
            return NextResponse.json(
                { success: false, error: 'A menu with this slug already exists' },
                { status: 409 }
            );
        }

        // Create menu
        const menu = await prisma.menu.create({
            data: {
                name,
                slug,
                description,
                locale,
                ...(tenantId ? { tenantId } : {}),
                companyId,
                createdBy: userId,
                isActive: true,
            },
            include: {
                items: true,
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Menu created successfully',
            data: menu,
        });
    } catch (error) {
        console.error('Error creating menu:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create menu',
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
 * PUT /api/menus
 * Update an existing menu
 */
export async function PUT(request: NextRequest) {
    let prisma;
    try {
        // Verify authentication
        const authResult = await verifyAuth(request);
        if (!authResult.valid || !authResult.payload) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get tenant Prisma client
        prisma = await requireTenantPrisma(request);

        const body = await request.json();
        const { id, name, slug, description, isActive } = body;

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Menu ID is required' },
                { status: 400 }
            );
        }

        // Update menu
        const menu = await prisma.menu.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(slug && { slug }),
                ...(description !== undefined && { description }),
                ...(isActive !== undefined && { isActive }),
            },
            include: {
                items: true,
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Menu updated successfully',
            data: menu,
        });
    } catch (error) {
        console.error('Error updating menu:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to update menu',
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
 * DELETE /api/menus
 * Delete a menu
 */
export async function DELETE(request: NextRequest) {
    let prisma;
    try {
        // Verify authentication
        const authResult = await verifyAuth(request);
        if (!authResult.valid || !authResult.payload) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get tenant Prisma client
        prisma = await requireTenantPrisma(request);

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Menu ID is required' },
                { status: 400 }
            );
        }

        // Check if menu exists
        const menu = await prisma.menu.findUnique({
            where: { id },
            select: { id: true, name: true },
        });

        if (!menu) {
            return NextResponse.json(
                { success: false, error: 'Menu not found' },
                { status: 404 }
            );
        }

        // Delete menu (cascade will delete items and assignments)
        await prisma.menu.delete({
            where: { id },
        });

        return NextResponse.json({
            success: true,
            message: 'Menu deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting menu:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete menu';
        
        // Check for foreign key constraint errors
        if (errorMessage.includes('Foreign key constraint') || errorMessage.includes('constraint')) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Cannot delete menu. It may be assigned to a location or has dependencies.',
                    message: 'Please remove all menu assignments before deleting the menu.',
                },
                { status: 400 }
            );
        }
        
        return NextResponse.json(
            {
                success: false,
                error: errorMessage,
                details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined,
            },
            { status: 500 }
        );
    } finally {
        if (prisma) {
            await prisma.$disconnect();
        }
    }
}
