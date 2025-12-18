import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getTenantPrismaFromRequest, getTenantFromRequest } from '@/lib/api/tenantContext';
import { getCompanyIdFromRequest } from '@/lib/api/companyContext';
// Helper to get mime type (since we might not have 'mime' package installed, let's use a simple map or try to import)
// If 'mime' is not installed, we can default to octet-stream.
// Checking package.json... I don't recall seeing 'mime'.
// I'll stick to basic types or use 'application/octet-stream' as default.

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
        const filePath = searchParams.get('path');
        const inline = searchParams.get('inline') === 'true'; // For preview, use inline

        if (!filePath) {
            return NextResponse.json(
                { success: false, error: 'Path is required' },
                { status: 400 }
            );
        }

        // Security check: Ensure path starts with /storage/tenants/{tenantSlug}
        const expectedPathPrefix = `/storage/tenants/${tenant.slug}`;
        if (!filePath.startsWith(expectedPathPrefix) && !filePath.startsWith(expectedPathPrefix.replace(/\//g, '\\'))) {
            return NextResponse.json(
                { success: false, error: 'Invalid path: Path must be within tenant storage' },
                { status: 403 }
            );
        }

        // Prevent directory traversal
        if (filePath.includes('..')) {
            return NextResponse.json(
                { success: false, error: 'Invalid path' },
                { status: 400 }
            );
        }

        const fullPath = path.join(process.cwd(), filePath);

        // Check if exists
        try {
            await fs.access(fullPath);
        } catch {
            return NextResponse.json(
                { success: false, error: 'File not found' },
                { status: 404 }
            );
        }

        const stats = await fs.stat(fullPath);
        if (stats.isDirectory()) {
            return NextResponse.json(
                { success: false, error: 'Cannot download a directory' },
                { status: 400 }
            );
        }

        const fileBuffer = await fs.readFile(fullPath);
        const filename = path.basename(fullPath);

        // Simple mime type detection
        const ext = path.extname(filename).toLowerCase();
        let contentType = 'application/octet-stream';
        // Images
        if (ext === '.png') contentType = 'image/png';
        if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
        if (ext === '.gif') contentType = 'image/gif';
        if (ext === '.webp') contentType = 'image/webp';
        if (ext === '.svg') contentType = 'image/svg+xml';
        if (ext === '.bmp') contentType = 'image/bmp';
        if (ext === '.ico') contentType = 'image/x-icon';
        // Documents
        if (ext === '.pdf') contentType = 'application/pdf';
        if (ext === '.txt') contentType = 'text/plain';
        if (ext === '.json') contentType = 'application/json';
        if (ext === '.xml') contentType = 'application/xml';
        if (ext === '.yaml' || ext === '.yml') contentType = 'text/yaml';
        if (ext === '.md' || ext === '.markdown') contentType = 'text/markdown';
        // Office
        if (ext === '.doc') contentType = 'application/msword';
        if (ext === '.docx') contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        if (ext === '.xls') contentType = 'application/vnd.ms-excel';
        if (ext === '.xlsx') contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        // Video
        if (ext === '.mp4') contentType = 'video/mp4';
        if (ext === '.webm') contentType = 'video/webm';
        if (ext === '.ogg') contentType = 'video/ogg';
        if (ext === '.mov') contentType = 'video/quicktime';
        if (ext === '.avi') contentType = 'video/x-msvideo';
        // Audio
        if (ext === '.mp3') contentType = 'audio/mpeg';
        if (ext === '.wav') contentType = 'audio/wav';
        if (ext === '.aac') contentType = 'audio/aac';
        if (ext === '.flac') contentType = 'audio/flac';
        if (ext === '.m4a') contentType = 'audio/mp4';

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': inline 
                    ? `inline; filename="${filename}"` 
                    : `attachment; filename="${filename}"`,
                'Cache-Control': 'public, max-age=3600',
            },
        });

    } catch (error) {
        console.error('Error downloading file:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to download file' },
            { status: 500 }
        );
    }
}
