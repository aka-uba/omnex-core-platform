import { NextRequest, NextResponse } from 'next/server';
import { PermissionContext, canAccessCompanies } from '@/lib/permissions/permissions';

/**
 * Middleware to check if user can access companies page
 */
export async function checkCompaniesAccess(request: NextRequest) {
    // TODO: Get user from session/JWT
    const context: PermissionContext = {
        role: 'superadmin', // Placeholder - get from auth
    };

    if (!canAccessCompanies(context)) {
        return NextResponse.json(
            {
                success: false,
                error: 'Access denied. SuperAdmin role required.',
            },
            { status: 403 }
        );
    }

    return null; // Access granted
}

/**
 * Middleware to check file manager access with tenant isolation
 */
export async function checkFileManagerAccess(
    request: NextRequest,
    targetTenantSlug?: string
) {
    // TODO: Get user from session/JWT
    const context: PermissionContext = {
        role: 'tenant-admin', // Placeholder
        tenantSlug: 'omnexcore', // Placeholder
    };

    // SuperAdmin can access all tenants
    if (context.role === 'superadmin') {
        return null;
    }

    // Tenant admin can only access their own tenant
    if (targetTenantSlug && context.tenantSlug !== targetTenantSlug) {
        return NextResponse.json(
            {
                success: false,
                error: 'Access denied. You can only access your own tenant files.',
            },
            { status: 403 }
        );
    }

    return null; // Access granted
}

/**
 * Middleware to check export templates access
 */
export async function checkExportTemplatesAccess(request: NextRequest) {
    // TODO: Get user from session/JWT
    const context: PermissionContext = {
        role: 'tenant-admin', // Placeholder
        tenantSlug: 'omnexcore',
    };

    if (context.role !== 'superadmin' && context.role !== 'tenant-admin') {
        return NextResponse.json(
            {
                success: false,
                error: 'Access denied. Admin role required.',
            },
            { status: 403 }
        );
    }

    return null; // Access granted
}
