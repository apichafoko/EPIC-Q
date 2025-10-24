import { prisma } from '../database';
import { CaseMetrics, RecruitmentPeriod } from '@/types';

// Servicio para Métricas de Casos
export class CaseMetricsService {
  // Obtener métricas por hospital
  static async getMetricsByHospital(hospitalId: string) {
    return await prisma.case_metrics.findMany({
      where: { hospital_id: hospitalId },
      orderBy: { recorded_date: 'desc' }
    });
  }

  // Crear métrica
  static async createMetric(data: {
    hospital_id: string;
    recorded_date: Date;
    cases_created: number;
    completion_percentage?: number;
    last_case_date?: Date;
  }) {
    return await prisma.case_metrics.create({
      data: {
        ...data,
        id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
    });
  }

  // Actualizar métrica
  static async updateMetric(id: string, data: Partial<CaseMetrics>) {
    return await prisma.case_metrics.update({
      where: { id },
      data
    });
  }

  // Obtener métricas por rango de fechas
  static async getMetricsByDateRange(hospitalId: string, startDate: Date, endDate: Date) {
    return await prisma.case_metrics.findMany({
      where: {
        hospital_id: hospitalId,
        recorded_date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { recorded_date: 'asc' }
    });
  }

  // Obtener resumen de métricas por hospital
  static async getMetricsSummary(hospitalId: string) {
    const metrics = await prisma.case_metrics.findMany({
      where: { hospital_id: hospitalId },
      orderBy: { recorded_date: 'desc' }
    });

    if (metrics.length === 0) {
      return {
        totalCreated: 0,
        totalCompleted: 0,
        completionRate: 0,
        lastCaseDate: null
      };
    }

    const totalCreated = metrics.reduce((sum, m) => sum + m.cases_created, 0);
    const totalCompleted = metrics.reduce((sum, m) => {
      const completed = Math.round((m.cases_created * m.completion_percentage) / 100);
      return sum + completed;
    }, 0);
    const completionRate = totalCreated > 0 ? Math.round((totalCompleted / totalCreated) * 100) : 0;
    const lastCaseDate = metrics.find(m => m.last_case_date)?.last_case_date || null;

    return {
      totalCreated,
      totalCompleted,
      completionRate,
      lastCaseDate
    };
  }

  // Obtener métricas para gráficos
  static async getMetricsForCharts(hospitalId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const metrics = await prisma.case_metrics.findMany({
      where: {
        hospital_id: hospitalId,
        recorded_date: {
          gte: startDate
        }
      },
      orderBy: { recorded_date: 'asc' }
    });

    // Agrupar por semana
    const weeklyData = metrics.reduce((acc, metric) => {
      const weekStart = new Date(metric.recorded_date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Lunes
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!acc[weekKey]) {
        acc[weekKey] = {
          week: weekKey,
          cases_created: 0,
          cases_completed: 0,
          completion_percentage: 0
        };
      }

      acc[weekKey].cases_created += metric.cases_created;
      const completed = Math.round((metric.cases_created * metric.completion_percentage) / 100);
      acc[weekKey].cases_completed += completed;
      
      return acc;
    }, {} as Record<string, any>);

    // Calcular porcentaje de completitud por semana
    Object.values(weeklyData).forEach((week: any) => {
      week.completion_percentage = week.cases_created > 0 
        ? Math.round((week.cases_completed / week.cases_created) * 100)
        : 0;
    });

    return Object.values(weeklyData);
  }
}

// Servicio para Períodos de Reclutamiento
export class RecruitmentPeriodService {
  // Obtener períodos por hospital
  static async getPeriodsByHospital(hospitalId: string) {
    return await prisma.recruitment_periods.findMany({
      where: { 
        project_hospitals: {
          hospital_id: hospitalId
        }
      },
      orderBy: { period_number: 'asc' }
    });
  }

  // Crear período
  static async createPeriod(data: {
    hospital_id: string;
    period_number: number;
    start_date: Date;
    end_date: Date;
    status?: string;
  }) {
    return await prisma.recruitment_periods.create({
      data: {
        id: `period_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        project_hospital_id: `project_hospital_${data.hospital_id}`,
        period_number: data.period_number,
        start_date: data.start_date,
        end_date: data.end_date,
        target_cases: 100 // Valor por defecto
      }
    });
  }

  // Actualizar período
  static async updatePeriod(id: string, data: Partial<RecruitmentPeriod>) {
    return await prisma.recruitment_periods.update({
      where: { id },
      data
    });
  }

  // Eliminar período
  static async deletePeriod(id: string) {
    return await prisma.recruitment_periods.delete({
      where: { id }
    });
  }

  // Validar período
  static async validatePeriod(data: {
    hospital_id: string;
    period_number: number;
    start_date: Date;
    end_date: Date;
  }) {
    const { hospital_id, period_number, start_date, end_date } = data;

    // Verificar que el período no exista
    const existingPeriod = await prisma.recruitment_periods.findFirst({
      where: {
        project_hospitals: {
          hospital_id: hospital_id
        },
        period_number
      }
    });

    if (existingPeriod) {
      throw new Error(`El período ${period_number} ya existe para este hospital`);
    }

    // Verificar que la fecha de inicio sea lunes
    if (start_date.getDay() !== 1) {
      throw new Error('La fecha de inicio debe ser un lunes');
    }

    // Verificar que la duración sea de 7 días
    const duration = Math.ceil((end_date.getTime() - start_date.getTime()) / (1000 * 60 * 60 * 24));
    if (duration !== 7) {
      throw new Error('El período debe durar exactamente 7 días');
    }

    // Verificar que no haya solapamiento con otros períodos
    const overlappingPeriod = await prisma.recruitment_periods.findFirst({
      where: {
        project_hospitals: {
          hospital_id: hospital_id
        },
        OR: [
          {
            start_date: {
              lte: start_date
            },
            end_date: {
              gte: start_date
            }
          },
          {
            start_date: {
              lte: end_date
            },
            end_date: {
              gte: end_date
            }
          }
        ]
      }
    });

    if (overlappingPeriod) {
      throw new Error('El período se solapa con un período existente');
    }

    // Verificar que haya al menos 4 meses entre períodos
    const lastPeriod = await prisma.recruitment_periods.findFirst({
      where: {
        project_hospitals: {
          hospital_id: hospital_id
        },
        period_number: {
          lt: period_number
        }
      },
      orderBy: { period_number: 'desc' }
    });

    if (lastPeriod) {
      const monthsBetween = (start_date.getTime() - lastPeriod.end_date.getTime()) / (1000 * 60 * 60 * 24 * 30);
      if (monthsBetween < 4) {
        throw new Error('Debe haber al menos 4 meses entre períodos de reclutamiento');
      }
    }

    return true;
  }

  // Obtener períodos próximos
  static async getUpcomingPeriods(days: number = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return await prisma.recruitment_periods.findMany({
      where: {
        start_date: {
          lte: futureDate,
          gte: new Date()
        }
      },
      include: {
        project_hospitals: {
          include: {
            hospitals: {
              select: {
                id: true,
                name: true,
                city: true,
                province: true
              }
            }
          }
        }
      },
      orderBy: { start_date: 'asc' }
    });
  }

  // Obtener períodos activos
  static async getActivePeriods() {
    const today = new Date();
    
    return await prisma.recruitment_periods.findMany({
      where: {
        start_date: {
          lte: today
        },
        end_date: {
          gte: today
        }
      },
      include: {
        project_hospitals: {
          include: {
            hospitals: {
              select: {
                id: true,
                name: true,
                city: true,
                province: true
              }
            }
          }
        }
      },
      orderBy: { start_date: 'asc' }
    });
  }

  // Obtener estadísticas de períodos
  static async getPeriodStats() {
    const [
      total,
      upcoming,
      active
    ] = await Promise.all([
      prisma.recruitment_periods.count(),
      prisma.recruitment_periods.count({
        where: {
          start_date: {
            gte: new Date()
          }
        }
      }),
      prisma.recruitment_periods.count({
        where: {
          start_date: {
            lte: new Date()
          },
          end_date: {
            gte: new Date()
          }
        }
      })
    ]);

    return {
      total,
      upcoming,
      active,
      byStatus: {
        planned: upcoming,
        active: active,
        completed: total - upcoming - active
      }
    };
  }
}
