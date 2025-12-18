/**
 * Authentication Middleware
 * JWT token validation for protected API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, extractTokenFromHeader, type JWTPayload } from '../auth/jwt';
import { unauthorizedResponse } from '../api/response';

/**
 * Require authentication
 * Returns JWT payload if valid, error response if invalid
 */
export async function requireAuth(request: NextRequest): Promise<JWTPayload | NextResponse> {
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
        return unauthorizedResponse('No authentication token provided');
    }

    const payload = verifyAccessToken(token);

    if (!payload) {
        return unauthorizedResponse('Invalid or expired token');
    }

    return payload;
}

/**
 * Optional authentication
 * Returns JWT payload if valid, null if no token or invalid
 */
export async function optionalAuth(request: NextRequest): Promise<JWTPayload | null> {
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
        return null;
    }

    return verifyAccessToken(token);
}

/**
 * Check if user has required role
 */
export function hasRole(payload: JWTPayload, requiredRole: string | string[]): boolean {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    return roles.includes(payload.role);
}

/**
 * Require specific role
 */
export async function requireRole(
    request: NextRequest,
    requiredRole: string | string[]
): Promise<JWTPayload | NextResponse> {
    const authResult = await requireAuth(request);

    // If auth failed, return error response
    if (authResult instanceof NextResponse) {
        return authResult;
    }

    // Check role
    if (!hasRole(authResult, requiredRole)) {
        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Insufficient permissions',
                },
            },
            { status: 403 }
        );
    }

    return authResult;
}
