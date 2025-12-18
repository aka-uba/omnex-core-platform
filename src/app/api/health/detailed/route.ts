/**
 * Detailed Health Check Endpoint
 * Comprehensive health check including database status
 */

import { NextResponse } from 'next/server';
import { corePrisma } from '@/lib/corePrisma';
export async function GET() {
    const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.8',
        service: 'omnex-core-platform',
        checks: {
            database: { status: 'unknown', message: '' },
            tenants: { status: 'unknown', count: 0 },
        },
    };

    try {
        // Check core database connection
        await corePrisma.$queryRaw`SELECT 1`;
        health.checks.database = { status: 'ok', message: 'Core database connected' };

        // Check tenants
        const tenantCount = await corePrisma.tenant.count({ where: { status: 'active' } });
        health.checks.tenants = { status: 'ok', count: tenantCount };

    } catch (error) {
        health.status = 'degraded';
        health.checks.database = {
            status: 'error',
            message: error instanceof Error ? error.message : 'Database connection failed'
        };
    }

    const statusCode = health.status === 'ok' ? 200 : 503;
    return NextResponse.json(health, { status: statusCode });
}
