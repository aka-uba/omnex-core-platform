/**
 * Logout Endpoint
 * Deletes session and clears cookies
 */

import { NextRequest } from 'next/server';
import { deleteSessionFromCookies } from '@/lib/auth/session';
import { successResponse, errorResponse } from '@/lib/api/response';
export async function POST(request: NextRequest) {
    try {
        // Delete session from cookies
        await deleteSessionFromCookies();

        return successResponse({
            message: 'Logged out successfully',
        });
    } catch (error) {
        console.error('Logout error:', error);
        return errorResponse('INTERNAL_ERROR', 'Logout failed', null, 500);
    }
}
