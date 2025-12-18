import { NextRequest, NextResponse } from 'next/server';
import { corePrisma } from '@/lib/corePrisma';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/tenants/[id]/databases
 * List all yearly databases for tenant
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // TODO: Add authentication check

        const { id } = await params;

        const tenant = await corePrisma.tenant.findUnique({
            where: { id },
            select: {
                allDatabases: true,
                currentDb: true,
            },
        });

        if (!tenant) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Tenant not found',
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                databases: tenant.allDatabases,
                currentDb: tenant.currentDb,
            },
        });
    } catch (error: any) {
        logger.error('Failed to get tenant databases', error, 'api-tenants');
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to get tenant databases',
            },
            { status: 500 }
        );
    }
}

/**
 * POST /api/tenants/[id]/databases/switch
 * Switch active database year
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // TODO: Add authentication check

        const { id } = await params;
        const body = await request.json();
        const { dbName } = body;

        if (!dbName) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'dbName is required',
                },
                { status: 400 }
            );
        }

        // Verify dbName exists in allDatabases
        const tenant = await corePrisma.tenant.findUnique({
            where: { id },
            select: {
                allDatabases: true,
            },
        });

        if (!tenant) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Tenant not found',
                },
                { status: 404 }
            );
        }

        if (!tenant.allDatabases.includes(dbName)) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Database not found in tenant databases',
                },
                { status: 400 }
            );
        }

        // Update currentDb
        const updatedTenant = await corePrisma.tenant.update({
            where: { id },
            data: {
                currentDb: dbName,
            },
        });

        logger.info('Tenant database switched', { tenantId: id, dbName }, 'api-tenants');

        return NextResponse.json({
            success: true,
            data: {
                currentDb: updatedTenant.currentDb,
            },
        });
    } catch (error: any) {
        logger.error('Failed to switch tenant database', error, 'api-tenants');
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to switch tenant database',
            },
            { status: 500 }
        );
    }
}
