import { createMockRequest } from '../helpers/mock-request';

// Mock NextResponse antes de cualquier import
jest.mock('next/server', () => {
  class MockNextResponse extends Response {
    static json(body: any, init?: { status?: number }) {
      return new Response(JSON.stringify(body), {
        status: init?.status || 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
  
  return {
    NextRequest: class {},
    NextResponse: MockNextResponse,
  };
});

// Mock del middleware antes de importar rutas
jest.mock('@/lib/auth/middleware', () => ({
  withAdminAuth: (handler: any) => async (request: any) => {
    const mockContext = {
      user: {
        id: 'u1',
        email: 'e@test.com',
        name: 'Admin',
        role: 'admin' as const,
      },
    };
    try {
      return await handler(request, mockContext);
    } catch (error) {
      // Si hay error, devolver una respuesta de error
      return new Response(
        JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },
  AuthContext: {},
}));

// Mock del audit service
jest.mock('@/lib/audit-service', () => {
  const mockGetLogs = jest.fn(async () => ({
    logs: [],
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 0,
  }));
  
  const mockGetStatistics = jest.fn(async () => ({
    total: 0,
    byAction: {},
    byResource: {},
    byStatus: {},
    errors: 0,
    topUsers: [],
  }));
  
  const mockExportToCSV = jest.fn(async () => 'ID,Fecha\n');
  
  const mockExtractRequestInfo = jest.fn(() => ({
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent',
  }));

  return {
    AuditService: {
      getLogs: mockGetLogs,
      getStatistics: mockGetStatistics,
      exportToCSV: mockExportToCSV,
      extractRequestInfo: mockExtractRequestInfo,
    },
  };
});

// Mock del error handler
jest.mock('@/lib/error-handler', () => ({
  handleApiError: jest.fn(async (error: any, req: any, context?: any) => {
    const statusCode = error?.statusCode || 500;
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: statusCode, headers: { 'Content-Type': 'application/json' } }
    );
  }),
  errorHandler: {
    captureError: jest.fn(),
  },
}));


describe('audit api', () => {
  it('GET /api/audit retorna logs', async () => {
    const { GET } = await import('@/app/api/audit/route');
    const req = createMockRequest('http://localhost/api/audit', {
      cookies: { 'auth-token': 't' },
    });
    const res = await GET(req as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it('GET /api/audit/stats retorna estadísticas', async () => {
    const { GET } = await import('@/app/api/audit/stats/route');
    const req = createMockRequest('http://localhost/api/audit/stats', {
      cookies: { 'auth-token': 't' },
    });
    const res = await GET(req as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it('GET /api/audit/export retorna CSV', async () => {
    const { GET } = await import('@/app/api/audit/export/route');
    const req = createMockRequest('http://localhost/api/audit/export?format=csv', {
      cookies: { 'auth-token': 't' },
    });
    const res = await GET(req as any);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/csv');
    const text = await res.text();
    expect(text.startsWith('ID,Fecha')).toBe(true);
  });
});
