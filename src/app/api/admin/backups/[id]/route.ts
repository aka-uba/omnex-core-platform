/**
 * Backup Operations API
 * Endpoints for specific backup operations (download, delete, restore)
 */

import { NextRequest } from 'next/server';
import { requireSuperAdmin } from '@/lib/middleware/superAdminMiddleware';
import { successResponse, errorResponse } from '@/lib/api/response';
import { deleteBackup } from '@/lib/services/backupService';

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

/**
 * GET /api/admin/backups/[id]/download
 * Download backup file
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    const auth = await requireSuperAdmin(request);
    if (auth instanceof Response) return auth;

    // Check if this is a download request (path ends with /download)
    // Since we can't easily have separate files for [id]/download in Next.js app router 
    // without a folder structure, we might handle it here or assume the folder structure 
    // is correct. The user asked for specific structure.
    // Actually, standard Next.js App Router structure would be:
    // src/app/api/admin/backups/[id]/route.ts -> DELETE
    // src/app/api/admin/backups/[id]/download/route.ts -> GET
    // src/app/api/admin/backups/[id]/restore/route.ts -> POST

    // This file is likely intended for [id]/route.ts based on DELETE method below.
    // But I will split them into correct files in subsequent steps.
    // For now, let's implement DELETE here.

    return errorResponse('NOT_FOUND', 'Use specific endpoints for operations');
}

/**
 * DELETE /api/admin/backups/[id]
 * Delete a backup
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const auth = await requireSuperAdmin(request);
    if (auth instanceof Response) return auth;

    try {
        const { id } = await params;
        await deleteBackup(id, auth.userId);
        return successResponse({ success: true });
    } catch (error) {
        return errorResponse('INTERNAL_ERROR', 'Failed to delete backup', error);
    }
}
