import { prisma } from '@/lib/database';
import { DashboardService } from '@/lib/services/dashboard-service';

jest.mock('@/lib/database', () => ({
  prisma: {
    hospitals: { count: jest.fn() },
    alerts: { count: jest.fn() },
    case_metrics: { aggregate: jest.fn() },
  },
}));

describe('dashboard-service', () => {
  beforeEach(() => jest.clearAllMocks());

  it('getDashboardKPIs devuelve KPIs con valores por defecto si no hay datos', async () => {
    (prisma.hospitals.count as jest.Mock)
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(8); // activeHospitals
    (prisma.alerts.count as jest.Mock).mockResolvedValue(3);
    (prisma.case_metrics.aggregate as jest.Mock).mockResolvedValue({ _sum: { cases_created: null }, _avg: { completion_percentage: null } });

    const res = await DashboardService.getDashboardKPIs();

    expect(res.totalHospitals).toBe(10);
    expect(res.activeHospitals).toBe(8);
    expect(res.activeAlerts).toBe(3);
    expect(typeof res.totalCases).toBe('number');
    expect(typeof res.averageCompletion).toBe('number');
  });
});

