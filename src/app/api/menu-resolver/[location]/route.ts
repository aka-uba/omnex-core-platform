import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { verifyAuth } from '@/lib/auth/jwt';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { errorResponse, successResponse } from '@/lib/api/errorHandler';
import { ModuleLoader } from '@/lib/modules/loader';

/**
 * GET /api/menu-resolver/[location]
 * Resolve the appropriate menu for a location based on priority system
 * Priority: User > Role > Branch > Default
 * 
 * Query params:
 * - userId: User ID (optional, from auth if not provided)
 * - roleId: Role ID (optional, from auth if not provided)
 * - branchId: Branch ID (optional)
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ location: string }> }
) {
    return withTenant<ApiResponse<any>>(
        request,
        async (tenantPrisma): Promise<NextResponse<ApiResponse<any>>> => {
            try {
                const authResult = await verifyAuth(request);
                if (!authResult.valid || !authResult.payload) {
                    return errorResponse('Unauthorized', 'Unauthorized', 401);
                }

                const { location: locationName } = await params;
                if (!locationName) {
                    return errorResponse('Location parameter is required', 'Location parameter is required', 400);
                }
                const { searchParams } = new URL(request.url);

                const userId = searchParams.get('userId') || authResult.payload.userId;
                const roleName = searchParams.get('roleId') || authResult.payload.role;
                const branchId = searchParams.get('branchId');

                // Get tenantId from auth payload (more reliable than getTenantFromRequest)
                // tenantId can be undefined for global contexts, which is OK
                const tenantId = authResult.payload.tenantId || undefined;

                // Look up the actual role ID from role name
                // The JWT payload contains role name (e.g., "Admin"), but assignments use role ID (UUID)
                let roleId: string | null = null;
                if (roleName) {
                    try {
                        const role = await tenantPrisma.role.findFirst({
                            where: { name: roleName },
                            select: { id: true },
                        });
                        if (role) {
                            roleId = role.id;
                        }
                    } catch (roleError) {
                        // If role lookup fails, continue without roleId
                        console.warn('Failed to lookup role ID from role name:', roleError);
                    }
                }

                // Get companyId for filtering (optional, graceful degradation)
                // companyId currently not used but may be needed for future filtering
                // let companyId: string | undefined;
                // try {
                //     const { requireCompanyId } = await import('@/lib/api/companyContext');
                //     companyId = await requireCompanyId(request, tenantPrisma);
                // } catch (companyError) {
                //     // Continue without companyId if not available
                // }

                // Find the location
                // First try to find with companyId filter, then without
                // This ensures we find the location even if it was created with a different companyId
                const locationWhere: any = {
                    name: locationName,
                    isActive: true,
                };
                
                // Build OR clause for tenantId
                // Don't filter by companyId here - we want to find the location regardless of companyId
                // The location itself might have been created with a different companyId
                if (tenantId) {
                    locationWhere.OR = [
                        { tenantId: tenantId },
                        { tenantId: null }, // Global locations
                    ];
                } else {
                    // No tenantId, only search global locations
                    locationWhere.tenantId = null;
                }
                
                let location = await tenantPrisma.menuLocation.findFirst({
                    where: locationWhere,
                });

        // If location doesn't exist, try to create default locations
        if (!location) {
            // Get companyId for creating location
            let companyId: string | undefined;
            try {
                const { requireCompanyId } = await import('@/lib/api/companyContext');
                companyId = await requireCompanyId(request, tenantPrisma);
            } catch (companyError) {
                // If companyId is not available, return error
                return NextResponse.json(
                    { 
                        success: false, 
                        error: `Location '${locationName}' not found and cannot be auto-created. Company ID is required.`,
                        message: `The menu location '${locationName}' does not exist. Please create it in the Menu Settings page.`
                    },
                    { status: 404 }
                );
            }

            // Default location labels
            const defaultLabels: Record<string, { tr: string; en: string }> = {
                sidebar: { tr: 'Kenar Menü', en: 'Sidebar Menu' },
                top: { tr: 'Üst Menü', en: 'Top Menu' },
                mobile: { tr: 'Mobil Menü', en: 'Mobile Menu' },
                footer: { tr: 'Alt Menü', en: 'Footer Menu' },
            };

            const label = defaultLabels[locationName] || { tr: locationName, en: locationName };
            const layoutType = locationName === 'footer' ? 'both' : locationName === 'top' ? 'top' : 'sidebar';

            // Create the location
            try {
                location = await tenantPrisma.menuLocation.create({
                    data: {
                        name: locationName,
                        label: label,
                        description: `${locationName} location`,
                        layoutType: layoutType,
                        maxDepth: 3,
                        tenantId: tenantId || null,
                        companyId: companyId,
                        isActive: true,
                    },
                });
            } catch (createError: any) {
                // If creation fails (e.g., unique constraint), try to find again
                location = await tenantPrisma.menuLocation.findFirst({
                    where: locationWhere,
                });
                
                if (!location) {
                    return NextResponse.json(
                        { 
                            success: false, 
                            error: `Failed to create location '${locationName}': ${createError.message}`,
                            message: `The menu location '${locationName}' could not be created. Please create it manually in the Menu Settings page.`
                        },
                        { status: 500 }
                    );
                }
            }
        }

                // Find assignments with priority order
                // Priority: user > role > branch > default
                const assignmentWhere: any = {
                    locationId: location.id,
                    isActive: true,
                };

                // Build OR clause for tenantId
                // Don't filter by companyId here - we want to see all assignments for the location
                // The location itself is already filtered by companyId
                if (tenantId) {
                    assignmentWhere.OR = [
                        { tenantId: tenantId },
                        { tenantId: null }, // Global assignments
                    ];
                } else {
                    // No tenantId, only search global assignments
                    assignmentWhere.tenantId = null;
                }

                const assignments = await tenantPrisma.menuLocationAssignment.findMany({
                    where: assignmentWhere,
            include: {
                menu: {
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
                    },
                },
            },
            orderBy: {
                priority: 'desc',
            },
        });

        // Find the best matching assignment based on priority
        let selectedAssignment = null;

        // 1. Check for user-specific assignment
        if (userId) {
            selectedAssignment = assignments.find(
                a => a.assignmentType === 'user' && a.assignmentId === userId
            );
        }

        // 2. Check for role-specific assignment
        if (!selectedAssignment && roleId) {
            selectedAssignment = assignments.find(
                a => a.assignmentType === 'role' && a.assignmentId === roleId
            );
        }

        // 2b. Fallback: Check for role-specific assignment by role name (for backwards compatibility)
        if (!selectedAssignment && roleName) {
            selectedAssignment = assignments.find(
                a => a.assignmentType === 'role' && a.assignmentId === roleName
            );
        }

        // 3. Check for branch-specific assignment
        if (!selectedAssignment && branchId) {
            selectedAssignment = assignments.find(
                a => a.assignmentType === 'branch' && a.assignmentId === branchId
            );
        }

        // 4. Fall back to default assignment
        if (!selectedAssignment) {
            selectedAssignment = assignments.find(
                a => a.assignmentType === 'default'
            );
        }

                if (!selectedAssignment || !selectedAssignment.menu) {
                    return successResponse(null, 'No menu assigned to this location');
                }

                // Load all modules to get current icons
                const moduleLoader = new ModuleLoader();
                const allModules = await moduleLoader.loadAllModules();
                const moduleIconMap = new Map<string, string>();
                allModules.forEach(mod => {
                    if (mod.slug && mod.icon) {
                        moduleIconMap.set(mod.slug, mod.icon);
                    }
                });

                // Enrich module GROUP icons with current module icons from module.config.yaml
                // Only apply to module ROOT items (the main module entry point, not individual pages)
                // Individual pages should ALWAYS keep their own icons from the database
                const enrichWithModuleIcons = (items: any[]): any[] => {
                    return items.map(item => {
                        let enrichedItem = { ...item };

                        // Only enrich module ROOT icons (the main module entry):
                        // - Item must have moduleSlug
                        // - Module icon must exist in moduleIconMap
                        // - Item must have children (meaning it's the module group, not an individual page)
                        // - Item's href must be the module root (e.g., /modules/{slug} or /modules/{slug}/dashboard)
                        // This prevents individual pages (like Payments) from getting the parent module's icon
                        const isModuleRoot = item.moduleSlug &&
                                             moduleIconMap.has(item.moduleSlug) &&
                                             item.children &&
                                             item.children.length > 0 &&
                                             (item.href === `/modules/${item.moduleSlug}` ||
                                              item.href === `/modules/${item.moduleSlug}/dashboard` ||
                                              item.href?.endsWith(`/modules/${item.moduleSlug}`) ||
                                              item.href?.endsWith(`/modules/${item.moduleSlug}/dashboard`));

                        if (isModuleRoot) {
                            enrichedItem.icon = moduleIconMap.get(item.moduleSlug);
                        }

                        // Recursively process children
                        if (item.children && item.children.length > 0) {
                            enrichedItem.children = enrichWithModuleIcons(item.children);
                        }

                        return enrichedItem;
                    });
                };

                // Filter menu items based on user permissions
                const filterItemsByPermissions = (items: any[]): any[] => {
                    return items
                        .filter(item => {
                            // Check role requirement (compare by role name, not ID)
                            if (item.requiredRole && item.requiredRole !== roleName) {
                                return false;
                            }
                            
                            // Special check: Module Settings pages should only be visible to Admin and SuperAdmin
                            // Check if this is a module Settings page (/modules/{slug}/settings)
                            if (item.href && typeof item.href === 'string') {
                                const isModuleSettingsPage = /^\/modules\/[^\/]+\/settings$/.test(item.href) || 
                                                           item.href.endsWith('/settings');
                                
                                if (isModuleSettingsPage) {
                                    // Only Admin and SuperAdmin can see module Settings pages
                                    const isAdmin = roleName && (
                                        roleName.toLowerCase() === 'admin' || 
                                        roleName.toLowerCase() === 'superadmin' ||
                                        roleName === 'Admin' ||
                                        roleName === 'SuperAdmin'
                                    );
                                    
                                    if (!isAdmin) {
                                        return false; // Hide Settings page for non-admin users
                                    }
                                }
                            }
                            
                            // TODO: Check permission requirement
                            // if (item.requiredPermission && !userHasPermission(item.requiredPermission)) {
                            //   return false;
                            // }
                            return true;
                        })
                        .map(item => ({
                            ...item,
                            children: item.children ? filterItemsByPermissions(item.children) : [],
                        }));
                };

                // Get root items (no parent) and filter
                const rootItems = selectedAssignment.menu.items
                    .filter(item => !item.parentId)
                    .map(item => ({
                        ...item,
                        children: item.children ? filterItemsByPermissions(item.children) : [],
                    }));

                const filteredItems = filterItemsByPermissions(rootItems);

                // Enrich filtered items with current module icons
                const enrichedItems = enrichWithModuleIcons(filteredItems);

                const response = successResponse({
                    menu: {
                        ...selectedAssignment.menu,
                        items: enrichedItems,
                    },
                    location: {
                        id: location.id,
                        name: location.name,
                        label: location.label,
                        layoutType: location.layoutType,
                        maxDepth: location.maxDepth,
                    },
                    assignment: {
                        type: selectedAssignment.assignmentType,
                        id: selectedAssignment.assignmentId,
                        priority: selectedAssignment.priority,
                    },
                });

                // No cache - menu updates should reflect immediately
                response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');

                return response;
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Failed to resolve menu';
                const isTenantError = errorMessage.includes('Tenant') || errorMessage.includes('tenant');
                
                return errorResponse(
                    errorMessage,
                    isTenantError 
                        ? 'Tenant not found. Please run core seed to create tenant record in core database.'
                        : 'Failed to resolve menu',
                    isTenantError ? 400 : 500
                );
            }
        },
        { required: true }
    );
}
