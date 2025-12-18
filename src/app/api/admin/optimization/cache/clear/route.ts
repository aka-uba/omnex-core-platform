import { NextRequest } from 'next/server';
import { requireSuperAdmin } from '@/lib/middleware/superAdminMiddleware';
import { successResponse, errorResponse } from '@/lib/api/response';
import { logger } from '@/lib/utils/logger';
import fs from 'fs';
import path from 'path';
/**
 * Delete directory recursively
 */
function deleteDirectory(dirPath: string): boolean {
    try {
        if (!fs.existsSync(dirPath)) {
            return false;
        }
        
        fs.readdirSync(dirPath).forEach((file) => {
            const curPath = path.join(dirPath, file);
            if (fs.lstatSync(curPath).isDirectory()) {
                deleteDirectory(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(dirPath);
        return true;
    } catch (error) {
        logger.error('Error deleting directory', error, 'api-cache-clear');
        return false;
    }
}

/**
 * POST /api/admin/optimization/cache/clear
 * Clear cache (all, specific directory, or specific keys)
 */
export async function POST(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (auth instanceof Response) return auth;

    try {
        const body = await request.json().catch(() => ({}));
        const { key, directory, keys } = body;

        if (keys && Array.isArray(keys) && keys.length > 0) {
            // Clear multiple specific keys/directories
            let cleared = 0;
            let failed = 0;
            
            for (const cacheKey of keys) {
                try {
                    const cachePath = path.join(process.cwd(), '.next', 'cache', cacheKey);
                    if (fs.existsSync(cachePath)) {
                        if (fs.lstatSync(cachePath).isDirectory()) {
                            if (deleteDirectory(cachePath)) {
                                cleared++;
                            } else {
                                failed++;
                            }
                        } else {
                            fs.unlinkSync(cachePath);
                            cleared++;
                        }
                    }
                } catch (error) {
                    failed++;
                    logger.error('Error clearing cache key', error, 'api-cache-clear');
                }
            }
            
            logger.info('Cache keys cleared', { cleared, failed, userId: auth.userId }, 'api-cache-clear');
            return successResponse({ 
                message: `Cleared ${cleared} cache entries`,
                cleared,
                failed,
            });
        } else if (directory) {
            // Clear specific directory
            const cachePath = path.join(process.cwd(), '.next', 'cache', directory);
            if (fs.existsSync(cachePath)) {
                if (deleteDirectory(cachePath)) {
                    logger.info('Cache directory cleared', { directory, userId: auth.userId }, 'api-cache-clear');
                    return successResponse({ message: 'Cache directory cleared', directory });
                } else {
                    return errorResponse('INTERNAL_ERROR', 'Failed to clear cache directory');
                }
            } else {
                return errorResponse('NOT_FOUND', 'Cache directory not found');
            }
        } else if (key) {
            // Clear specific key/file
            const cachePath = path.join(process.cwd(), '.next', 'cache', key);
            if (fs.existsSync(cachePath)) {
                if (fs.lstatSync(cachePath).isDirectory()) {
                    deleteDirectory(cachePath);
                } else {
                    fs.unlinkSync(cachePath);
                }
                logger.info('Cache key cleared', { key, userId: auth.userId }, 'api-cache-clear');
                return successResponse({ message: 'Cache key cleared', key });
            } else {
                return errorResponse('NOT_FOUND', 'Cache key not found');
            }
        } else {
            // Clear all cache
            const cachePath = path.join(process.cwd(), '.next', 'cache');
            if (fs.existsSync(cachePath)) {
                const dirs = fs.readdirSync(cachePath);
                let cleared = 0;
                for (const dir of dirs) {
                    const dirPath = path.join(cachePath, dir);
                    if (deleteDirectory(dirPath)) {
                        cleared++;
                    }
                }
                logger.info('All cache cleared', { cleared, userId: auth.userId }, 'api-cache-clear');
                return successResponse({ message: 'All cache cleared', cleared });
            } else {
                return successResponse({ message: 'Cache directory does not exist', cleared: 0 });
            }
        }
    } catch (error: any) {
        logger.error('Failed to clear cache', error, 'api-cache-clear');
        return errorResponse('INTERNAL_ERROR', 'Failed to clear cache', error);
    }
}

