import prisma from '../db-connection';

export interface TrendData {
  date: string;
  value: number;
  label?: string;
}

export interface HeatmapData {
  hospitalId: string;
  hospitalName: string;
  province: string;
  value: number;
  category: string;
}

export interface BubbleChartData {
  x: number;
  y: number;
  size: number;
  label: string;
  category: string;
}

export interface PerformanceMetrics {
  coordinatorId: string;
  coordinatorName: string;
  casesCreated: number;
  averageCompletion: number;
  responseTime: number; // en horas
  alertResolutionRate: number;
}

export interface AnalyticsFilters {
  projectId?: string;
  hospitalId?: string;
  province?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export class AnalyticsService {
  /**
   * Obtener tendencias temporales de casos
   */
  static async getCaseTrends(
    filters?: AnalyticsFilters
  ): Promise<TrendData[]> {
    const where: any = {};

    if (filters?.dateFrom || filters?.dateTo) {
      where.recorded_date = {};
      if (filters.dateFrom) {
        where.recorded_date.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.recorded_date.lte = filters.dateTo;
      }
    }

    if (filters?.hospitalId) {
      where.hospital_id = filters.hospitalId;
    }

    if (filters?.projectId) {
      where.project_id = filters.projectId;
    }

    const metrics = await prisma.case_metrics.findMany({
      where,
      orderBy: { recorded_date: 'asc' },
      include: {
        hospitals: {
          select: { name: true, province: true },
        },
      },
    });

    return metrics.map((m) => ({
      date: m.recorded_date.toISOString().split('T')[0],
      value: m.cases_created || 0,
      label: m.hospitals?.name,
    }));
  }

  /**
   * Obtener tendencias de completitud
   */
  static async getCompletionTrends(
    filters?: AnalyticsFilters
  ): Promise<TrendData[]> {
    const where: any = {};

    if (filters?.dateFrom || filters?.dateTo) {
      where.recorded_date = {};
      if (filters.dateFrom) {
        where.recorded_date.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.recorded_date.lte = filters.dateTo;
      }
    }

    if (filters?.hospitalId) {
      where.hospital_id = filters.hospitalId;
    }

    if (filters?.projectId) {
      where.project_id = filters.projectId;
    }

    const metrics = await prisma.case_metrics.findMany({
      where,
      orderBy: { recorded_date: 'asc' },
    });

    return metrics.map((m) => ({
      date: m.recorded_date.toISOString().split('T')[0],
      value: m.completion_percentage || 0,
    }));
  }

  /**
   * Obtener heatmap de actividad por hospital/provincia
   */
  static async getActivityHeatmap(
    filters?: AnalyticsFilters
  ): Promise<HeatmapData[]> {
    const where: any = {};

    if (filters?.province) {
      where.province = filters.province;
    }

    if (filters?.projectId) {
      // Si hay projectId, necesitamos filtrar por hospitales del proyecto
      // Esto requiere una consulta más compleja
    }

    const hospitals = await prisma.hospitals.findMany({
      where,
      include: {
        hospital_progress: true,
        case_metrics: {
          take: 1,
          orderBy: { recorded_date: 'desc' },
        },
      },
    });

    return hospitals.map((h) => {
      const progress = h.hospital_progress?.[0];
      const metrics = h.case_metrics?.[0];

      // Calcular valor de actividad combinado
      const progressValue = progress?.progress_percentage || 0;
      const casesValue = metrics?.cases_created || 0;
      const completionValue = metrics?.completion_percentage || 0;

      // Score combinado (normalizado 0-100)
      const activityScore =
        (progressValue * 0.4 + completionValue * 0.3 + (casesValue > 0 ? 30 : 0));

      return {
        hospitalId: h.id,
        hospitalName: h.name || 'Unknown',
        province: h.province || 'Unknown',
        value: Math.round(activityScore),
        category: this.getActivityCategory(activityScore),
      };
    });
  }

  /**
   * Obtener datos para gráfico de burbujas
   */
  static async getBubbleChartData(
    filters?: AnalyticsFilters
  ): Promise<BubbleChartData[]> {
    const where: any = {};

    if (filters?.province) {
      where.province = filters.province;
    }

    if (filters?.projectId) {
      where.projects = {
        some: { id: filters.projectId },
      };
    }

    const hospitals = await prisma.hospitals.findMany({
      where,
      include: {
        hospital_progress: true,
        case_metrics: {
          take: 1,
          orderBy: { recorded_date: 'desc' },
        },
      },
    });

    return hospitals.map((h) => {
      const progress = h.hospital_progress?.[0];
      const metrics = h.case_metrics?.[0];

      return {
        x: progress?.progress_percentage || 0,
        y: metrics?.completion_percentage || 0,
        size: metrics?.cases_created || 0,
        label: h.name || 'Unknown',
        category: h.province || 'Unknown',
      };
    });
  }

  /**
   * Obtener métricas de performance de coordinadores
   */
  static async getCoordinatorPerformance(
    filters?: AnalyticsFilters
  ): Promise<PerformanceMetrics[]> {
    const where: any = { role: 'coordinator' };

    const coordinators = await prisma.users.findMany({
      where,
      include: {
        communications: {
          where: filters?.dateFrom || filters?.dateTo
            ? {
                created_at: {
                  ...(filters.dateFrom && { gte: filters.dateFrom }),
                  ...(filters.dateTo && { lte: filters.dateTo }),
                },
              }
            : undefined,
        },
        hospitals: {
          include: {
            case_metrics: {
              take: 1,
              orderBy: { recorded_date: 'desc' },
            },
          },
        },
      },
    });

    return coordinators.map((coord) => {
      const cases = coord.hospitals?.case_metrics?.[0] || null;

      // Calcular tiempo promedio de respuesta (simplificado)
      const communications = coord.communications || [];
      const responseTime = communications.length > 0
        ? communications.reduce((acc, comm) => {
            // Aquí deberías calcular el tiempo real de respuesta
            // Por ahora, usamos un valor estimado
            return acc + 24; // 24 horas promedio
          }, 0) / communications.length
        : 0;

      // Calcular tasa de resolución de alertas
      // Esto requeriría una relación con alerts que debería agregarse
      const alertResolutionRate = 85; // Placeholder

      return {
        coordinatorId: coord.id,
        coordinatorName: coord.name || 'Unknown',
        casesCreated: cases?.cases_created || 0,
        averageCompletion: cases?.completion_percentage || 0,
        responseTime: Math.round(responseTime),
        alertResolutionRate,
      };
    });
  }

  /**
   * Obtener predicciones basadas en tendencias
   */
  static async getPredictions(
    metricType: 'cases' | 'completion',
    days: number = 30
  ): Promise<TrendData[]> {
    // Obtener datos históricos
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90); // Últimos 90 días

    const filters: AnalyticsFilters = {
      dateFrom: startDate,
      dateTo: endDate,
    };

    const historicalData =
      metricType === 'cases'
        ? await this.getCaseTrends(filters)
        : await this.getCompletionTrends(filters);

    // Calcular promedio de crecimiento
    if (historicalData.length < 2) {
      return [];
    }

    const growthRate =
      (historicalData[historicalData.length - 1].value -
        historicalData[0].value) /
      historicalData.length;

    // Generar predicciones
    const predictions: TrendData[] = [];
    const lastValue = historicalData[historicalData.length - 1].value;
    const lastDate = new Date(historicalData[historicalData.length - 1].date);

    for (let i = 1; i <= days; i++) {
      const date = new Date(lastDate);
      date.setDate(date.getDate() + i);

      const predictedValue = Math.max(
        0,
        lastValue + growthRate * (historicalData.length + i)
      );

      predictions.push({
        date: date.toISOString().split('T')[0],
        value: Math.round(predictedValue),
      });
    }

    return predictions;
  }

  /**
   * Obtener distribución geográfica de métricas
   */
  static async getGeographicDistribution(
    metricType: 'cases' | 'progress' | 'alerts'
  ): Promise<{ province: string; value: number; count: number }[]> {
    const hospitals = await prisma.hospitals.findMany({
      include: {
        hospital_progress: true,
        case_metrics: {
          take: 1,
          orderBy: { recorded_date: 'desc' },
        },
        alerts: {
          where: { is_resolved: false },
        },
      },
    });

    const provinceMap = new Map<
      string,
      { value: number; count: number }
    >();

    hospitals.forEach((h) => {
      const province = h.province || 'Unknown';
      const existing = provinceMap.get(province) || { value: 0, count: 0 };

      let value = 0;
      switch (metricType) {
        case 'cases':
          value = h.case_metrics?.[0]?.cases_created || 0;
          break;
        case 'progress':
          value = h.hospital_progress?.[0]?.progress_percentage || 0;
          break;
        case 'alerts':
          value = h.alerts?.length || 0;
          break;
      }

      provinceMap.set(province, {
        value: existing.value + value,
        count: existing.count + 1,
      });
    });

    return Array.from(provinceMap.entries()).map(([province, data]) => ({
      province,
      value: data.value,
      count: data.count,
    }));
  }

  /**
   * Categorizar nivel de actividad
   */
  private static getActivityCategory(score: number): string {
    if (score >= 80) return 'high';
    if (score >= 50) return 'medium';
    if (score >= 20) return 'low';
    return 'inactive';
  }

  /**
   * Obtener estado de avance por hospital
   */
  static async getHospitalProgress(
    projectId?: string,
    filters?: AnalyticsFilters
  ): Promise<Array<{
    hospitalId: string;
    hospitalName: string;
    province: string;
    progressPercentage: number;
    casesCreated: number;
    completionPercentage: number;
    status: string;
    ethicsSubmitted: boolean;
    ethicsApproved: boolean;
    lastActivity?: string;
    targetCases?: number;
    currentPeriod?: number;
    totalPeriods?: number;
  }>> {
    const where: any = {};

    if (projectId) {
      where.project_id = projectId;
    }

    if (filters?.hospitalId) {
      where.hospital_id = filters.hospitalId;
    }

    if (filters?.province) {
      where.hospitals = {
        province: filters.province,
      };
    }

    const progressData = await prisma.hospital_progress.findMany({
      where,
      include: {
        hospitals: {
          select: {
            id: true,
            name: true,
            province: true,
          },
        },
        project_hospitals: {
          include: {
            projects: {
              select: {
                required_periods: true,
              },
            },
            recruitment_periods: {
              orderBy: { period_number: 'desc' },
              take: 1,
              include: {
                case_load_statistics: {
                  orderBy: { updated_at: 'desc' },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    // Obtener métricas de casos más recientes
    const hospitalIds = progressData.map((p) => p.hospital_id);
    const caseMetrics = await prisma.case_metrics.findMany({
      where: {
        hospital_id: { in: hospitalIds },
      },
      orderBy: { recorded_date: 'desc' },
      distinct: ['hospital_id'],
    });

    const metricsMap = new Map(
      caseMetrics.map((m) => [m.hospital_id, m])
    );

    return progressData.map((progress) => {
      const hospital = progress.hospitals;
      const metrics = metricsMap.get(progress.hospital_id);
      const projectHospital = progress.project_hospitals;
      const currentPeriod = projectHospital?.recruitment_periods?.[0];
      const stats = currentPeriod?.case_load_statistics?.[0];

      return {
        hospitalId: progress.hospital_id,
        hospitalName: hospital?.name || 'Unknown',
        province: hospital?.province || 'Unknown',
        progressPercentage: progress.progress_percentage || 0,
        casesCreated: metrics?.cases_created || 0,
        completionPercentage: metrics?.completion_percentage || 0,
        status: progress.status || 'pending',
        ethicsSubmitted: progress.ethics_submitted || false,
        ethicsApproved: progress.ethics_approved || false,
        lastActivity: metrics?.recorded_date?.toISOString(),
        targetCases: stats?.cases_expected || undefined,
        currentPeriod: currentPeriod?.period_number || undefined,
        totalPeriods: projectHospital?.projects?.required_periods || undefined,
      };
    });
  }

  /**
   * Obtener análisis de velocidad de reclutamiento
   */
  static async getRecruitmentVelocity(
    projectId?: string,
    filters?: AnalyticsFilters & { granularity?: 'day' | 'week' | 'month' }
  ): Promise<Array<{
    date: string;
    casesCreated: number;
    cumulativeCases: number;
    velocity: number; // casos por día promedio en el período
    hospitalId?: string;
    hospitalName?: string;
    province?: string;
  }>> {
    const granularity = filters?.granularity || 'day';
    
    const where: any = {};

    if (projectId) {
      // Filtrar por hospitales del proyecto
      const projectHospitals = await prisma.project_hospitals.findMany({
        where: { project_id: projectId },
        select: { hospital_id: true },
      });
      const hospitalIds = projectHospitals.map((ph) => ph.hospital_id);
      where.hospital_id = { in: hospitalIds };
    }

    if (filters?.hospitalId) {
      where.hospital_id = filters.hospitalId;
    }

    if (filters?.province) {
      where.hospitals = {
        province: filters.province,
      };
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.recorded_date = {};
      if (filters.dateFrom) {
        where.recorded_date.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.recorded_date.lte = filters.dateTo;
      }
    } else {
      // Por defecto, últimos 90 días
      const defaultDateFrom = new Date();
      defaultDateFrom.setDate(defaultDateFrom.getDate() - 90);
      where.recorded_date = { gte: defaultDateFrom };
    }

    const metrics = await prisma.case_metrics.findMany({
      where,
      include: {
        hospitals: {
          select: {
            id: true,
            name: true,
            province: true,
          },
        },
      },
      orderBy: { recorded_date: 'asc' },
    });

    // Agrupar por granularidad
    const grouped = new Map<string, typeof metrics>();
    metrics.forEach((m) => {
      const date = new Date(m.recorded_date);
      let key: string;

      switch (granularity) {
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(m);
    });

    const result: ReturnType<typeof this.getRecruitmentVelocity> = [];
    let cumulative = 0;

    for (const [dateKey, group] of Array.from(grouped.entries()).sort()) {
      const casesInPeriod = group.reduce(
        (sum, m) => sum + (m.cases_created || 0),
        0
      );
      cumulative += casesInPeriod;

      // Calcular velocidad (promedio de casos por día en el período)
      const periodDays =
        granularity === 'week' ? 7 : granularity === 'month' ? 30 : 1;
      const velocity = casesInPeriod / periodDays;

      result.push({
        date: dateKey,
        casesCreated: casesInPeriod,
        cumulativeCases: cumulative,
        velocity: Math.round(velocity * 100) / 100,
      });
    }

    return result;
  }

  /**
   * Obtener comparativa por provincias
   */
  static async getProvinceComparison(
    projectId?: string,
    filters?: AnalyticsFilters
  ): Promise<Array<{
    province: string;
    hospitalCount: number;
    totalCases: number;
    averageProgress: number;
    averageCompletion: number;
    activeHospitals: number;
    totalTargetCases?: number;
    totalLoadedCases?: number;
  }>> {
    const where: any = {};

    if (projectId) {
      where.project_id = projectId;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.updated_at = {};
      if (filters.dateFrom) {
        where.updated_at.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.updated_at.lte = filters.dateTo;
      }
    }

    const progressData = await prisma.hospital_progress.findMany({
      where,
      include: {
        hospitals: {
          select: {
            id: true,
            name: true,
            province: true,
            status: true,
          },
        },
        project_hospitals: {
          include: {
            recruitment_periods: {
              include: {
                case_load_statistics: true,
              },
            },
          },
        },
      },
    });

    // Obtener métricas de casos
    const hospitalIds = progressData.map((p) => p.hospital_id);
    const caseMetrics = await prisma.case_metrics.findMany({
      where: {
        hospital_id: { in: hospitalIds },
      },
      orderBy: { recorded_date: 'desc' },
      distinct: ['hospital_id'],
    });

    const metricsMap = new Map(
      caseMetrics.map((m) => [m.hospital_id, m])
    );

    // Agrupar por provincia
    const provinceMap = new Map<
      string,
      {
        hospitals: Set<string>;
        totalProgress: number;
        totalCompletion: number;
        totalCases: number;
        activeHospitals: Set<string>;
        totalTargetCases: number;
        totalLoadedCases: number;
      }
    >();

    progressData.forEach((progress) => {
      const province = progress.hospitals?.province || 'Unknown';
      const hospitalId = progress.hospital_id;
      const metrics = metricsMap.get(hospitalId);
      const isActive = progress.hospitals?.status === 'active' || 
                       progress.hospitals?.status === 'active_recruiting';

      let provinceData = provinceMap.get(province);
      if (!provinceData) {
        provinceMap.set(province, {
          hospitals: new Set(),
          totalProgress: 0,
          totalCompletion: 0,
          totalCases: 0,
          activeHospitals: new Set(),
          totalTargetCases: 0,
          totalLoadedCases: 0,
        });
        provinceData = provinceMap.get(province)!;
      }

      provinceData.hospitals.add(hospitalId);
      provinceData.totalProgress += progress.progress_percentage || 0;
      provinceData.totalCases += metrics?.cases_created || 0;
      provinceData.totalCompletion += metrics?.completion_percentage || 0;

      if (isActive) {
        provinceData.activeHospitals.add(hospitalId);
      }

      // Sumar casos esperados y cargados de los períodos
      progress.project_hospitals?.recruitment_periods?.forEach((period) => {
        period.case_load_statistics?.forEach((stats) => {
          provinceData!.totalTargetCases += stats.cases_expected || 0;
          provinceData!.totalLoadedCases += stats.cases_loaded || 0;
        });
      });
    });

    return Array.from(provinceMap.entries()).map(([province, data]) => {
      const hospitalCount = data.hospitals.size;
      return {
        province,
        hospitalCount,
        totalCases: data.totalCases,
        averageProgress:
          hospitalCount > 0
            ? Math.round(data.totalProgress / hospitalCount)
            : 0,
        averageCompletion:
          hospitalCount > 0
            ? Math.round(data.totalCompletion / hospitalCount)
            : 0,
        activeHospitals: data.activeHospitals.size,
        totalTargetCases: data.totalTargetCases || undefined,
        totalLoadedCases: data.totalLoadedCases || undefined,
      };
    });
  }

  /**
   * Obtener predicción de finalización
   */
  static async getCompletionPrediction(
    projectId?: string,
    filters?: AnalyticsFilters & { level?: 'hospital' | 'province' | 'global'; days?: number }
  ): Promise<Array<{
    entityId?: string;
    entityName: string;
    currentProgress: number;
    targetProgress: number;
    predictedCompletionDate?: string;
    predictedDaysRemaining?: number;
    confidence: 'high' | 'medium' | 'low';
    trend: 'improving' | 'stable' | 'declining';
  }>> {
    const level = filters?.level || 'global';
    const predictionDays = filters?.days || 90;

    // Obtener datos históricos de progreso
    const where: any = {};

    if (projectId) {
      where.project_id = projectId;
    }

    if (filters?.hospitalId) {
      where.hospital_id = filters.hospitalId;
    }

    if (filters?.province) {
      where.hospitals = {
        province: filters.province,
      };
    }

    // Obtener progreso actual
    const currentProgress = await prisma.hospital_progress.findMany({
      where,
      include: {
        hospitals: {
          select: {
            id: true,
            name: true,
            province: true,
          },
        },
      },
    });

    // Obtener métricas históricas para calcular tendencia
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - predictionDays);

    const historicalMetrics = await prisma.case_metrics.findMany({
      where: {
        hospital_id: where.hospital_id || undefined,
        recorded_date: { gte: dateFrom },
      },
      include: {
        hospitals: {
          select: {
            province: true,
          },
        },
      },
      orderBy: { recorded_date: 'asc' },
    });

    // Agrupar según el nivel
    if (level === 'hospital') {
      const hospitalMap = new Map<
        string,
        {
          hospital: typeof currentProgress[0];
          historical: typeof historicalMetrics;
        }
      >();

      currentProgress.forEach((p) => {
        hospitalMap.set(p.hospital_id, {
          hospital: p,
          historical: [],
        });
      });

      historicalMetrics.forEach((m) => {
        const data = hospitalMap.get(m.hospital_id);
        if (data) {
          data.historical.push(m);
        }
      });

      return Array.from(hospitalMap.values()).map(({ hospital, historical }) => {
        const current = hospital.progress_percentage || 0;
        const target = 100; // Completar el estudio

        // Calcular tendencia basada en velocidad de progreso
        const trendData = this.calculateTrendFromHistory(historical);
        
        // Proyección lineal simple
        const avgVelocity = trendData.avgVelocity;
        const predictedDays =
          avgVelocity > 0
            ? Math.max(1, Math.ceil((target - current) / avgVelocity))
            : undefined;

        const predictedDate = predictedDays
          ? new Date(Date.now() + predictedDays * 24 * 60 * 60 * 1000)
          : undefined;

        return {
          entityId: hospital.hospital_id,
          entityName: hospital.hospitals?.name || 'Unknown',
          currentProgress: current,
          targetProgress: target,
          predictedCompletionDate: predictedDate?.toISOString().split('T')[0],
          predictedDaysRemaining: predictedDays,
          confidence: trendData.confidence,
          trend: trendData.trend,
        };
      });
    } else if (level === 'province') {
      const provinceMap = new Map<
        string,
        {
          hospitals: typeof currentProgress;
          historical: typeof historicalMetrics;
        }
      >();

      currentProgress.forEach((p) => {
        const province = p.hospitals?.province || 'Unknown';
        if (!provinceMap.has(province)) {
          provinceMap.set(province, {
            hospitals: [],
            historical: [],
          });
        }
        provinceMap.get(province)!.hospitals.push(p);
      });

      historicalMetrics.forEach((m) => {
        const province = m.hospitals?.province || 'Unknown';
        const data = provinceMap.get(province);
        if (data) {
          data.historical.push(m);
        }
      });

      return Array.from(provinceMap.entries()).map(([province, data]) => {
        const avgProgress =
          data.hospitals.length > 0
            ? data.hospitals.reduce(
                (sum, h) => sum + (h.progress_percentage || 0),
                0
              ) / data.hospitals.length
            : 0;

        const trendData = this.calculateTrendFromHistory(data.historical);
        const predictedDays =
          trendData.avgVelocity > 0
            ? Math.max(1, Math.ceil((100 - avgProgress) / trendData.avgVelocity))
            : undefined;

        const predictedDate = predictedDays
          ? new Date(Date.now() + predictedDays * 24 * 60 * 60 * 1000)
          : undefined;

        return {
          entityName: province,
          currentProgress: Math.round(avgProgress),
          targetProgress: 100,
          predictedCompletionDate: predictedDate?.toISOString().split('T')[0],
          predictedDaysRemaining: predictedDays,
          confidence: trendData.confidence,
          trend: trendData.trend,
        };
      });
    } else {
      // Global
      const totalProgress =
        currentProgress.length > 0
          ? currentProgress.reduce(
              (sum, p) => sum + (p.progress_percentage || 0),
              0
            ) / currentProgress.length
          : 0;

      const trendData = this.calculateTrendFromHistory(historicalMetrics);
      const predictedDays =
        trendData.avgVelocity > 0
          ? Math.max(1, Math.ceil((100 - totalProgress) / trendData.avgVelocity))
          : undefined;

      const predictedDate = predictedDays
        ? new Date(Date.now() + predictedDays * 24 * 60 * 60 * 1000)
        : undefined;

      return [
        {
          entityName: 'Global',
          currentProgress: Math.round(totalProgress),
          targetProgress: 100,
          predictedCompletionDate: predictedDate?.toISOString().split('T')[0],
          predictedDaysRemaining: predictedDays,
          confidence: trendData.confidence,
          trend: trendData.trend,
        },
      ];
    }
  }

  /**
   * Calcular tendencia desde datos históricos
   */
  private static calculateTrendFromHistory(
    historical: Array<{ recorded_date: Date; cases_created?: number; completion_percentage?: number }>
  ): {
    avgVelocity: number;
    trend: 'improving' | 'stable' | 'declining';
    confidence: 'high' | 'medium' | 'low';
  } {
    if (historical.length < 2) {
      return {
        avgVelocity: 0,
        trend: 'stable',
        confidence: 'low',
      };
    }

    // Calcular velocidad promedio (progreso por día)
    const velocities: number[] = [];
    for (let i = 1; i < historical.length; i++) {
      const prev = historical[i - 1];
      const curr = historical[i];
      const daysDiff =
        (curr.recorded_date.getTime() - prev.recorded_date.getTime()) /
        (1000 * 60 * 60 * 24);

      if (daysDiff > 0) {
        const progressDiff =
          (curr.completion_percentage || 0) - (prev.completion_percentage || 0);
        const velocity = progressDiff / daysDiff;
        velocities.push(velocity);
      }
    }

    const avgVelocity =
      velocities.length > 0
        ? velocities.reduce((sum, v) => sum + v, 0) / velocities.length
        : 0;

    // Determinar tendencia comparando primera mitad vs segunda mitad
    const midPoint = Math.floor(historical.length / 2);
    const firstHalf = velocities.slice(0, midPoint);
    const secondHalf = velocities.slice(midPoint);

    const firstAvg =
      firstHalf.length > 0
        ? firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length
        : 0;
    const secondAvg =
      secondHalf.length > 0
        ? secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length
        : 0;

    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (secondAvg > firstAvg * 1.1) {
      trend = 'improving';
    } else if (secondAvg < firstAvg * 0.9) {
      trend = 'declining';
    }

    // Calcular confianza basada en cantidad de datos y variabilidad
    const variance =
      velocities.length > 1
        ? velocities.reduce(
            (sum, v) => sum + Math.pow(v - avgVelocity, 2),
            0
          ) / velocities.length
        : 0;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = avgVelocity !== 0 ? stdDev / Math.abs(avgVelocity) : 1;

    let confidence: 'high' | 'medium' | 'low' = 'low';
    if (historical.length >= 30 && coefficientOfVariation < 0.3) {
      confidence = 'high';
    } else if (historical.length >= 10 && coefficientOfVariation < 0.5) {
      confidence = 'medium';
    }

    return {
      avgVelocity: Math.round(avgVelocity * 100) / 100,
      trend,
      confidence,
    };
  }
}


