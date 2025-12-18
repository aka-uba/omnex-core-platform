import { NextRequest, NextResponse } from 'next/server';
import { updateTenant, deleteTenant } from '@/lib/services/tenantService';
import { corePrisma } from '@/lib/corePrisma';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/tenants/[id]
 * Get single tenant by ID
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
            include: {
                agency: true,
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
            data: tenant,
        });
    } catch (error: any) {
        logger.error('Failed to get tenant', error, 'api-tenants');
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to get tenant',
            },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/tenants/[id]
 * Update tenant metadata
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // TODO: Add authentication check (SuperAdmin only)

        const { id } = await params;
        const body = await request.json();

        const { name, subdomain, customDomain, status, metadata } = body;

        const tenant = await updateTenant(id, {
            name,
            subdomain,
            customDomain,
            status,
            metadata,
        });

        logger.info('Tenant updated successfully', { tenantId: id }, 'api-tenants');

        return NextResponse.json({
            success: true,
            data: tenant,
        });
    } catch (error: any) {
        logger.error('Failed to update tenant', error, 'api-tenants');
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to update tenant',
            },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/tenants/[id]
 * Soft delete tenant (status = 'inactive') or hard delete with ?hardDelete=true
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // TODO: Add authentication check (SuperAdmin only)

        const { id } = await params;
        const hardDelete = request.nextUrl.searchParams.get('hardDelete') === 'true';

        if (hardDelete) {
            // Hard delete - permanently remove from database
            await corePrisma.tenant.delete({
                where: { id },
            });
            logger.info('Tenant hard deleted successfully', { tenantId: id }, 'api-tenants');

            return NextResponse.json({
                success: true,
                message: 'Tenant permanently deleted',
            });
        } else {
            // Soft delete - mark as inactive
            await deleteTenant(id);
            logger.info('Tenant soft deleted successfully', { tenantId: id }, 'api-tenants');

            return NextResponse.json({
                success: true,
                message: 'Tenant deleted successfully',
            });
        }
    } catch (error: any) {
        logger.error('Failed to delete tenant', error, 'api-tenants');
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to delete tenant',
            },
            { status: 500 }
        );
    }
}
