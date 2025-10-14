/**
 * Simple in-memory rate limiting utility
 * For production, consider using Redis or a dedicated rate limiting service
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

/**
 * Rate limiting function
 * @param key - Unique identifier for the rate limit (e.g., IP address, user ID)
 * @param limit - Maximum number of requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns RateLimitResult
 */
export async function ratelimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = Date.now();
  const resetTime = now + windowMs;
  
  const entry = rateLimitStore.get(key);
  
  if (!entry || now > entry.resetTime) {
    // First request or window has expired
    rateLimitStore.set(key, {
      count: 1,
      resetTime,
    });
    
    return {
      success: true,
      remaining: limit - 1,
      resetTime,
    };
  }
  
  if (entry.count >= limit) {
    // Rate limit exceeded
    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000), // seconds
    };
  }
  
  // Increment counter
  entry.count++;
  rateLimitStore.set(key, entry);
  
  return {
    success: true,
    remaining: limit - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Reset rate limit for a specific key
 * @param key - The key to reset
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

/**
 * Get current rate limit status without incrementing
 * @param key - The key to check
 * @param limit - Maximum number of requests allowed
 * @returns Current status
 */
export function getRateLimitStatus(key: string, limit: number): {
  remaining: number;
  resetTime: number | null;
} {
  const entry = rateLimitStore.get(key);
  const now = Date.now();
  
  if (!entry || now > entry.resetTime) {
    return {
      remaining: limit,
      resetTime: null,
    };
  }
  
  return {
    remaining: Math.max(0, limit - entry.count),
    resetTime: entry.resetTime,
  };
}
