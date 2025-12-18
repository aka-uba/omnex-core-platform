/**
 * System Metrics API
 */

import { NextRequest } from 'next/server';
import { requireSuperAdmin } from '@/lib/middleware/superAdminMiddleware';
import { successResponse, errorResponse } from '@/lib/api/response';
import { recordSystemMetrics } from '@/lib/services/systemMonitorService';
export async function GET(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (auth instanceof Response) return auth;

    try {
        // Get current resource usage
        const { getResourceUsage } = await import('@/lib/services/systemMonitorService');
        const usage = await getResourceUsage();
        
        // Calculate response time (mock for now - can be enhanced with actual tracking)
        const responseTime = Math.floor(Math.random() * 100) + 50; // 50-150ms
        
        // Calculate requests per second (mock for now - can be enhanced with actual tracking)
        const requestsPerSecond = Math.floor(Math.random() * 10) + 1; // 1-10 req/s
        
        // Active connections (mock for now - can be enhanced with actual tracking)
        const activeConnections = Math.floor(Math.random() * 50) + 10; // 10-60 connections
        
        // Return performance metrics in expected format
        return successResponse({
            cpuUsage: usage.cpuUsage || 0,
            memoryUsage: usage.memoryUsage || 0,
            diskUsage: usage.diskUsage || 0,
            responseTime: responseTime,
            requestsPerSecond: requestsPerSecond,
            activeConnections: activeConnections,
        });
    } catch (error) {
        return errorResponse('INTERNAL_ERROR', 'Failed to get metrics', error);
    }
}

// Endpoint to trigger metric recording (could be called by cron)
export async function POST(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (auth instanceof Response) return auth;

    try {
        await recordSystemMetrics();
        return successResponse({ success: true });
    } catch (error) {
        return errorResponse('INTERNAL_ERROR', 'Failed to record metrics', error);
    }
}
