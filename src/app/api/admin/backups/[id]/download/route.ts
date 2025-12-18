/**
 * Backup Download API
 */

import { NextRequest, NextResponse } from 'next/server';
import { Readable } from 'stream';
import { requireSuperAdmin } from '@/lib/middleware/superAdminMiddleware';
import { getBackupFileStream } from '@/lib/services/backupService';
import { errorResponse } from '@/lib/api/response';

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    const auth = await requireSuperAdmin(request);
    if (auth instanceof Response) {
        // Return the error response directly
        return auth;
    }

    try {
        const { id } = await params;
        
        if (!id) {
            return errorResponse('VALIDATION_ERROR', 'Backup ID is required');
        }
        
        const { stream, filename, size } = await getBackupFileStream(id);

        // Convert Node.js ReadableStream to Web ReadableStream for Next.js
        const webStream = Readable.toWeb(stream as Readable);
        
        return new NextResponse(webStream as any, {
            headers: {
                'Content-Type': 'application/octet-stream',
                'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
                'Content-Length': size?.toString() || '0',
            },
        });
    } catch (error: any) {
        return errorResponse('INTERNAL_ERROR', error?.message || 'Failed to download backup', error);
    }
}
