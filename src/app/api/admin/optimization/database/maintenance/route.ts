import { NextRequest } from 'next/server';
import { requireSuperAdmin } from '@/lib/middleware/superAdminMiddleware';
import { successResponse, errorResponse } from '@/lib/api/response';
import { logger } from '@/lib/utils/logger';
import { corePrisma } from '@/lib/corePrisma';
import { createSystemAuditLog } from '@/lib/services/systemAuditLogService';

/**
 * POST /api/admin/optimization/database/maintenance
 * Run database maintenance operations on CORE database
 *
 * IMPORTANT: These operations run on the CORE database only.
 * For tenant databases, use the tenant-specific maintenance endpoint.
 *
 * Operations:
 * - vacuum: Reclaims storage and updates statistics (VACUUM ANALYZE)
 * - analyze: Updates statistics for query planner (ANALYZE)
 * - reindex: Rebuilds indexes (REINDEX DATABASE - can be slow!)
 * - optimize: Runs VACUUM ANALYZE (same as vacuum for PostgreSQL)
 */
export async function POST(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (auth instanceof Response) return auth;

    try {
        const body = await request.json();
        const { operation, tenantId } = body;

        const validOperations = ['optimize', 'vacuum', 'analyze', 'reindex'];
        if (!operation || !validOperations.includes(operation)) {
            return errorResponse('VALIDATION_ERROR', `Invalid operation. Must be one of: ${validOperations.join(', ')}`);
        }

        const startTime = Date.now();
        let message: string;

        // Determine which database to operate on
        // If tenantId is provided, we need to get tenant connection
        // For now, we only support CORE database operations for safety

        if (tenantId) {
            return errorResponse(
                'NOT_SUPPORTED',
                'Tenant-specific database maintenance is not yet supported. Please contact support.'
            );
        }

        // Run operation on CORE database
        switch (operation) {
            case 'vacuum':
            case 'optimize':
                // VACUUM ANALYZE - reclaims space and updates statistics
                // Note: VACUUM cannot run in a transaction, so we use $executeRawUnsafe
                try {
                    await corePrisma.$executeRawUnsafe('VACUUM ANALYZE');
                    message = 'VACUUM ANALYZE completed successfully. Database space reclaimed and statistics updated.';
                } catch (vacuumError: any) {
                    // VACUUM may fail if running in a transaction
                    // Try just ANALYZE as a fallback
                    if (vacuumError.message?.includes('cannot run inside a transaction')) {
                        await corePrisma.$executeRawUnsafe('ANALYZE');
                        message = 'ANALYZE completed (VACUUM skipped - cannot run in transaction context). Statistics updated.';
                    } else {
                        throw vacuumError;
                    }
                }
                break;

            case 'analyze':
                // ANALYZE - updates statistics only
                await corePrisma.$executeRawUnsafe('ANALYZE');
                message = 'ANALYZE completed successfully. Query planner statistics updated.';
                break;

            case 'reindex':
                // REINDEX SCHEMA public - safer than REINDEX DATABASE
                // Note: REINDEX can be slow on large databases
                try {
                    // Get database name
                    const dbResult = await corePrisma.$queryRaw<{ current_database: string }[]>`SELECT current_database()`;
                    const dbName = dbResult[0]?.current_database;

                    // REINDEX SCHEMA is safer and can run with concurrent reads
                    await corePrisma.$executeRawUnsafe('REINDEX SCHEMA CONCURRENTLY public');
                    message = `REINDEX SCHEMA public completed successfully on database "${dbName}". Indexes rebuilt.`;
                } catch (reindexError: any) {
                    // CONCURRENTLY may not be supported in all cases
                    if (reindexError.message?.includes('CONCURRENTLY')) {
                        await corePrisma.$executeRawUnsafe('REINDEX SCHEMA public');
                        message = 'REINDEX SCHEMA public completed (non-concurrent). Indexes rebuilt.';
                    } else {
                        throw reindexError;
                    }
                }
                break;

            default:
                return errorResponse('VALIDATION_ERROR', 'Unknown operation');
        }

        const duration = Date.now() - startTime;

        // Log the operation
        await createSystemAuditLog({
            userId: auth.userId,
            tenantSlug: 'core',
            action: `DATABASE_${operation.toUpperCase()}`,
            module: 'optimization',
            resource: 'database',
            resourceId: 'core',
            status: 'SUCCESS',
            details: { operation, duration },
        });

        logger.info('Database maintenance operation completed', {
            operation,
            userId: auth.userId,
            duration: `${duration}ms`
        }, 'api-db-maintenance');

        return successResponse({
            message,
            operation,
            duration: `${duration}ms`,
            database: 'core',
        });
    } catch (error: any) {
        const errorMessage = error?.message || 'Unknown error';

        // Log failure
        try {
            await createSystemAuditLog({
                userId: auth.userId,
                tenantSlug: 'core',
                action: `DATABASE_MAINTENANCE_FAILED`,
                module: 'optimization',
                resource: 'database',
                resourceId: 'core',
                status: 'FAILURE',
                errorMessage,
            });
        } catch (logError) {
            // Ignore logging errors
        }

        logger.error('Failed to run database maintenance', { error: errorMessage }, 'api-db-maintenance');
        return errorResponse('INTERNAL_ERROR', `Database maintenance failed: ${errorMessage}`, error);
    }
}





