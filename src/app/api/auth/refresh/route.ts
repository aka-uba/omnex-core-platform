/**
 * Refresh Token Endpoint
 * Generates new access token using refresh token
 */

import { NextRequest } from 'next/server';
import { verifyRefreshToken, generateAccessToken } from '@/lib/auth/jwt';
import { getTenantPrisma } from '@/lib/dbSwitcher';
import { corePrisma } from '@/lib/corePrisma';
import { getTenantDbUrl } from '@/lib/services/tenantService';
import { successResponse, unauthorizedResponse, errorResponse } from '@/lib/api/response';
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { refreshToken } = body;

        if (!refreshToken) {
            return unauthorizedResponse('Refresh token is required');
        }

        // Verify refresh token
        const payload = verifyRefreshToken(refreshToken);

        if (!payload) {
            return unauthorizedResponse('Invalid or expired refresh token');
        }

        // Get user from database to ensure they still exist and are active
        const tenant = await corePrisma.tenant.findUnique({
            where: { slug: payload.tenantSlug },
        });

        if (!tenant || tenant.status !== 'active') {
            return unauthorizedResponse('Tenant not found or inactive');
        }

        const dbUrl = getTenantDbUrl(tenant);
        const tenantPrisma = getTenantPrisma(dbUrl);

        const user = await tenantPrisma.user.findUnique({
            where: { id: payload.userId },
            select: {
                id: true,
                email: true,
                role: true,
                status: true,
                username: true,
                name: true,
            },
        });

        if (!user || user.status !== 'active') {
            return unauthorizedResponse('User not found or inactive');
        }

        // Generate new access token
        const newAccessToken = generateAccessToken({
            userId: user.id,
            tenantSlug: payload.tenantSlug,
            role: user.role,
            email: user.email,
            ...(user.username ? { username: user.username } : {}),
        });

        return successResponse({
            accessToken: newAccessToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                tenantSlug: payload.tenantSlug,
            },
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        return errorResponse('INTERNAL_ERROR', 'Token refresh failed', null, 500);
    }
}
