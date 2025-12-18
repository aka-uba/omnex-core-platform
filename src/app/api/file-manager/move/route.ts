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
        const { sourcePath, destinationPath } = body;

        if (!sourcePath || !destinationPath) {
            return NextResponse.json(
                { success: false, error: 'Source and destination paths are required' },
                { status: 400 }
            );
        }

        // Security check: Ensure paths start with /storage/tenants/{tenantSlug}
        const expectedPathPrefix = `/storage/tenants/${tenant.slug}`;
        if ((!sourcePath.startsWith(expectedPathPrefix) && !sourcePath.startsWith(expectedPathPrefix.replace(/\//g, '\\'))) ||
            (!destinationPath.startsWith(expectedPathPrefix) && !destinationPath.startsWith(expectedPathPrefix.replace(/\//g, '\\')))) {
            return NextResponse.json(
                { success: false, error: 'Invalid path: Paths must be within tenant storage' },
                { status: 403 }
            );
        }

        // Prevent directory traversal
        if (sourcePath.includes('..') || destinationPath.includes('..')) {
            return NextResponse.json(
                { success: false, error: 'Invalid path' },
                { status: 400 }
            );
        }

        const fullSourcePath = path.join(process.cwd(), sourcePath);
        const fullDestinationPath = path.join(process.cwd(), destinationPath);

        // Check if source exists
        try {
            await fs.access(fullSourcePath);
        } catch {
            return NextResponse.json(
                { success: false, error: 'Source item not found' },
                { status: 404 }
            );
        }

        // Logic similar to copy: destinationPath is the TARGET FOLDER
        let finalDestinationPath = fullDestinationPath;

        try {
            const destStats = await fs.stat(fullDestinationPath);
            if (destStats.isDirectory()) {
                const sourceName = path.basename(fullSourcePath);
                finalDestinationPath = path.join(fullDestinationPath, sourceName);
            }
        } catch {
            return NextResponse.json(
                { success: false, error: 'Destination folder not found' },
                { status: 404 }
            );
        }

        // Check if target already exists
        try {
            await fs.access(finalDestinationPath);
            return NextResponse.json(
                { success: false, error: 'Destination item already exists' },
                { status: 409 }
            );
        } catch {
            // OK
        }

        await fs.rename(fullSourcePath, finalDestinationPath);

        return NextResponse.json({ success: true, message: 'Item moved successfully' });
    } catch (error) {
        console.error('Error moving item:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to move item' },
            { status: 500 }
        );
    }
}
