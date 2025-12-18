/**
 * JWT Token Utilities
 * Handles JWT token generation, verification, and refresh token management
 */

import jwt from 'jsonwebtoken';
import type { NextRequest } from 'next/server';

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'; // 7 days
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-token-secret-change-this';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d'; // 30 days

export interface JWTPayload {
    userId: string;
    tenantSlug: string;
    role: string;
    email: string;
    username?: string;
}

/**
 * Generate access token (short-lived)
 */
export function generateAccessToken(payload: JWTPayload): string {
    const expiresIn = typeof JWT_EXPIRES_IN === 'string' ? JWT_EXPIRES_IN : `${JWT_EXPIRES_IN}s`;
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: expiresIn as string,
        issuer: 'omnex-core',
        audience: 'omnex-api',
    } as jwt.SignOptions);
}

/**
 * Generate refresh token (long-lived)
 */
export function generateRefreshToken(payload: JWTPayload): string {
    const expiresIn = typeof JWT_REFRESH_EXPIRES_IN === 'string' ? JWT_REFRESH_EXPIRES_IN : `${JWT_REFRESH_EXPIRES_IN}s`;
    return jwt.sign(
        {
            userId: payload.userId,
            tenantSlug: payload.tenantSlug,
        },
        JWT_REFRESH_SECRET,
        {
            expiresIn: expiresIn as string,
            issuer: 'omnex-core',
            audience: 'omnex-api',
        } as jwt.SignOptions
    );
}

/**
 * Verify access token
 * Returns payload if valid, null if invalid/expired
 */
export function verifyAccessToken(token: string): JWTPayload | null {
    try {
        const decoded = jwt.verify(token, JWT_SECRET, {
            issuer: 'omnex-core',
            audience: 'omnex-api',
        }) as JWTPayload;

        return decoded;
    } catch (error) {
        // Token invalid or expired
        return null;
    }
}

/**
 * Verify refresh token
 * Returns payload if valid, null if invalid/expired
 */
export function verifyRefreshToken(token: string): { userId: string; tenantSlug: string } | null {
    try {
        const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
            issuer: 'omnex-core',
            audience: 'omnex-api',
        }) as { userId: string; tenantSlug: string };

        return decoded;
    } catch (error) {
        // Token invalid or expired
        return null;
    }
}

/**
 * Extract token from Authorization header
 * Supports "Bearer <token>" format
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
    if (!authHeader) return null;

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return null;
    }

    return parts[1] || null;
}

/**
 * Decode token without verification (for debugging)
 * WARNING: Do not use for authentication, only for debugging
 */
export function decodeToken(token: string): any {
    try {
        return jwt.decode(token);
    } catch {
        return null;
    }
}

/**
 * Verify authentication from request
 * Extracts token from Authorization header and verifies it
 * Returns result with valid flag and payload (including tenantId if available)
 */
export async function verifyAuth(request: NextRequest): Promise<{
    valid: boolean;
    payload: (JWTPayload & { tenantId?: string }) | null;
}> {
    // Try to get token from Authorization header first
    const authHeader = request.headers.get('authorization');
    let token = extractTokenFromHeader(authHeader);

    // If not in header, try to get from cookie
    if (!token) {
        token = request.cookies.get('auth-token')?.value || null;
    }

    if (!token) {
        return {
            valid: false,
            payload: null,
        };
    }

    const payload = verifyAccessToken(token);

    if (!payload) {
        return {
            valid: false,
            payload: null,
        };
    }

    // Try to resolve tenantId from tenantSlug
    // This requires a database lookup, so we do it asynchronously
    let tenantId: string | undefined;
    if (payload.tenantSlug) {
        try {
            // Dynamically import to avoid circular dependencies
            const { getTenantFromRequest } = await import('../api/tenantContext');
            const tenantContext = await getTenantFromRequest(request);
            if (tenantContext) {
                tenantId = tenantContext.id;
            }
        } catch (error) {
            // If tenant lookup fails, continue without tenantId
            // The payload will still have tenantSlug which can be used
            console.warn('Failed to resolve tenantId from tenantSlug:', error);
        }
    }

    return {
        valid: true,
        payload: {
            ...payload,
            ...(tenantId ? { tenantId } : {}),
        },
    };
}
