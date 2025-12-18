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

        // Check if destination exists (we want to copy INTO a folder or AS a new name?)
        // Usually copy action implies copying TO a folder.
        // If destination is a folder, we append the source filename.
        // If destination doesn't exist, we assume it's the new name?
        // Let's assume destinationPath is the TARGET FOLDER.

        let finalDestinationPath = fullDestinationPath;

        try {
            const destStats = await fs.stat(fullDestinationPath);
            if (destStats.isDirectory()) {
                const sourceName = path.basename(fullSourcePath);
                finalDestinationPath = path.join(fullDestinationPath, sourceName);
            }
        } catch {
            // Destination doesn't exist, maybe it's a rename-copy? 
            // For simplicity, let's enforce destination to be an existing folder
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

        await fs.cp(fullSourcePath, finalDestinationPath, { recursive: true });

        return NextResponse.json({ success: true, message: 'Item copied successfully' });
    } catch (error) {
        console.error('Error copying item:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to copy item' },
            { status: 500 }
        );
    }
}
