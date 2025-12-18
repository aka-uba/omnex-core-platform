/**
 * Rate Limiter Middleware
 * In-memory rate limiting for API endpoints
 * For production, consider using Redis-based rate limiting
 */

export interface RateLimitConfig {
    maxRequests: number;
    windowMs: number;
}

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

export class RateLimiter {
    private store: Map<string, RateLimitEntry>;
    private maxRequests: number;
    private windowMs: number;

    constructor(maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) {
        this.store = new Map();
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;

        // Cleanup expired entries every minute
        setInterval(() => this.cleanup(), 60 * 1000);
    }

    /**
     * Check if request is allowed
     * Returns { allowed: boolean, remaining: number, resetTime: number }
     */
    async check(identifier: string): Promise<{
        allowed: boolean;
        remaining: number;
        resetTime: number;
    }> {
        const now = Date.now();
        const entry = this.store.get(identifier);

        // No entry or expired entry
        if (!entry || now > entry.resetTime) {
            const resetTime = now + this.windowMs;
            this.store.set(identifier, {
                count: 1,
                resetTime,
            });

            return {
                allowed: true,
                remaining: this.maxRequests - 1,
                resetTime,
            };
        }

        // Increment count
        entry.count++;

        // Check if limit exceeded
        if (entry.count > this.maxRequests) {
            return {
                allowed: false,
                remaining: 0,
                resetTime: entry.resetTime,
            };
        }

        return {
            allowed: true,
            remaining: this.maxRequests - entry.count,
            resetTime: entry.resetTime,
        };
    }

    /**
     * Reset rate limit for identifier
     */
    reset(identifier: string): void {
        this.store.delete(identifier);
    }

    /**
     * Cleanup expired entries
     */
    private cleanup(): void {
        const now = Date.now();

        for (const [identifier, entry] of this.store.entries()) {
            if (now > entry.resetTime) {
                this.store.delete(identifier);
            }
        }
    }

    /**
     * Get current stats for identifier
     */
    getStats(identifier: string): {
        count: number;
        remaining: number;
        resetTime: number;
    } | null {
        const entry = this.store.get(identifier);

        if (!entry) {
            return null;
        }

        return {
            count: entry.count,
            remaining: Math.max(0, this.maxRequests - entry.count),
            resetTime: entry.resetTime,
        };
    }
}

// Global rate limiter instances
const globalRateLimiter = new RateLimiter(
    parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') // 15 minutes
);

const authRateLimiter = new RateLimiter(10, 15 * 60 * 1000); // 10 requests per 15 minutes for auth endpoints

export { globalRateLimiter, authRateLimiter };
