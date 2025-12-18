import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/jwt';
import { requireTenantPrisma } from '@/lib/api/tenantContext';
import { getCompanyIdFromRequest, getCompanyIdFromBody } from '@/lib/api/companyContext';
/**
 * GET /api/menu-locations
 * Get all menu locations
 */
export async function GET(request: NextRequest) {
    let prisma;
    try {
        const authResult = await verifyAuth(request);
        if (!authResult.valid || !authResult.payload) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        prisma = await requireTenantPrisma(request);
        const tenantId = authResult.payload.tenantId;

        // Get companyId for filtering (from query params or first company)
        let companyId: string | undefined;
        try {
            const { requireCompanyId } = await import('@/lib/api/companyContext');
            companyId = await requireCompanyId(request, prisma);
        } catch (companyError) {
            // If companyId is not available, try to get from request
            try {
                companyId = await getCompanyIdFromRequest(request, prisma) || undefined;
            } catch (error) {
                // If still not available, continue without it (for global locations)
            }
        }

        // Fetch locations for this tenant and global locations
        const whereClause: any = {
            isActive: true,
        };

        // Build OR clause for tenantId
        if (tenantId) {
            if (companyId) {
                whereClause.OR = [
                    { tenantId: tenantId, companyId: companyId },
                    { tenantId: null }, // Global locations (no companyId filter)
                ];
            } else {
                whereClause.OR = [
                    { tenantId: tenantId },
                    { tenantId: null }, // Global locations
                ];
            }
        } else {
            // No tenantId, only search global locations
            whereClause.tenantId = null;
        }

        // Build assignments where clause
        // Filter by companyId if available, but don't exclude if companyId doesn't match
        // This ensures we see all assignments for the location
        const assignmentsWhere: any = {
            isActive: true,
        };
        // Note: We don't filter by companyId here to show all assignments
        // The location itself is already filtered by companyId

        let locations = await prisma.menuLocation.findMany({
            where: whereClause,
            include: {
                assignments: {
                    where: assignmentsWhere,
                    include: {
                        menu: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                            },
                        },
                    },
                    orderBy: {
                        priority: 'desc',
                    },
                },
            },
            orderBy: { name: 'asc' },
        });

        // Ensure we have companyId before creating locations
        if (tenantId && !companyId) {
            try {
                const { requireCompanyId } = await import('@/lib/api/companyContext');
                companyId = await requireCompanyId(request, prisma);
            } catch (companyError) {
                // If companyId is still not available, continue without creating locations
            }
        }

        // Define default locations
        const defaultLocations = [
            {
                name: 'sidebar',
                label: { tr: 'Kenar Menü', en: 'Sidebar Menu', de: 'Seitenmenü', ar: 'القائمة الجانبية' },
                description: 'Main sidebar navigation menu',
                layoutType: 'sidebar',
                maxDepth: 3,
            },
            {
                name: 'top',
                label: { tr: 'Üst Menü', en: 'Top Menu', de: 'Oberes Menü', ar: 'القائمة العلوية' },
                description: 'Top horizontal navigation menu',
                layoutType: 'top',
                maxDepth: 2,
            },
            {
                name: 'mobile',
                label: { tr: 'Mobil Menü', en: 'Mobile Menu', de: 'Mobile Menü', ar: 'قائمة الجوال' },
                description: 'Mobile navigation menu',
                layoutType: 'both',
                maxDepth: 2,
            },
            {
                name: 'footer',
                label: { tr: 'Footer Menü', en: 'Footer Menu', de: 'Fußzeile Menü', ar: 'قائمة التذييل' },
                description: 'Footer primary menu',
                layoutType: 'both',
                maxDepth: 1,
            },
        ];

        // Check which default locations are missing and create them
        if (tenantId && companyId) {
            const existingLocationNames = new Set(locations.map(loc => loc.name));
            
            for (const locData of defaultLocations) {
                // Only create if location doesn't exist
                if (!existingLocationNames.has(locData.name)) {
                    try {
                        const location = await prisma.menuLocation.create({
                            data: {
                                name: locData.name,
                                label: locData.label,
                                description: locData.description,
                                layoutType: locData.layoutType,
                                maxDepth: locData.maxDepth,
                                tenantId: tenantId,
                                companyId: companyId,
                                isActive: true,
                            },
                        });
                        // Add to locations array
                        locations.push({
                            ...location,
                            assignments: [],
                        });
                    } catch (createError: any) {
                        // If location already exists (race condition), skip
                        if (!createError.message.includes('Unique constraint') && !createError.message.includes('duplicate')) {
                            console.error(`Error creating location ${locData.name}:`, createError);
                        }
                    }
                }
            }

            // Fetch all locations again (including newly created ones) with proper includes
            locations = await prisma.menuLocation.findMany({
                where: whereClause,
                include: {
                    assignments: {
                        where: assignmentsWhere,
                        include: {
                            menu: {
                                select: {
                                    id: true,
                                    name: true,
                                    slug: true,
                                },
                            },
                        },
                        orderBy: {
                            priority: 'desc',
                        },
                    },
                },
                orderBy: { name: 'asc' },
            });
        }

        return NextResponse.json({
            success: true,
            data: locations,
        });
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch menu locations',
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
 * POST /api/menu-locations
 * Create a new menu location
 */
export async function POST(request: NextRequest) {
    let prisma;
    try {
        const authResult = await verifyAuth(request);
        if (!authResult.valid || !authResult.payload) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        prisma = await requireTenantPrisma(request);

        // Read body first (before any other operations that might consume it)
        const body = await request.json();
        const { name, label, description, layoutType, maxDepth = 3 } = body;

        if (!authResult.payload.tenantId) {
            return NextResponse.json(
                { success: false, error: 'Tenant ID is required' },
                { status: 400 }
            );
        }

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
        if (!name || !label || !layoutType) {
            return NextResponse.json(
                { success: false, error: 'Name, label, and layoutType are required' },
                { status: 400 }
            );
        }

        // Check if location already exists
        // Note: Schema has @@unique([name, tenantId]), so companyId is not part of unique constraint
        // But we still filter by companyId for tenant-specific locations
        const existing = await prisma.menuLocation.findFirst({
            where: {
                name,
                tenantId,
            },
        });

        if (existing) {
            return NextResponse.json(
                { success: false, error: 'A location with this name already exists' },
                { status: 409 }
            );
        }

        // Create location
        const location = await prisma.menuLocation.create({
            data: {
                name,
                label,
                description,
                layoutType,
                maxDepth,
                tenantId,
                companyId,
                isActive: true,
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Menu location created successfully',
            data: location,
        });
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create menu location',
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
