/**
 * Permission checks for role-based access control
 */

export type UserRole = 'superadmin' | 'tenant-admin' | 'user';

export interface PermissionContext {
    role: UserRole;
    tenantSlug?: string;
    userId?: string;
}

/**
 * Check if user can access companies management
 */
export function canAccessCompanies(context: PermissionContext): boolean {
    return context.role === 'superadmin';
}

/**
 * Check if user can create new tenants
 */
export function canCreateTenant(context: PermissionContext): boolean {
    return context.role === 'superadmin';
}

/**
 * Check if user can access all tenants in file manager
 */
export function canAccessAllTenants(context: PermissionContext): boolean {
    return context.role === 'superadmin';
}

/**
 * Check if user can manage export templates
 */
export function canManageExportTemplates(context: PermissionContext): boolean {
    return context.role === 'superadmin' || context.role === 'tenant-admin';
}

/**
 * Check if user can manage locations
 */
export function canManageLocations(context: PermissionContext): boolean {
    return context.role === 'superadmin' || context.role === 'tenant-admin';
}

/**
 * Check if user can access file manager
 */
export function canAccessFileManager(context: PermissionContext): boolean {
    return true; // All users can access file manager (with tenant isolation)
}

/**
 * Check if user can access specific tenant's files
 */
export function canAccessTenantFiles(
    context: PermissionContext,
    targetTenantSlug: string
): boolean {
    // SuperAdmin can access all tenants
    if (context.role === 'superadmin') {
        return true;
    }

    // Other users can only access their own tenant
    return context.tenantSlug === targetTenantSlug;
}

/**
 * Check if user can manage company settings
 */
export function canManageCompanySettings(context: PermissionContext): boolean {
    return context.role === 'superadmin' || context.role === 'tenant-admin';
}

/**
 * Get accessible tenant slugs for user
 */
export function getAccessibleTenants(context: PermissionContext): string[] | 'all' {
    if (context.role === 'superadmin') {
        return 'all';
    }

    return context.tenantSlug ? [context.tenantSlug] : [];
}

/**
 * Middleware helper to check permissions
 */
export function requirePermission(
    context: PermissionContext,
    permission: (ctx: PermissionContext) => boolean
): void {
    if (!permission(context)) {
        throw new Error('Insufficient permissions');
    }
}
