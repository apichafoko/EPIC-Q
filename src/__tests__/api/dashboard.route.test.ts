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

jest.mock('@/lib/auth/simple-auth-service', () => ({
  SimpleAuthService: {
    verifyToken: jest.fn(async () => ({ id: 'u1', email: 'e@test.com', role: 'admin' })),
  },
}));

jest.mock('@/lib/services/dashboard-service', () => ({
  DashboardService: {
    getDashboardKPIs: jest.fn(async () => ({ totalHospitals: 1, activeHospitals: 1, totalCases: 0, averageCompletion: 0, activeAlerts: 0, trends: { totalHospitals: 0, activeHospitals: 0, totalCases: 0, averageCompletion: 0, activeAlerts: 0 } })),
    getHospitalsByStatus: jest.fn(async () => []),
    getAlertsByType: jest.fn(async () => []),
    getRecentAlerts: jest.fn(async () => []),
    getUpcomingRecruitment: jest.fn(async () => []),
  },
}));

describe('/api/dashboard', () => {
  it('GET retorna 200 con datos cuando el usuario está autenticado', async () => {
    const { GET } = await import('@/app/api/dashboard/route');
    const req = createMockRequest('http://localhost/api/dashboard', {
      cookies: { 'auth-token': 'fake-token' },
    });

    const res = await GET(req as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.kpis).toBeDefined();
  });
});
