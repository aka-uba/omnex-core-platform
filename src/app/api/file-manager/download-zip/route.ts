import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import JSZip from 'jszip';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { getCompanyIdFromRequest } from '@/lib/api/companyContext';
import { getTenantPrisma } from '@/lib/dbSwitcher';
export async function POST(request: NextRequest) {
    try {
        const tenant = await getTenantFromRequest(request);
        if (!tenant) {
            return NextResponse.json(
                { success: false, error: 'Tenant context is required' },
                { status: 400 }
            );
        }

        const tenantPrisma = getTenantPrisma(tenant.dbUrl);
        const companyId = await getCompanyIdFromRequest(request, tenantPrisma);
        if (!companyId) {
            return NextResponse.json(
                { success: false, error: 'Company context is required' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { paths, filename } = body;

        if (!paths || !Array.isArray(paths) || paths.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Paths array is required' },
                { status: 400 }
            );
        }

        const expectedPathPrefix = `/storage/tenants/${tenant.slug}`;
        const zip = new JSZip();

        // Add files to ZIP
        for (const filePath of paths) {
            // Security check
            if (!filePath.startsWith(expectedPathPrefix) && !filePath.startsWith(expectedPathPrefix.replace(/\//g, '\\'))) {
                continue; // Skip invalid paths
            }

            if (filePath.includes('..')) {
                continue; // Skip directory traversal attempts
            }

            const fullPath = path.join(process.cwd(), filePath);

            try {
                const stats = await fs.stat(fullPath);
                
                if (stats.isDirectory()) {
                    // Recursively add directory contents
                    await addDirectoryToZip(zip, fullPath, filePath, expectedPathPrefix);
                } else {
                    // Add single file
                    const fileBuffer = await fs.readFile(fullPath);
                    const relativePath = filePath.replace(expectedPathPrefix, '').replace(/^[\/\\]/, '');
                    zip.file(relativePath, fileBuffer);
                }
            } catch (error) {
                console.error(`Error adding ${filePath} to ZIP:`, error);
                // Continue with other files
            }
        }

        // Generate ZIP
        const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
        const finalFilename = filename || `files-${Date.now()}.zip`;

        return new NextResponse(zipBuffer as any, {
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="${finalFilename}"`,
            },
        });

    } catch (error) {
        console.error('Error creating ZIP:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create ZIP file' },
            { status: 500 }
        );
    }
}

async function addDirectoryToZip(zip: JSZip, dirPath: string, relativePath: string, basePath: string) {
    try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            const entryRelativePath = path.join(relativePath, entry.name).replace(/\\/g, '/');

            if (entry.isDirectory()) {
                await addDirectoryToZip(zip, fullPath, entryRelativePath, basePath);
            } else {
                const fileBuffer = await fs.readFile(fullPath);
                const zipPath = entryRelativePath.replace(basePath, '').replace(/^[\/\\]/, '');
                zip.file(zipPath, fileBuffer);
            }
        }
    } catch (error) {
        console.error(`Error adding directory ${dirPath} to ZIP:`, error);
    }
}








