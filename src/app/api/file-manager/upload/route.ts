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

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const destinationPath = formData.get('path') as string;

        if (!file || !destinationPath) {
            return NextResponse.json(
                { success: false, error: 'File and path are required' },
                { status: 400 }
            );
        }

        // Security check: Ensure path starts with /storage/tenants/{tenantSlug}
        const expectedPathPrefix = `/storage/tenants/${tenant.slug}`;
        if (!destinationPath.startsWith(expectedPathPrefix) && !destinationPath.startsWith(expectedPathPrefix.replace(/\//g, '\\'))) {
            return NextResponse.json(
                { success: false, error: 'Invalid path: Path must be within tenant storage' },
                { status: 403 }
            );
        }

        // Prevent directory traversal
        if (destinationPath.includes('..')) {
            return NextResponse.json(
                { success: false, error: 'Invalid path' },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const fullPath = path.join(process.cwd(), destinationPath, file.name);

        // Check if file already exists
        try {
            await fs.access(fullPath);
            // If exists, maybe append timestamp or error?
            // Let's error for now or overwrite?
            // Usually overwrite is dangerous without confirmation.
            // Let's return error 409
            return NextResponse.json(
                { success: false, error: 'File already exists' },
                { status: 409 }
            );
        } catch {
            // OK
        }

        await fs.writeFile(fullPath, buffer);

        return NextResponse.json({ success: true, message: 'File uploaded successfully' });
    } catch (error) {
        console.error('Error uploading file:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to upload file' },
            { status: 500 }
        );
    }
}
