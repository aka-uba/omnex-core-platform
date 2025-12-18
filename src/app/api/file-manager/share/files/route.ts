import { NextRequest, NextResponse } from 'next/server';
import { getServerStatus } from '../status/route';
export async function GET(request: NextRequest) {
    try {
        // Tenant control
        const { getTenantFromRequest } = await import('@/lib/api/tenantContext');
        const tenant = await getTenantFromRequest(request);
        if (!tenant) {
            return NextResponse.json(
                { error: 'Tenant context is required' },
                { 
                    status: 400,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type',
                    }
                }
            );
        }

        // CORS headers
        const headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

        // Handle preflight
        if (request.method === 'OPTIONS') {
            return new NextResponse(null, { status: 200, headers });
        }

        const status = getServerStatus();
        
        // Get folderId from query params or server status
        const { searchParams } = new URL(request.url);
        const folderIdParam = searchParams.get('folderId');
        
        // Use folderId from query param, or from server status, or null (root)
        const folderId = folderIdParam || status.folderId || null;

        // Get files from the specified folder using tenant-aware file system
        
        // Determine the path to list files from
        let targetPath: string;
        if (folderId && folderId.startsWith('/storage/tenants/')) {
            // folderId is already a full path
            targetPath = folderId;
        } else if (folderId) {
            // folderId is a relative path, construct full path
            targetPath = `/storage/tenants/${tenant.slug}/${folderId}`;
        } else {
            // Root folder for tenant
            targetPath = `/storage/tenants/${tenant.slug}`;
        }
        
        // Security check: Ensure path is within tenant storage
        const expectedPathPrefix = `/storage/tenants/${tenant.slug}`;
        if (!targetPath.startsWith(expectedPathPrefix)) {
            return NextResponse.json(
                { error: 'Invalid path: Path must be within tenant storage' },
                { 
                    status: 403,
                    headers
                }
            );
        }
        
        // Use the actual file system API
        const fs = await import('fs/promises');
        const pathModule = await import('path');
        const fullPath = pathModule.join(process.cwd(), targetPath);
        
        try {
            await fs.access(fullPath);
        } catch {
            return NextResponse.json(
                { error: 'Directory not found' },
                { 
                    status: 404,
                    headers
                }
            );
        }
        
        const items = await fs.readdir(fullPath, { withFileTypes: true });
        const files = [];
        
        for (const item of items) {
            const itemPath = pathModule.join(fullPath, item.name);
            const stats = await fs.stat(itemPath);
            const itemRelativePath = pathModule.join(targetPath, item.name).replace(/\\/g, '/');
            
            files.push({
                id: itemRelativePath,
                name: item.name,
                type: item.isDirectory() ? 'folder' : 'file',
                size: item.isDirectory() ? undefined : stats.size,
                modifiedAt: stats.mtime.toISOString(),
                path: itemRelativePath,
            });
        }

        return NextResponse.json({
            success: true,
            files: files,
        }, { headers });
    } catch (error) {
        console.error('Error getting shared files:', error);
        return NextResponse.json(
            { error: 'Failed to get files' },
            { 
                status: 500,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                }
            }
        );
    }
}

