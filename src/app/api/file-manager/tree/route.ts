import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getTenantPrismaFromRequest, getTenantFromRequest } from '@/lib/api/tenantContext';
import { getCompanyIdFromRequest } from '@/lib/api/companyContext';
interface DirectoryNode {
    id: string;
    name: string;
    path: string;
    type: 'tenant' | 'module' | 'folder';
    children?: DirectoryNode[];
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
        const requestedTenantSlug = searchParams.get('tenant');

        // Sadece mevcut tenant'ın dosyalarını göster
        const tenantSlug = tenant.slug;
        if (requestedTenantSlug && requestedTenantSlug !== tenantSlug && requestedTenantSlug !== 'all') {
            return NextResponse.json(
                { success: false, error: 'Access denied: Cannot access other tenant files' },
                { status: 403 }
            );
        }

        // Base storage path
        const storagePath = path.join(process.cwd(), 'storage', 'tenants');

        // Ensure storage directory exists
        try {
            await fs.access(storagePath);
        } catch {
            await fs.mkdir(storagePath, { recursive: true });
        }

        const tree: DirectoryNode[] = [];

        // Sadece mevcut tenant'ın dosyalarını göster
        const tenantPath = path.join(storagePath, tenantSlug);
        try {
            await fs.access(tenantPath);
            const tenantNode = await buildDirectoryTree(tenantPath, tenantSlug, `/storage/tenants/${tenantSlug}`);
            tree.push({
                ...tenantNode,
                type: 'tenant',
                name: tenant.name || tenantSlug
            });
        } catch (error) {
            console.error(`Tenant directory not found: ${tenantSlug}`);
            // Tenant dizini yoksa boş tree döndür
        }

        return NextResponse.json({ success: true, data: tree });
    } catch (error) {
        console.error('Error fetching directory tree:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch directory tree' },
            { status: 500 }
        );
    }
}

async function buildDirectoryTree(dirPath: string, idPrefix: string, relativePath: string): Promise<DirectoryNode> {
    const name = path.basename(dirPath);
    const node: DirectoryNode = {
        id: idPrefix,
        name,
        path: relativePath,
        type: 'folder',
        children: []
    };

    try {
        const items = await fs.readdir(dirPath, { withFileTypes: true });

        for (const item of items) {
            if (item.isDirectory()) {
                const itemPath = path.join(dirPath, item.name);
                const itemRelativePath = `${relativePath}/${item.name}`;
                const itemId = `${idPrefix}-${item.name}`;

                // Determine type based on folder name or depth
                let type: 'module' | 'folder' = 'folder';
                if (relativePath.endsWith('module-files')) {
                    type = 'module';
                }

                // Recursively build tree
                // Limit recursion depth if needed, but for now full tree
                // Optimization: Only go 2 levels deep for initial load? 
                // For now, let's go 2 levels deep (Tenant -> Root Folders -> Subfolders)
                // Adjust depth logic as needed.

                // Check if it's a module folder
                if (name === 'module-files') {
                    type = 'module';
                }

                const childNode = await buildDirectoryTree(itemPath, itemId, itemRelativePath);
                childNode.type = type;

                if (node.children) {
                    node.children.push(childNode);
                }
            }
        }
    } catch (error) {
        console.error(`Error reading directory ${dirPath}:`, error);
    }

    return node;
}
