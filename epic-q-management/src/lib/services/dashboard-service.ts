import { prisma } from '@/lib/database';
import { DashboardKPIs } from '@/types';

export class DashboardService {
  /**
   * Obtener KPIs del dashboard
   */
  static async getDashboardKPIs(): Promise<DashboardKPIs> {
    try {
      // Obtener estadísticas básicas de hospitales
      const [
        totalHospitals,
        activeHospitals,
        activeAlerts
      ] = await Promise.all([
        // Total de hospitales
        prisma.hospitals.count(),
        
        // Hospitales activos
        prisma.hospitals.count({
          where: { status: 'active' }
        }),
        
        // Alertas activas
        prisma.alerts.count({
          where: { is_resolved: false }
        })
      ]);

      // Obtener casos de forma segura
      let totalCases = 0;
      let averageCompletion = 0;
      
      try {
        const caseMetrics = await prisma.case_metrics.aggregate({
          _sum: { cases_created: true },
          _avg: { completion_percentage: true }
        });
        totalCases = caseMetrics._sum.cases_created || 0;
        averageCompletion = Math.round(caseMetrics._avg.completion_percentage || 0);
      } catch (caseError) {
        console.warn('Case metrics not available:', caseError);
        // Usar valores por defecto si no hay datos de casos
      }

      // Calcular tendencias de forma segura
      let trends = {
        totalHospitals: 0,
        activeHospitals: 0,
        totalCases: 0,
        averageCompletion: 0,
        activeAlerts: 0
      };
      
      try {
        trends = await this.calculateTrends();
      } catch (trendsError) {
        console.warn('Trends calculation failed:', trendsError);
        // Usar valores por defecto si falla el cálculo de tendencias
      }

      return {
        totalHospitals,
        activeHospitals,
        totalCases,
        averageCompletion,
        activeAlerts,
        trends
      };
    } catch (error) {
      console.error('Error getting dashboard KPIs:', error);
      // Retornar valores por defecto en caso de error
      return {
        totalHospitals: 0,
        activeHospitals: 0,
        totalCases: 0,
        averageCompletion: 0,
        activeAlerts: 0,
        trends: {
          totalHospitals: 0,
          activeHospitals: 0,
          totalCases: 0,
          averageCompletion: 0,
          activeAlerts: 0
        }
      };
    }
  }

  /**
   * Obtener distribución de hospitales por estado
   */
  static async getHospitalsByStatus() {
    try {
      const statusDistribution = await prisma.hospitals.groupBy({
        by: ['status'],
        _count: { status: true },
        orderBy: { _count: { status: 'desc' } }
      });

      return statusDistribution.map(item => ({
        status: item.status,
        count: item._count.status,
        label: getStatusLabel(item.status),
        color: getStatusColor(item.status)
      }));
    } catch (error) {
      console.error('Error getting hospitals by status:', error);
      return [];
    }
  }

  /**
   * Obtener distribución de severidad de alertas
   */
  static async getAlertsByType() {
    try {
      const typeDistribution = await prisma.alerts.groupBy({
        by: ['type'],
        _count: { type: true },
        where: { is_resolved: false },
        orderBy: { _count: { type: 'desc' } }
      });

      return typeDistribution.map(item => ({
        type: item.type,
        count: item._count.type,
        label: getTypeLabel(item.type),
        color: getTypeColor(item.type)
      }));
    } catch (error) {
      console.error('Error getting alerts by type:', error);
      return [];
    }
  }

  /**
   * Obtener alertas recientes
   */
  static async getRecentAlerts(limit: number = 5) {
    try {
      const alerts = await prisma.alerts.findMany({
        where: { is_resolved: false },
        include: {
          hospitals: {
            select: { name: true }
          }
        },
        orderBy: { created_at: 'desc' },
        take: limit
      });

      return alerts.map(alert => ({
        id: alert.id,
        title: alert.title,
        message: alert.message,
        severity: alert.severity,
        hospital_name: alert.hospitals?.name || 'Hospital desconocido',
        created_at: alert.created_at
      }));
    } catch (error) {
      console.error('Error getting recent alerts:', error);
      return [];
    }
  }

  /**
   * Obtener períodos de reclutamiento próximos
   */
  static async getUpcomingRecruitment(limit: number = 5) {
    try {
      const now = new Date();
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const periods = await prisma.recruitment_periods.findMany({
        where: {
          start_date: {
            gte: now,
            lte: nextMonth
          }
        },
        include: {
          project_hospitals: {
            include: {
              hospitals: {
                select: { name: true }
              }
            }
          }
        },
        orderBy: { start_date: 'asc' },
        take: limit
      });

      return periods.map(period => ({
        id: period.id,
        hospital_name: period.project_hospitals?.hospitals?.name || 'Hospital desconocido',
        period_number: period.period_number,
        start_date: period.start_date,
        end_date: period.end_date,
        status: period.status
      }));
    } catch (error) {
      console.error('Error getting upcoming recruitment:', error);
      return [];
    }
  }

  /**
   * Calcular tendencias mensuales para los KPIs
   */
  private static async calculateTrends() {
    try {
      const now = new Date();
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      // Obtener datos del mes actual
      const [
        currentTotalHospitals,
        currentActiveHospitals,
        currentTotalCases,
        currentAverageCompletion,
        currentActiveAlerts
      ] = await Promise.all([
        prisma.hospitals.count({
          where: {
            created_at: {
              lte: now
            }
          }
        }),
        prisma.hospitals.count({
          where: { 
            status: 'active_recruiting',
            created_at: {
              lte: now
            }
          }
        }),
        prisma.case_metrics.aggregate({
          where: {
            recorded_date: {
              gte: currentMonth,
              lte: now
            }
          },
          _sum: { cases_created: true }
        }).then(result => result._sum.cases_created || 0),
        prisma.case_metrics.aggregate({
          where: {
            recorded_date: {
              gte: currentMonth,
              lte: now
            }
          },
          _avg: { completion_percentage: true }
        }).then(result => Math.round(result._avg.completion_percentage || 0)),
        prisma.alerts.count({
          where: { 
            is_resolved: false,
            created_at: {
              lte: now
            }
          }
        })
      ]);

      // Obtener datos del mes anterior
      const [
        previousTotalHospitals,
        previousActiveHospitals,
        previousTotalCases,
        previousAverageCompletion,
        previousActiveAlerts
      ] = await Promise.all([
        prisma.hospitals.count({
          where: {
            created_at: {
              lte: previousMonthEnd
            }
          }
        }),
        prisma.hospitals.count({
          where: { 
            status: 'active_recruiting',
            created_at: {
              lte: previousMonthEnd
            }
          }
        }),
        prisma.case_metrics.aggregate({
          where: {
            recorded_date: {
              gte: previousMonth,
              lte: previousMonthEnd
            }
          },
          _sum: { cases_created: true }
        }).then(result => result._sum.cases_created || 0),
        prisma.case_metrics.aggregate({
          where: {
            recorded_date: {
              gte: previousMonth,
              lte: previousMonthEnd
            }
          },
          _avg: { completion_percentage: true }
        }).then(result => Math.round(result._avg.completion_percentage || 0)),
        prisma.alerts.count({
          where: { 
            is_resolved: false,
            created_at: {
              lte: previousMonthEnd
            }
          }
        })
      ]);

      // Calcular porcentajes de cambio
      const calculatePercentageChange = (current: number, previous: number): number => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
      };

      return {
        totalHospitals: calculatePercentageChange(currentTotalHospitals, previousTotalHospitals),
        activeHospitals: calculatePercentageChange(currentActiveHospitals, previousActiveHospitals),
        totalCases: calculatePercentageChange(currentTotalCases, previousTotalCases),
        averageCompletion: calculatePercentageChange(currentAverageCompletion, previousAverageCompletion),
        activeAlerts: calculatePercentageChange(currentActiveAlerts, previousActiveAlerts)
      };
    } catch (error) {
      console.error('Error calculating trends:', error);
      // Retornar tendencias en 0 si hay error
      return {
        totalHospitals: 0,
        activeHospitals: 0,
        totalCases: 0,
        averageCompletion: 0,
        activeAlerts: 0
      };
    }
  }
}

// Funciones auxiliares para etiquetas y colores
function getStatusLabel(status: string | null): string {
  const labels: Record<string, string> = {
    'active': 'Activo',
    'inactive': 'Inactivo'
  };
  return labels[status || ''] || status || 'Desconocido';
}

function getStatusColor(status: string | null): string {
  const colors: Record<string, string> = {
    'active': '#10b981',
    'inactive': '#ef4444'
  };
  return colors[status || ''] || '#6b7280';
}

function getTypeLabel(type: string | null): string {
  const labels: Record<string, string> = {
    'system': 'Sistema',
    'data': 'Datos',
    'compliance': 'Cumplimiento',
    'performance': 'Rendimiento',
    'security': 'Seguridad'
  };
  return labels[type || ''] || type || 'Desconocido';
}

function getTypeColor(type: string | null): string {
  const colors: Record<string, string> = {
    'system': '#ef4444',
    'data': '#f97316',
    'compliance': '#fbbf24',
    'performance': '#3b82f6',
    'security': '#8b5cf6'
  };
  return colors[type || ''] || '#6b7280';
}