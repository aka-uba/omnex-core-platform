import { ModuleRecord } from './types';

export interface ModuleHealth {
    status: 'healthy' | 'unhealthy' | 'unknown';
    lastCheck: Date;
    message?: string;
}

export interface ModulePerformance {
    uptime: number;
    memoryUsage?: number;
    apiLatency?: number;
}

export class ModuleStatusMonitor {
    private healthStatus: Map<string, ModuleHealth> = new Map();
    private performanceMetrics: Map<string, ModulePerformance> = new Map();

    async checkHealth(module: ModuleRecord): Promise<ModuleHealth> {
        try {
            // Basic check: is the module active?
            if (module.status !== 'active') {
                return {
                    status: 'unknown',
                    lastCheck: new Date(),
                    message: 'Module is not active'
                };
            }

            // Check if API routes are responsive (if any)
            if (module.metadata?.api?.routes?.length) {
                // In a real implementation, we might ping a health endpoint
                // For now, we assume healthy if active
            }

            const health: ModuleHealth = {
                status: 'healthy',
                lastCheck: new Date()
            };

            this.healthStatus.set(module.slug, health);
            return health;
        } catch (error) {
            const health: ModuleHealth = {
                status: 'unhealthy',
                lastCheck: new Date(),
                message: error instanceof Error ? error.message : 'Unknown error'
            };
            this.healthStatus.set(module.slug, health);
            return health;
        }
    }

    getHealth(slug: string): ModuleHealth | undefined {
        return this.healthStatus.get(slug);
    }

    updatePerformance(slug: string, metrics: Partial<ModulePerformance>) {
        const current = this.performanceMetrics.get(slug) || { uptime: 0 };
        this.performanceMetrics.set(slug, { ...current, ...metrics });
    }

    getPerformance(slug: string): ModulePerformance | undefined {
        return this.performanceMetrics.get(slug);
    }
}
