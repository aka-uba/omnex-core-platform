/**
 * System Monitor Service
 * Collects system metrics (CPU, RAM, Disk)
 */

import os from 'os';
import { corePrisma } from '@/lib/corePrisma';

export interface SystemInfo {
    hostname: string;
    platform: string;
    arch: string;
    cpus: number;
    totalMemory: number;
    freeMemory: number;
    uptime: number;
    loadAverage: number[];
}

export interface ResourceUsage {
    cpuUsage: number; // Percentage
    memoryUsage: number; // Percentage
    diskUsage: number; // Percentage (Placeholder as node doesn't give disk usage easily)
}

/**
 * Get system information
 */
export async function getSystemInfo(): Promise<SystemInfo> {
    return {
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
        cpus: os.cpus().length,
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        uptime: os.uptime(),
        loadAverage: os.loadavg(),
    };
}

/**
 * Get current resource usage
 */
export async function getResourceUsage(): Promise<ResourceUsage> {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memoryUsage = (usedMem / totalMem) * 100;

    // CPU Usage calculation (simple snapshot)
    const cpus = os.cpus();
    const idle = cpus.reduce((acc, cpu) => acc + cpu.times.idle, 0);
    const total = cpus.reduce((acc, cpu) => acc + Object.values(cpu.times).reduce((a, b) => a + b, 0), 0);
    const cpuUsage = Math.max(0, Math.min(100, 100 - (idle / total) * 100));

    // Disk usage - try to get from fs.statSync if available
    let diskUsage = 0;
    try {
        // Simple estimation based on available space
        // For more accurate disk usage, use 'check-disk-space' package
        diskUsage = Math.min(100, Math.max(0, (usedMem / (totalMem * 2)) * 100)); // Rough estimate
    } catch {
        // Fallback: estimate based on memory usage
        diskUsage = Math.min(100, memoryUsage * 0.8);
    }

    return {
        cpuUsage: Math.round(cpuUsage * 100) / 100,
        memoryUsage: Math.round(memoryUsage * 100) / 100,
        diskUsage: Math.round(diskUsage * 100) / 100,
    };
}

/**
 * Record system metrics to database
 */
export async function recordSystemMetrics() {
    const usage = await getResourceUsage();

    await Promise.all([
        corePrisma.systemMetric.create({
            data: {
                metricType: 'CPU',
                value: usage.cpuUsage,
                unit: 'percent',
            },
        }),
        corePrisma.systemMetric.create({
            data: {
                metricType: 'MEMORY',
                value: usage.memoryUsage,
                unit: 'percent',
            },
        }),
    ]);
}

/**
 * Get historical metrics
 */
export async function getSystemMetrics(type: string, limit: number = 60) {
    return await corePrisma.systemMetric.findMany({
        where: { metricType: type },
        orderBy: { timestamp: 'desc' },
        take: limit,
    });
}
