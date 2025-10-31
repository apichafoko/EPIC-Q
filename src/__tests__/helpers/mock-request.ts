/**
 * Helper para crear mocks de NextRequest que funcionen en Jest
 */
export function createMockRequest(
  url: string,
  options?: {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
    cookies?: Record<string, string>;
  }
): any {
  const method = options?.method || 'GET';
  const headers = new Headers(options?.headers || {});
  
  // Mock de cookies
  const cookieMap = new Map<string, string>();
  if (options?.cookies) {
    Object.entries(options.cookies).forEach(([key, value]) => {
      cookieMap.set(key, value);
    });
  }

  const mockRequest = {
    url,
    method,
    headers,
    cookies: {
      get: (name: string) => {
        const value = cookieMap.get(name);
        return value ? { value } : undefined;
      },
      set: (name: string, value: string) => {
        cookieMap.set(name, value);
      },
      has: (name: string) => cookieMap.has(name),
      delete: (name: string) => cookieMap.delete(name),
      getAll: () => Array.from(cookieMap.entries()).map(([name, value]) => ({ name, value })),
    },
    json: async () => options?.body || {},
    text: async () => typeof options?.body === 'string' ? options?.body : JSON.stringify(options?.body || {}),
    formData: async () => new FormData(),
    clone: () => mockRequest,
    nextUrl: new URL(url),
    body: options?.body,
    bodyUsed: false,
    cache: 'default' as RequestCache,
    credentials: 'same-origin' as RequestCredentials,
    destination: 'document',
    integrity: '',
    keepalive: false,
    mode: 'cors' as RequestMode,
    redirect: 'follow' as RequestRedirect,
    referrer: '',
    referrerPolicy: 'no-referrer' as ReferrerPolicy,
    signal: null as AbortSignal | null,
  };

  return mockRequest;
}

/**
 * Helper para crear un Response mock
 */
export function createMockResponse(body: any, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    status: init?.status || 200,
    statusText: init?.statusText || 'OK',
    headers: init?.headers || { 'Content-Type': 'application/json' },
  });
}


