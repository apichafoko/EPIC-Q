import { NextRequest, NextResponse } from 'next/server';
import {
  rateLimit,
  RateLimitConfigs,
  createRateLimitResponse,
} from '@/lib/security/rate-limiter';
import { SecurityLogger } from '@/lib/security/security-logger';

/**
 * Middleware helper para aplicar rate limiting a rutas API
 */
export async function withRateLimit(
  request: NextRequest,
  config: typeof RateLimitConfigs.api,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  const result = await rateLimit(request, config);

  if (!result.allowed) {
    // Log security event
    const pathname = new URL(request.url).pathname;
    await SecurityLogger.logRateLimitExceeded(
      request,
      pathname,
      config.maxRequests
    );

    return createRateLimitResponse(result.result!, config.message);
  }

  // Agregar headers de rate limit
  const response = await handler();
  
  if (result.result) {
    response.headers.set('X-RateLimit-Limit', result.result.limit.toString());
    response.headers.set('X-RateLimit-Remaining', result.result.remaining.toString());
    response.headers.set(
      'X-RateLimit-Reset',
      Math.floor(result.result.reset.getTime() / 1000).toString()
    );
  }

  return response;
}


