import { NextRequest } from 'next/server';
import { requireSuperAdmin } from '@/lib/middleware/superAdminMiddleware';
import { successResponse, errorResponse } from '@/lib/api/response';
import { logger } from '@/lib/utils/logger';
import { cacheManager } from '@/lib/cache/CacheManager';
import fs from 'fs';
import path from 'path';

/**
 * Delete directory contents (not the directory itself)
 */
function deleteDirectoryContents(dirPath: string): { deleted: number; failed: number } {
    let deleted = 0;
    let failed = 0;

    try {
        if (!fs.existsSync(dirPath)) {
            return { deleted: 0, failed: 0 };
        }

        const items = fs.readdirSync(dirPath);
        for (const item of items) {
            const curPath = path.join(dirPath, item);
            try {
                if (fs.lstatSync(curPath).isDirectory()) {
                    const result = deleteDirectoryRecursive(curPath);
                    deleted += result.deleted;
                    failed += result.failed;
                } else {
                    fs.unlinkSync(curPath);
                    deleted++;
                }
            } catch (error) {
                failed++;
                logger.warn('Failed to delete cache item', { path: curPath, error }, 'api-cache-clear');
            }
        }
    } catch (error) {
        logger.error('Error deleting directory contents', { dirPath, error }, 'api-cache-clear');
    }

    return { deleted, failed };
}

/**
 * Delete directory recursively
 */
function deleteDirectoryRecursive(dirPath: string): { deleted: number; failed: number } {
    let deleted = 0;
    let failed = 0;

    try {
        if (!fs.existsSync(dirPath)) {
            return { deleted: 0, failed: 0 };
        }

        const items = fs.readdirSync(dirPath);
        for (const item of items) {
            const curPath = path.join(dirPath, item);
            try {
                if (fs.lstatSync(curPath).isDirectory()) {
                    const result = deleteDirectoryRecursive(curPath);
                    deleted += result.deleted;
                    failed += result.failed;
                } else {
                    fs.unlinkSync(curPath);
                    deleted++;
                }
            } catch (error) {
                failed++;
            }
        }

        // Try to remove the directory itself
        try {
            fs.rmdirSync(dirPath);
        } catch (error) {
            // Directory not empty or in use - that's ok
        }
    } catch (error) {
        logger.error('Error deleting directory', { dirPath, error }, 'api-cache-clear');
    }

    return { deleted, failed };
}

/**
 * Delete directory recursively (legacy for single operations)
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
            // Clear all cache - both in-memory and file-based
            let totalDeleted = 0;
            let totalFailed = 0;

            // 1. Clear in-memory CacheManager
            try {
                cacheManager.clear();
                logger.info('In-memory cache cleared', { userId: auth.userId }, 'api-cache-clear');
            } catch (error) {
                logger.warn('Failed to clear in-memory cache', { error }, 'api-cache-clear');
            }

            // 2. Clear file-based cache directories
            const cwd = process.cwd();
            const cachePaths = [
                path.join(cwd, '.next', 'cache'),
                path.join(cwd, 'node_modules', '.cache'),
            ];

            for (const cachePath of cachePaths) {
                if (fs.existsSync(cachePath)) {
                    const result = deleteDirectoryContents(cachePath);
                    totalDeleted += result.deleted;
                    totalFailed += result.failed;
                }
            }

            logger.info('All cache cleared', {
                deleted: totalDeleted,
                failed: totalFailed,
                userId: auth.userId
            }, 'api-cache-clear');

            return successResponse({
                message: 'All cache cleared',
                deleted: totalDeleted,
                failed: totalFailed,
                inMemoryCleared: true
            });
        }
    } catch (error: any) {
        logger.error('Failed to clear cache', error, 'api-cache-clear');
        return errorResponse('INTERNAL_ERROR', 'Failed to clear cache', error);
    }
}

