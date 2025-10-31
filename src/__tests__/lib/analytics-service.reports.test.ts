import { AnalyticsService } from '@/lib/services/analytics-service';
import prisma from '@/lib/db-connection';

// Mock de Prisma
jest.mock('@/lib/db-connection', () => ({
  __esModule: true,
  default: {
    hospital_progress: {
      findMany: jest.fn(),
    },
    case_metrics: {
      findMany: jest.fn(),
    },
    project_hospitals: {
      findMany: jest.fn(),
    },
    hospitals: {
      findMany: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('AnalyticsService - Report Methods', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getHospitalProgress', () => {
    it('debe retornar datos de progreso por hospital', async () => {
      const mockProgress = [
        {
          hospital_id: 'h1',
          project_id: 'p1',
          progress_percentage: 75,
          status: 'active',
          ethics_submitted: true,
          ethics_approved: true,
          hospitals: {
            id: 'h1',
            name: 'Hospital Test',
            province: 'Buenos Aires',
          },
          project_hospitals: {
            projects: {
              required_periods: 3,
            },
            recruitment_periods: [
              {
                period_number: 1,
                case_load_statistics: [
                  {
                    cases_expected: 100,
                    cases_loaded: 75,
                  },
                ],
              },
            ],
          },
        },
      ];

      const mockMetrics = [
        {
          hospital_id: 'h1',
          cases_created: 75,
          completion_percentage: 80,
          recorded_date: new Date('2024-01-15'),
        },
      ];

      mockPrisma.hospital_progress.findMany.mockResolvedValue(mockProgress as any);
      mockPrisma.case_metrics.findMany.mockResolvedValue(mockMetrics as any);

      const result = await AnalyticsService.getHospitalProgress('p1');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        hospitalId: 'h1',
        hospitalName: 'Hospital Test',
        province: 'Buenos Aires',
        progressPercentage: 75,
        casesCreated: 75,
        completionPercentage: 80,
        status: 'active',
        ethicsSubmitted: true,
        ethicsApproved: true,
        targetCases: 100,
        currentPeriod: 1,
        totalPeriods: 3,
      });
    });

    it('debe filtrar por provincia cuando se especifica', async () => {
      mockPrisma.hospital_progress.findMany.mockResolvedValue([]);
      mockPrisma.case_metrics.findMany.mockResolvedValue([]);

      await AnalyticsService.getHospitalProgress('p1', { province: 'Córdoba' });

      expect(mockPrisma.hospital_progress.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            hospitals: {
              province: 'Córdoba',
            },
          }),
        })
      );
    });
  });

  describe('getRecruitmentVelocity', () => {
    it('debe calcular velocidad de reclutamiento por día', async () => {
      const mockMetrics = [
        {
          hospital_id: 'h1',
          recorded_date: new Date('2024-01-01'),
          cases_created: 10,
          hospitals: {
            id: 'h1',
            name: 'Hospital Test',
            province: 'Buenos Aires',
          },
        },
        {
          hospital_id: 'h1',
          recorded_date: new Date('2024-01-02'),
          cases_created: 15,
          hospitals: {
            id: 'h1',
            name: 'Hospital Test',
            province: 'Buenos Aires',
          },
        },
      ];

      mockPrisma.project_hospitals.findMany.mockResolvedValue([
        { hospital_id: 'h1' },
      ] as any);
      mockPrisma.case_metrics.findMany.mockResolvedValue(mockMetrics as any);

      const result = await AnalyticsService.getRecruitmentVelocity('p1', {
        granularity: 'day',
      });

      expect(result).toHaveLength(2);
      expect(result[0].cumulativeCases).toBe(10);
      expect(result[1].cumulativeCases).toBe(25);
      expect(result[0].velocity).toBe(10); // 10 casos / 1 día
      expect(result[1].velocity).toBe(15); // 15 casos / 1 día
    });

    it('debe agrupar por semana cuando se especifica granularity=week', async () => {
      const mockMetrics = [
        {
          hospital_id: 'h1',
          recorded_date: new Date('2024-01-01'), // Lunes
          cases_created: 5,
          hospitals: { id: 'h1', name: 'H1', province: 'BA' },
        },
        {
          hospital_id: 'h1',
          recorded_date: new Date('2024-01-03'), // Miércoles (misma semana)
          cases_created: 10,
          hospitals: { id: 'h1', name: 'H1', province: 'BA' },
        },
      ];

      mockPrisma.project_hospitals.findMany.mockResolvedValue([
        { hospital_id: 'h1' },
      ] as any);
      mockPrisma.case_metrics.findMany.mockResolvedValue(mockMetrics as any);

      const result = await AnalyticsService.getRecruitmentVelocity('p1', {
        granularity: 'week',
      });

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].casesCreated).toBe(15); // Suma de la semana
    });
  });

  describe('getProvinceComparison', () => {
    it('debe comparar provincias correctamente', async () => {
      const mockProgress = [
        {
          hospital_id: 'h1',
          project_id: 'p1',
          progress_percentage: 80,
          hospitals: {
            id: 'h1',
            name: 'H1',
            province: 'Buenos Aires',
            status: 'active',
          },
          project_hospitals: {
            recruitment_periods: [
              {
                case_load_statistics: [
                  { cases_expected: 100, cases_loaded: 80 },
                ],
              },
            ],
          },
        },
        {
          hospital_id: 'h2',
          project_id: 'p1',
          progress_percentage: 60,
          hospitals: {
            id: 'h2',
            name: 'H2',
            province: 'Córdoba',
            status: 'active',
          },
          project_hospitals: {
            recruitment_periods: [],
          },
        },
      ];

      const mockMetrics = [
        {
          hospital_id: 'h1',
          cases_created: 80,
          completion_percentage: 85,
        },
        {
          hospital_id: 'h2',
          cases_created: 60,
          completion_percentage: 70,
        },
      ];

      mockPrisma.hospital_progress.findMany.mockResolvedValue(mockProgress as any);
      mockPrisma.case_metrics.findMany.mockResolvedValue(mockMetrics as any);

      const result = await AnalyticsService.getProvinceComparison('p1');

      expect(result.length).toBeGreaterThanOrEqual(2);
      const buenosAires = result.find((r) => r.province === 'Buenos Aires');
      expect(buenosAires).toMatchObject({
        hospitalCount: 1,
        totalCases: 80,
        averageProgress: 80,
        activeHospitals: 1,
      });
    });
  });

  describe('getCompletionPrediction', () => {
    it('debe predecir fecha de finalización a nivel global', async () => {
      const mockProgress = [
        {
          hospital_id: 'h1',
          project_id: 'p1',
          progress_percentage: 50,
          hospitals: {
            id: 'h1',
            name: 'H1',
            province: 'BA',
          },
        },
      ];

      const mockHistorical = [
        {
          hospital_id: 'h1',
          recorded_date: new Date('2024-01-01'),
          completion_percentage: 30,
        },
        {
          hospital_id: 'h1',
          recorded_date: new Date('2024-01-15'),
          completion_percentage: 50,
        },
      ];

      mockPrisma.hospital_progress.findMany.mockResolvedValue(mockProgress as any);
      mockPrisma.case_metrics.findMany.mockResolvedValue(mockHistorical as any);

      const result = await AnalyticsService.getCompletionPrediction('p1', {
        level: 'global',
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        entityName: 'Global',
        currentProgress: 50,
        targetProgress: 100,
      });
      expect(result[0].confidence).toBeDefined();
      expect(result[0].trend).toBeDefined();
    });

    it('debe predecir a nivel hospital cuando se especifica', async () => {
      const mockProgress = [
        {
          hospital_id: 'h1',
          project_id: 'p1',
          progress_percentage: 70,
          hospitals: {
            id: 'h1',
            name: 'Hospital Test',
            province: 'BA',
          },
        },
      ];

      const mockHistorical = [
        {
          hospital_id: 'h1',
          recorded_date: new Date('2024-01-01'),
          completion_percentage: 50,
        },
        {
          hospital_id: 'h1',
          recorded_date: new Date('2024-01-20'),
          completion_percentage: 70,
        },
      ];

      mockPrisma.hospital_progress.findMany.mockResolvedValue(mockProgress as any);
      mockPrisma.case_metrics.findMany.mockResolvedValue(mockHistorical as any);

      const result = await AnalyticsService.getCompletionPrediction('p1', {
        level: 'hospital',
      });

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toMatchObject({
        entityId: 'h1',
        entityName: 'Hospital Test',
        currentProgress: 70,
        targetProgress: 100,
      });
    });
  });
});

