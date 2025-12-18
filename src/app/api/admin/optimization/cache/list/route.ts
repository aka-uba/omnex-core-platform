import { NextRequest } from 'next/server';
import { requireSuperAdmin } from '@/lib/middleware/superAdminMiddleware';
import { successResponse, errorResponse } from '@/lib/api/response';
import { logger } from '@/lib/utils/logger';
import fs from 'fs';
import path from 'path';
interface CacheDirectory {
    name: string;
    path: string;
    size: number;
    sizeFormatted: string;
    fileCount: number;
    lastModified: string;
}

interface CacheEntry {
    key: string;
    directory: string;
    size: number;
    sizeFormatted: string;
    ttl?: number;
    expiresAt?: string;
    type: 'file' | 'memory' | 'redis' | 'database';
    createdAt?: string;
}

/**
 * Format bytes to human readable size
 */
function formatBytes(bytes: number): string {
    if (!bytes || bytes === 0 || isNaN(bytes)) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get directory size recursively
 */
function getDirectorySize(dirPath: string, maxDepth: number = 5, currentDepth: number = 0): { size: number; fileCount: number } {
    let size = 0;
    let fileCount = 0;
    
    try {
        if (!fs.existsSync(dirPath) || currentDepth >= maxDepth) {
            return { size: 0, fileCount: 0 };
        }
        
        const files = fs.readdirSync(dirPath);
        
        for (const file of files) {
            try {
                const filePath = path.join(dirPath, file);
                const stat = fs.statSync(filePath);
                
                if (stat.isDirectory()) {
                    const subDir = getDirectorySize(filePath, maxDepth, currentDepth + 1);
                    size += subDir.size;
                    fileCount += subDir.fileCount;
                } else {
                    size += stat.size;
                    fileCount++;
                }
            } catch (error) {
                // Skip files/dirs we can't access
                continue;
            }
        }
    } catch (error) {
        logger.error('Error calculating directory size', { dirPath, error }, 'api-cache-list');
    }
    
    return { size, fileCount };
}

/**
 * Recursively list files in directory
 */
function listFilesRecursive(dirPath: string, basePath: string, maxDepth: number = 3, currentDepth: number = 0): CacheEntry[] {
    const entries: CacheEntry[] = [];
    
    if (currentDepth >= maxDepth) return entries;
    
    try {
        if (!fs.existsSync(dirPath)) {
            return entries;
        }
        
        const items = fs.readdirSync(dirPath, { withFileTypes: true });
        
        for (const item of items) {
            const fullPath = path.join(dirPath, item.name);
            const relativePath = path.relative(basePath, fullPath);
            
            try {
                if (item.isDirectory()) {
                    // Recursively scan subdirectories
                    const subEntries = listFilesRecursive(fullPath, basePath, maxDepth, currentDepth + 1);
                    entries.push(...subEntries);
                } else if (item.isFile()) {
                    const stats = fs.statSync(fullPath);
                    entries.push({
                        key: relativePath.replace(/\\/g, '/'),
                        directory: path.basename(path.dirname(relativePath)),
                        size: stats.size,
                        sizeFormatted: formatBytes(stats.size),
                        type: 'file',
                        createdAt: stats.birthtime.toISOString(),
                    });
                }
            } catch (error) {
                // Skip files/dirs we can't access
                continue;
            }
        }
    } catch (error) {
        logger.error('Error listing files', { dirPath, error }, 'api-cache-list');
    }
    
    return entries;
}

/**
 * GET /api/admin/optimization/cache/list
 * List all cache directories and entries
 */
export async function GET(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (auth instanceof Response) return auth;

    try {
        
        const cacheDirectories: CacheDirectory[] = [];
        const cacheEntries: CacheEntry[] = [];
        const cwd = process.cwd();
        
        // Base cache directories to check
        const baseCachePaths = [
            { name: 'Next.js Cache', basePath: path.join(cwd, '.next', 'cache') },
            { name: 'Next.js Dev Cache', basePath: path.join(cwd, '.next', 'dev') },
            { name: 'Node Modules Cache', basePath: path.join(cwd, 'node_modules', '.cache') },
            { name: 'Static Files', basePath: path.join(cwd, '.next', 'static') },
            { name: 'Build Output', basePath: path.join(cwd, '.next', 'server') },
        ];
        
        // Scan base cache directories
        for (const baseCache of baseCachePaths) {
            if (fs.existsSync(baseCache.basePath)) {
                try {
                    const stats = fs.statSync(baseCache.basePath);
                    const { size, fileCount } = getDirectorySize(baseCache.basePath);
                    
                    cacheDirectories.push({
                        name: baseCache.name,
                        path: baseCache.basePath,
                        size,
                        sizeFormatted: formatBytes(size),
                        fileCount,
                        lastModified: stats.mtime.toISOString(),
                    });
                    
                    // Always list entries for all directories
                    const entries = listFilesRecursive(baseCache.basePath, baseCache.basePath, 3);
                    cacheEntries.push(...entries.slice(0, 500)); // Limit to 500 entries
                } catch (error) {
                    logger.error('Error processing cache directory', { 
                        name: baseCache.name, 
                        error 
                    }, 'api-cache-list');
                }
            }
        }
        
        // Also scan .next/cache subdirectories if they exist
        const nextCachePath = path.join(cwd, '.next', 'cache');
        if (fs.existsSync(nextCachePath)) {
            try {
                const subDirs = fs.readdirSync(nextCachePath, { withFileTypes: true });
                for (const subDir of subDirs) {
                    if (subDir.isDirectory()) {
                        const subDirPath = path.join(nextCachePath, subDir.name);
                        const { size, fileCount } = getDirectorySize(subDirPath);
                        const stats = fs.statSync(subDirPath);
                        
                        if (size > 0 || fileCount > 0) {
                            cacheDirectories.push({
                                name: `${subDir.name} Cache`,
                                path: subDirPath,
                                size,
                                sizeFormatted: formatBytes(size),
                                fileCount,
                                lastModified: stats.mtime.toISOString(),
                            });
                        }
                    }
                }
            } catch (error) {
                logger.error('Error scanning .next/cache subdirectories', error, 'api-cache-list');
            }
        }
        
        // Scan .next/static subdirectories
        const nextStaticPath = path.join(cwd, '.next', 'static');
        if (fs.existsSync(nextStaticPath)) {
            try {
                const subDirs = fs.readdirSync(nextStaticPath, { withFileTypes: true });
                for (const subDir of subDirs) {
                    if (subDir.isDirectory()) {
                        const subDirPath = path.join(nextStaticPath, subDir.name);
                        const { size, fileCount } = getDirectorySize(subDirPath);
                        const stats = fs.statSync(subDirPath);
                        
                        if (size > 0 || fileCount > 0) {
                            cacheDirectories.push({
                                name: `Static ${subDir.name}`,
                                path: subDirPath,
                                size,
                                sizeFormatted: formatBytes(size),
                                fileCount,
                                lastModified: stats.mtime.toISOString(),
                            });
                        }
                    }
                }
            } catch (error) {
                logger.error('Error scanning .next/static subdirectories', error, 'api-cache-list');
            }
        }
        
        // Scan .next/dev subdirectories (development mode)
        const nextDevPath = path.join(cwd, '.next', 'dev');
        if (fs.existsSync(nextDevPath)) {
            try {
                const subDirs = fs.readdirSync(nextDevPath, { withFileTypes: true });
                for (const subDir of subDirs) {
                    if (subDir.isDirectory()) {
                        const subDirPath = path.join(nextDevPath, subDir.name);
                        const { size, fileCount } = getDirectorySize(subDirPath);
                        const stats = fs.statSync(subDirPath);
                        
                        if (size > 0 || fileCount > 0) {
                            cacheDirectories.push({
                                name: `Dev ${subDir.name}`,
                                path: subDirPath,
                                size,
                                sizeFormatted: formatBytes(size),
                                fileCount,
                                lastModified: stats.mtime.toISOString(),
                            });
                        }
                    }
                }
            } catch (error) {
                logger.error('Error scanning .next/dev subdirectories', error, 'api-cache-list');
            }
        }
        
        // Calculate total size
        const totalSize = cacheDirectories.reduce((sum, dir) => sum + dir.size, 0);
        const totalFiles = cacheDirectories.reduce((sum, dir) => sum + dir.fileCount, 0);
        
        return successResponse({
            directories: cacheDirectories,
            entries: cacheEntries,
            stats: {
                totalSize,
                totalSizeFormatted: formatBytes(totalSize),
                totalDirectories: cacheDirectories.length,
                totalFiles,
            },
        });
    } catch (error: any) {
        logger.error('Failed to list cache', error, 'api-cache-list');
        return errorResponse('INTERNAL_ERROR', 'Failed to list cache', error);
    }
}

