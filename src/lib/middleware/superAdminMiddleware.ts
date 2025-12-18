/**
 * SuperAdmin Middleware
 * Ensures only SuperAdmin role can access protected routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/authMiddleware';
import { forbiddenResponse } from '@/lib/api/response';

/**
 * Require SuperAdmin role
 * Returns JWTPayload if authorized, NextResponse if not
 */
export async function requireSuperAdmin(request: NextRequest) {
    const auth = await requireAuth(request);

    if (auth instanceof NextResponse) {
        return auth; // Already unauthorized
    }

    if (auth.role !== 'SuperAdmin') {
        return forbiddenResponse('SuperAdmin access required');
    }

    return auth;
}

/**
 * Extract IP address from request
 */
export function getClientIP(request: NextRequest): string | undefined {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');

    if (forwarded) {
        const ip = forwarded.split(',')[0]?.trim();
        return ip || undefined;
    }

    if (realIP) {
        return realIP;
    }

    return undefined;
}

/**
 * Extract user agent from request
 */
export function getUserAgent(request: NextRequest): string | undefined {
    return request.headers.get('user-agent') || undefined;
}
