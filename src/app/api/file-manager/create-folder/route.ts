import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getTenantPrismaFromRequest, getTenantFromRequest } from '@/lib/api/tenantContext';
import { getCompanyIdFromRequest } from '@/lib/api/companyContext';
export async function POST(request: NextRequest) {
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

        const body = await request.json();
        const { path: parentPath, folderName } = body;

        if (!parentPath || !folderName) {
            return NextResponse.json(
                { success: false, error: 'Path and folder name are required' },
                { status: 400 }
            );
        }

        // Security check: Ensure path starts with /storage/tenants/{tenantSlug}
        const expectedPathPrefix = `/storage/tenants/${tenant.slug}`;
        if (!parentPath.startsWith(expectedPathPrefix) && !parentPath.startsWith(expectedPathPrefix.replace(/\//g, '\\'))) {
            return NextResponse.json(
                { success: false, error: 'Invalid path: Path must be within tenant storage' },
                { status: 403 }
            );
        }

        // Prevent directory traversal
        if (parentPath.includes('..') || folderName.includes('..') || folderName.includes('/') || folderName.includes('\\')) {
            return NextResponse.json(
                { success: false, error: 'Invalid path or folder name' },
                { status: 400 }
            );
        }

        const fullPath = path.join(process.cwd(), parentPath, folderName);

        // Check if exists
        try {
            await fs.access(fullPath);
            return NextResponse.json(
                { success: false, error: 'Folder already exists' },
                { status: 409 }
            );
        } catch {
            // Doesn't exist, proceed
        }

        await fs.mkdir(fullPath);

        return NextResponse.json({ success: true, message: 'Folder created successfully' });
    } catch (error) {
        console.error('Error creating folder:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create folder' },
            { status: 500 }
        );
    }
}
