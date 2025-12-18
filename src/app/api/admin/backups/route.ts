/**
 * Backup Management API
 * Endpoints for managing database backups
 */

import { NextRequest } from 'next/server';
import { requireSuperAdmin } from '@/lib/middleware/superAdminMiddleware';
import { successResponse, errorResponse } from '@/lib/api/response';
import { createBackup, listBackups } from '@/lib/services/backupService';

/**
 * GET /api/admin/backups
 * List backups
 */
export async function GET(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (auth instanceof Response) {
        // Return the error response directly
        return auth;
    }

    try {
        const tenantId = request.nextUrl.searchParams.get('tenantId') || undefined;
        const backups = await listBackups(tenantId);
        
        // Transform backups to match frontend interface
        const transformedBackups = backups.map((backup: any) => {
            // Handle fileSize - it might be a number, string, or BigInt
            // BigInt cannot be serialized to JSON, so convert to string
            let fileSize = '0';
            if (backup.fileSize !== null && backup.fileSize !== undefined) {
                if (typeof backup.fileSize === 'bigint') {
                    fileSize = backup.fileSize.toString();
                } else if (typeof backup.fileSize === 'number') {
                    fileSize = backup.fileSize.toString();
                } else if (typeof backup.fileSize === 'string') {
                    fileSize = backup.fileSize;
                } else {
                    fileSize = String(backup.fileSize);
                }
            }
            
            return {
                id: backup.id,
                fileName: backup.fileName,
                fileSize: fileSize,
                status: backup.status || 'COMPLETED',
                type: backup.type || 'MANUAL',
                createdAt: backup.createdAt.toISOString(),
                tenant: backup.tenant ? {
                    name: backup.tenant.name,
                    slug: backup.tenant.slug,
                } : {
                    name: 'Unknown',
                    slug: 'unknown',
                },
            };
        });
        
        return successResponse({ backups: transformedBackups });
    } catch (error: any) {
        return errorResponse('INTERNAL_ERROR', error?.message || 'Failed to list backups', error);
    }
}

/**
 * POST /api/admin/backups
 * Create new backup
 */
export async function POST(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (auth instanceof Response) {
        return auth;
    }

    try {
        const body = await request.json().catch(() => ({}));
        const { tenantId } = body;

        if (!tenantId) {
            return errorResponse('VALIDATION_ERROR', 'Tenant ID is required');
        }

        const backup = await createBackup({
            tenantId,
            userId: auth.userId,
            type: 'MANUAL',
        });

        // Transform backup to avoid BigInt serialization issues
        const transformedBackup = {
            id: backup.id,
            fileName: backup.fileName,
            fileSize: backup.fileSize ? String(backup.fileSize) : '0',
            status: backup.status || 'PENDING',
            type: backup.type || 'MANUAL',
            createdAt: backup.createdAt.toISOString(),
            tenant: (backup as any).tenant ? {
                name: (backup as any).tenant.name,
                slug: (backup as any).tenant.slug,
            } : {
                name: 'Unknown',
                slug: 'unknown',
            },
        };

        return successResponse({ backup: transformedBackup }, undefined, 201);
    } catch (error: any) {
        return errorResponse('INTERNAL_ERROR', error?.message || 'Failed to create backup', error);
    }
}
