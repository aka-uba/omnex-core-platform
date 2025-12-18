import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getTenantPrismaFromRequest, getTenantFromRequest } from '@/lib/api/tenantContext';
import { getCompanyIdFromRequest } from '@/lib/api/companyContext';
export async function DELETE(request: NextRequest) {
    try {
        // Tenant ve Company kontrolü
        const tenantPrisma = await getTenantPrismaFromRequest(request);
        if (!tenantPrisma) {
            return NextResponse.json(
                { success: false, error: 'Tenant context is required' },
                { status: 400 }
            );
        }

        const tenant = await getTenantFromRequest(request);
        if (!tenant) {
            return NextResponse.json(
                { success: false, error: 'Tenant not found' },
                { status: 404 }
            );
        }

        const companyId = await getCompanyIdFromRequest(request, tenantPrisma);
        if (!companyId) {
            return NextResponse.json(
                { success: false, error: 'Company context is required' },
                { status: 400 }
            );
        }

        const searchParams = request.nextUrl.searchParams;
        const itemPath = searchParams.get('path');

        if (!itemPath) {
            return NextResponse.json(
                { success: false, error: 'Path is required' },
                { status: 400 }
            );
        }

        // Security check: Ensure path starts with /storage/tenants/{tenantSlug}
        const expectedPathPrefix = `/storage/tenants/${tenant.slug}`;
        if (!itemPath.startsWith(expectedPathPrefix) && !itemPath.startsWith(expectedPathPrefix.replace(/\//g, '\\'))) {
            return NextResponse.json(
                { success: false, error: 'Invalid path: Path must be within tenant storage' },
                { status: 403 }
            );
        }

        // Prevent directory traversal
        if (itemPath.includes('..')) {
            return NextResponse.json(
                { success: false, error: 'Invalid path' },
                { status: 400 }
            );
        }

        const fullPath = path.join(process.cwd(), itemPath);

        // Check if exists
        try {
            await fs.access(fullPath);
        } catch {
            return NextResponse.json(
                { success: false, error: 'Item not found' },
                { status: 404 }
            );
        }

        const stats = await fs.stat(fullPath);

        if (stats.isDirectory()) {
            await fs.rm(fullPath, { recursive: true, force: true });
        } else {
            await fs.unlink(fullPath);
        }

        return NextResponse.json({ success: true, message: 'Item deleted successfully' });
    } catch (error) {
        console.error('Error deleting item:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete item' },
            { status: 500 }
        );
    }
}
