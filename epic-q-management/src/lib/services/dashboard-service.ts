import { prisma } from '@/lib/database';
import { DashboardKPIs } from '@/types';

export class DashboardService {
  /**
   * Obtener KPIs del dashboard
   */
  static async getDashboardKPIs(): Promise<DashboardKPIs> {
    try {
      // Obtener estadísticas de hospitales
      const [
        totalHospitals,
        activeHospitals,
        totalCases,
        averageCompletion,
        activeAlerts,
        trends
      ] = await Promise.all([
        // Total de hospitales
        prisma.hospital.count(),
        
        // Hospitales activos (en reclutamiento activo)
        prisma.hospital.count({
          where: { status: 'active_recruiting' }
        }),
        
        // Total de casos creados
        prisma.caseMetrics.aggregate({
          _sum: { cases_created: true }
        }).then(result => result._sum.cases_created || 0),
        
        // Completitud promedio
        prisma.caseMetrics.aggregate({
          _avg: { completion_percentage: true }
        }).then(result => Math.round(result._avg.completion_percentage || 0)),
        
        // Alertas activas
        prisma.alert.count({
          where: { is_resolved: false }
        }),
        
        // Calcular tendencias
        this.calculateTrends()
      ]);

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
      throw error;
    }
  }

  /**
   * Obtener distribución de hospitales por estado
   */
  static async getHospitalsByStatus() {
    try {
      const statusDistribution = await prisma.hospital.groupBy({
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
      throw error;
    }
  }

  /**
   * Obtener distribución de severidad de alertas
   */
  static async getAlertsBySeverity() {
    try {
      const severityDistribution = await prisma.alert.groupBy({
        by: ['severity'],
        _count: { severity: true },
        where: { is_resolved: false },
        orderBy: { _count: { severity: 'desc' } }
      });

      return severityDistribution.map(item => ({
        severity: item.severity,
        count: item._count.severity,
        label: getSeverityLabel(item.severity),
        color: getSeverityColor(item.severity)
      }));
    } catch (error) {
      console.error('Error getting alerts by severity:', error);
      throw error;
    }
  }

  /**
   * Obtener alertas recientes
   */
  static async getRecentAlerts(limit: number = 5) {
    try {
      const alerts = await prisma.alert.findMany({
        where: { is_resolved: false },
        include: {
          hospital: {
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
        hospital_name: alert.hospital?.name || 'Hospital desconocido',
        created_at: alert.created_at
      }));
    } catch (error) {
      console.error('Error getting recent alerts:', error);
      throw error;
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

      const periods = await prisma.recruitmentPeriod.findMany({
        where: {
          start_date: {
            gte: now,
            lte: nextMonth
          },
          status: 'planned'
        },
        include: {
          hospital: {
            select: { name: true }
          }
        },
        orderBy: { start_date: 'asc' },
        take: limit
      });

      return periods.map(period => ({
        id: period.id,
        hospital_name: period.hospital?.name || 'Hospital desconocido',
        period_number: period.period_number,
        start_date: period.start_date,
        end_date: period.end_date,
        status: period.status
      }));
    } catch (error) {
      console.error('Error getting upcoming recruitment:', error);
      throw error;
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
        prisma.hospital.count({
          where: {
            created_at: {
              lte: now
            }
          }
        }),
        prisma.hospital.count({
          where: { 
            status: 'active_recruiting',
            created_at: {
              lte: now
            }
          }
        }),
        prisma.caseMetrics.aggregate({
          where: {
            recorded_date: {
              gte: currentMonth,
              lte: now
            }
          },
          _sum: { cases_created: true }
        }).then(result => result._sum.cases_created || 0),
        prisma.caseMetrics.aggregate({
          where: {
            recorded_date: {
              gte: currentMonth,
              lte: now
            }
          },
          _avg: { completion_percentage: true }
        }).then(result => Math.round(result._avg.completion_percentage || 0)),
        prisma.alert.count({
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
        prisma.hospital.count({
          where: {
            created_at: {
              lte: previousMonthEnd
            }
          }
        }),
        prisma.hospital.count({
          where: { 
            status: 'active_recruiting',
            created_at: {
              lte: previousMonthEnd
            }
          }
        }),
        prisma.caseMetrics.aggregate({
          where: {
            recorded_date: {
              gte: previousMonth,
              lte: previousMonthEnd
            }
          },
          _sum: { cases_created: true }
        }).then(result => result._sum.cases_created || 0),
        prisma.caseMetrics.aggregate({
          where: {
            recorded_date: {
              gte: previousMonth,
              lte: previousMonthEnd
            }
          },
          _avg: { completion_percentage: true }
        }).then(result => Math.round(result._avg.completion_percentage || 0)),
        prisma.alert.count({
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
    'initial_contact': 'Contacto Inicial',
    'pending_evaluation': 'Evaluación Pendiente',
    'ethics_approval_process': 'Aprobación Ética',
    'redcap_setup': 'Configuración RedCap',
    'active_recruiting': 'Reclutamiento Activo',
    'completed': 'Completado',
    'inactive': 'Inactivo'
  };
  return labels[status || ''] || status || 'Desconocido';
}

function getStatusColor(status: string | null): string {
  const colors: Record<string, string> = {
    'initial_contact': '#fbbf24',
    'pending_evaluation': '#f97316',
    'ethics_approval_process': '#3b82f6',
    'redcap_setup': '#8b5cf6',
    'active_recruiting': '#10b981',
    'completed': '#6b7280',
    'inactive': '#ef4444'
  };
  return colors[status || ''] || '#6b7280';
}

function getSeverityLabel(severity: string | null): string {
  const labels: Record<string, string> = {
    'critical': 'Crítica',
    'high': 'Alta',
    'medium': 'Media',
    'low': 'Baja'
  };
  return labels[severity || ''] || severity || 'Desconocida';
}

function getSeverityColor(severity: string | null): string {
  const colors: Record<string, string> = {
    'critical': '#ef4444',
    'high': '#f97316',
    'medium': '#fbbf24',
    'low': '#3b82f6'
  };
  return colors[severity || ''] || '#6b7280';
}