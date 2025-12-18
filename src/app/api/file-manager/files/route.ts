import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getTenantPrismaFromRequest, getTenantFromRequest } from '@/lib/api/tenantContext';
import { getCompanyIdFromRequest } from '@/lib/api/companyContext';
interface FileItem {
    id: string;
    name: string;
    type: 'file' | 'folder';
    size?: number;
    modifiedAt: string;
    path: string;
}

export async function GET(request: NextRequest) {
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
        const relativePath = searchParams.get('path');

        if (!relativePath) {
            return NextResponse.json(
                { success: false, error: 'Path is required' },
                { status: 400 }
            );
        }

        // Security check: Ensure path starts with /storage/tenants/{tenantSlug}
        const expectedPathPrefix = `/storage/tenants/${tenant.slug}`;
        if (!relativePath.startsWith(expectedPathPrefix) && !relativePath.startsWith(expectedPathPrefix.replace(/\//g, '\\'))) {
            return NextResponse.json(
                { success: false, error: 'Invalid path: Path must be within tenant storage' },
                { status: 403 }
            );
        }

        // Prevent directory traversal
        if (relativePath.includes('..')) {
            return NextResponse.json(
                { success: false, error: 'Invalid path' },
                { status: 400 }
            );
        }

        const fullPath = path.join(process.cwd(), relativePath);

        try {
            await fs.access(fullPath);
        } catch {
            return NextResponse.json(
                { success: false, error: 'Directory not found' },
                { status: 404 }
            );
        }

        const items = await fs.readdir(fullPath, { withFileTypes: true });
        const files: FileItem[] = [];

        for (const item of items) {
            const itemPath = path.join(fullPath, item.name);
            const stats = await fs.stat(itemPath);

            // Normalize path separators for frontend
            const itemRelativePath = path.join(relativePath, item.name).replace(/\\/g, '/');

            files.push({
                id: itemRelativePath, // Use path as ID
                name: item.name,
                type: item.isDirectory() ? 'folder' : 'file',
                ...(item.isDirectory() ? {} : { size: stats.size }),
                modifiedAt: stats.mtime.toISOString(),
                path: itemRelativePath,
            });
        }

        return NextResponse.json({ success: true, data: files });
    } catch (error) {
        console.error('Error fetching files:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch files' },
            { status: 500 }
        );
    }
}
