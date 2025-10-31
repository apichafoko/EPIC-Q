import { NextRequest } from 'next/server';

export interface RateLimitConfig {
  windowMs: number; // Ventana de tiempo en milisegundos
  maxRequests: number; // Máximo número de requests permitidos
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
  retryAfter?: number;
}

// Store in-memory para rate limiting
// En producción, usar Redis para persistencia entre instancias
class RateLimitStore {
  private store: Map<
    string,
    { count: number; resetTime: number }
  > = new Map();

  increment(key: string, windowMs: number): RateLimitResult {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetTime) {
      // Nueva ventana
      this.store.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });

      return {
        success: true,
        limit: 1,
        remaining: 1,
        reset: new Date(now + windowMs),
      };
    }

    // Incrementar contador
    entry.count++;

    return {
      success: true,
      limit: entry.count,
      remaining: entry.count,
      reset: new Date(entry.resetTime),
    };
  }

  check(key: string, maxRequests: number): RateLimitResult {
    const entry = this.store.get(key);
    const now = Date.now();

    if (!entry || now > entry.resetTime) {
      return {
        success: true,
        limit: maxRequests,
        remaining: maxRequests,
        reset: new Date(now),
      };
    }

    const remaining = Math.max(0, maxRequests - entry.count);
    const exceeded = entry.count >= maxRequests;

    return {
      success: !exceeded,
      limit: maxRequests,
      remaining,
      reset: new Date(entry.resetTime),
      retryAfter: exceeded ? Math.ceil((entry.resetTime - now) / 1000) : undefined,
    };
  }

  reset(key: string): void {
    this.store.delete(key);
  }

  // Limpiar entradas expiradas
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

const store = new RateLimitStore();

// Limpiar entradas expiradas cada 5 minutos
setInterval(() => store.cleanup(), 5 * 60 * 1000);

/**
 * Obtener clave única para rate limiting
 */
function getKey(
  request: NextRequest,
  identifier?: string
): string {
  // Usar IP address por defecto
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown';

  if (identifier) {
    return `${identifier}:${ip}`;
  }

  // Usar pathname para rate limiting por endpoint
  const pathname = new URL(request.url).pathname;
  return `${pathname}:${ip}`;
}

/**
 * Rate limiter middleware
 */
export async function rateLimit(
  request: NextRequest,
  config: RateLimitConfig
): Promise<{ allowed: boolean; result?: RateLimitResult }> {
  const key = getKey(request);
  
  // Incrementar contador
  const result = store.increment(key, config.windowMs);
  
  // Verificar límite
  const check = store.check(key, config.maxRequests);

  return {
    allowed: check.success,
    result: {
      ...check,
      limit: config.maxRequests,
    },
  };
}

/**
 * Rate limiter con identificación personalizada (ej: user ID)
 */
export async function rateLimitByIdentifier(
  request: NextRequest,
  identifier: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; result?: RateLimitResult }> {
  const key = getKey(request, identifier);
  
  const result = store.increment(key, config.windowMs);
  const check = store.check(key, config.maxRequests);

  return {
    allowed: check.success,
    result: {
      ...check,
      limit: config.maxRequests,
    },
  };
}

/**
 * Configuraciones predefinidas de rate limiting
 */
export const RateLimitConfigs = {
  // Límite general de API
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 100,
    message: 'Demasiadas solicitudes, intenta más tarde',
  },

  // Límite estricto para login
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 5,
    message: 'Demasiados intentos de login, intenta más tarde',
  },

  // Límite para endpoints de escritura
  write: {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 10,
    message: 'Demasiadas operaciones de escritura',
  },

  // Límite para exportación
  export: {
    windowMs: 60 * 60 * 1000, // 1 hora
    maxRequests: 5,
    message: 'Límite de exportaciones alcanzado',
  },

  // Límite para búsqueda
  search: {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 30,
    message: 'Demasiadas búsquedas',
  },
};

/**
 * Helper para crear respuesta de rate limit excedido
 */
export function createRateLimitResponse(
  result: RateLimitResult,
  message?: string
): Response {
  const headers = new Headers({
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.floor(result.reset.getTime() / 1000).toString(),
  });

  if (result.retryAfter) {
    headers.set('Retry-After', result.retryAfter.toString());
  }

  return Response.json(
    {
      error: 'Too Many Requests',
      message: message || 'Demasiadas solicitudes, intenta más tarde',
      retryAfter: result.retryAfter,
    },
    {
      status: 429,
      headers,
    }
  );
}


