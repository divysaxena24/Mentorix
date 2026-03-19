/**
 * Simple in-memory rate limiter for API routes.
 * Uses a sliding window approach per IP address.
 * 
 * Note: This resets on server restart and is per-instance.
 * For production at scale, use Redis-based rate limiting.
 */

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes to prevent memory leaks
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitMap) {
        if (now > entry.resetTime) {
            rateLimitMap.delete(key);
        }
    }
}, 5 * 60 * 1000);

interface RateLimitConfig {
    /** Maximum number of requests allowed in the window */
    maxRequests: number;
    /** Time window in seconds */
    windowSeconds: number;
}

/** Default: 20 requests per minute */
const DEFAULT_CONFIG: RateLimitConfig = {
    maxRequests: 20,
    windowSeconds: 60,
};

/** Stricter limit for AI-heavy endpoints: 10 requests per minute */
export const AI_RATE_LIMIT: RateLimitConfig = {
    maxRequests: 10,
    windowSeconds: 60,
};

/** Generous limit for read-only endpoints: 60 requests per minute */
export const READ_RATE_LIMIT: RateLimitConfig = {
    maxRequests: 60,
    windowSeconds: 60,
};

/**
 * Check if a request should be rate-limited.
 * @param identifier - Usually the IP address or user email
 * @param config - Rate limit configuration
 * @returns { limited: boolean, remaining: number, resetIn: number }
 */
export function checkRateLimit(
    identifier: string,
    config: RateLimitConfig = DEFAULT_CONFIG
): { limited: boolean; remaining: number; resetIn: number } {
    const now = Date.now();
    const key = identifier;
    const entry = rateLimitMap.get(key);

    if (!entry || now > entry.resetTime) {
        // New window
        rateLimitMap.set(key, {
            count: 1,
            resetTime: now + config.windowSeconds * 1000,
        });
        return { limited: false, remaining: config.maxRequests - 1, resetIn: config.windowSeconds };
    }

    if (entry.count >= config.maxRequests) {
        const resetIn = Math.ceil((entry.resetTime - now) / 1000);
        return { limited: true, remaining: 0, resetIn };
    }

    entry.count++;
    const resetIn = Math.ceil((entry.resetTime - now) / 1000);
    return { limited: false, remaining: config.maxRequests - entry.count, resetIn };
}

/**
 * Extract IP address from a Next.js request.
 */
export function getRequestIP(req: Request): string {
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) {
        return forwarded.split(",")[0].trim();
    }
    const realIp = req.headers.get("x-real-ip");
    if (realIp) return realIp;
    return "unknown";
}
