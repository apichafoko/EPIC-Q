import { NextRequest } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxAttempts: number; // Maximum attempts per window
  blockDurationMs: number; // How long to block after max attempts
}

interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  blockedUntil?: number;
}

// In-memory store (in production, use Redis or similar)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Default configurations
const RATE_LIMITS = {
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxAttempts: 5,
    blockDurationMs: 30 * 60 * 1000, // 30 minutes
  },
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxAttempts: 3,
    blockDurationMs: 2 * 60 * 60 * 1000, // 2 hours
  },
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxAttempts: 100,
    blockDurationMs: 60 * 60 * 1000, // 1 hour
  },
} as const;

export class RateLimiter {
  private config: RateLimitConfig;
  private store: Map<string, RateLimitEntry>;

  constructor(config: RateLimitConfig) {
    this.config = config;
    this.store = rateLimitStore;
  }

  private getKey(identifier: string, type: string): string {
    return `${type}:${identifier}`;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now - entry.firstAttempt > this.config.windowMs) {
        this.store.delete(key);
      }
    }
  }

  isAllowed(identifier: string, type: string): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  } {
    this.cleanup();
    
    const key = this.getKey(identifier, type);
    const now = Date.now();
    const entry = this.store.get(key);

    // If no entry exists, create one
    if (!entry) {
      this.store.set(key, {
        count: 1,
        firstAttempt: now,
      });
      return {
        allowed: true,
        remaining: this.config.maxAttempts - 1,
        resetTime: now + this.config.windowMs,
      };
    }

    // Check if currently blocked
    if (entry.blockedUntil && now < entry.blockedUntil) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.blockedUntil,
        retryAfter: Math.ceil((entry.blockedUntil - now) / 1000),
      };
    }

    // Check if window has expired
    if (now - entry.firstAttempt > this.config.windowMs) {
      this.store.set(key, {
        count: 1,
        firstAttempt: now,
      });
      return {
        allowed: true,
        remaining: this.config.maxAttempts - 1,
        resetTime: now + this.config.windowMs,
      };
    }

    // Check if max attempts reached
    if (entry.count >= this.config.maxAttempts) {
      const blockedUntil = now + this.config.blockDurationMs;
      this.store.set(key, {
        ...entry,
        blockedUntil,
      });
      return {
        allowed: false,
        remaining: 0,
        resetTime: blockedUntil,
        retryAfter: Math.ceil(this.config.blockDurationMs / 1000),
      };
    }

    // Increment count
    this.store.set(key, {
      ...entry,
      count: entry.count + 1,
    });

    return {
      allowed: true,
      remaining: this.config.maxAttempts - entry.count - 1,
      resetTime: entry.firstAttempt + this.config.windowMs,
    };
  }

  reset(identifier: string, type: string): void {
    const key = this.getKey(identifier, type);
    this.store.delete(key);
  }
}

// Create rate limiter instances
export const loginRateLimiter = new RateLimiter(RATE_LIMITS.login);
export const passwordResetRateLimiter = new RateLimiter(RATE_LIMITS.passwordReset);
export const apiRateLimiter = new RateLimiter(RATE_LIMITS.api);

// Helper function to get client identifier
export function getClientIdentifier(request: NextRequest): string {
  // Try to get real IP from headers (for production with reverse proxy)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';
  
  return ip;
}

// Middleware helper for API routes
export function withRateLimit(
  rateLimiter: RateLimiter,
  type: string,
  getIdentifier: (request: NextRequest) => string = getClientIdentifier
) {
  return (request: NextRequest) => {
    const identifier = getIdentifier(request);
    const result = rateLimiter.isAllowed(identifier, type);
    
    if (!result.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          retryAfter: result.retryAfter,
          resetTime: result.resetTime,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': result.retryAfter?.toString() || '60',
            'X-RateLimit-Limit': rateLimiter['config'].maxAttempts.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.resetTime.toString(),
          },
        }
      );
    }
    
    return null; // No rate limit exceeded
  };
}
