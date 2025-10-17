import { prisma } from '../database';

// Servicio para Logs de Actividad
export class ActivityService {
  // Crear log de actividad
  static async createLog(data: {
    user_id?: string;
    hospital_id?: string;
    action: string;
    details?: any;
  }) {
    return await prisma.activityLog.create({
      data: {
        ...data,
        details: data.details ? JSON.stringify(data.details) : null,
        created_at: new Date()
      }
    });
  }

  // Obtener logs por usuario
  static async getLogsByUser(userId: string, limit: number = 50) {
    return await prisma.activityLog.findMany({
      where: { user_id: userId },
      include: {
        hospital: {
          select: {
            id: true,
            name: true,
            city: true,
            province: true
          }
        }
      },
      orderBy: { created_at: 'desc' },
      take: limit
    });
  }

  // Obtener logs por hospital
  static async getLogsByHospital(hospitalId: string, limit: number = 50) {
    return await prisma.activityLog.findMany({
      where: { hospital_id: hospitalId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { created_at: 'desc' },
      take: limit
    });
  }

  // Obtener todos los logs
  static async getAllLogs(limit: number = 100) {
    return await prisma.activityLog.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        hospital: {
          select: {
            id: true,
            name: true,
            city: true,
            province: true
          }
        }
      },
      orderBy: { created_at: 'desc' },
      take: limit
    });
  }

  // Obtener logs por acción
  static async getLogsByAction(action: string, limit: number = 50) {
    return await prisma.activityLog.findMany({
      where: { action },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        hospital: {
          select: {
            id: true,
            name: true,
            city: true,
            province: true
          }
        }
      },
      orderBy: { created_at: 'desc' },
      take: limit
    });
  }

  // Obtener logs por rango de fechas
  static async getLogsByDateRange(startDate: Date, endDate: Date, limit: number = 100) {
    return await prisma.activityLog.findMany({
      where: {
        created_at: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        hospital: {
          select: {
            id: true,
            name: true,
            city: true,
            province: true
          }
        }
      },
      orderBy: { created_at: 'desc' },
      take: limit
    });
  }

  // Obtener estadísticas de actividad
  static async getActivityStats() {
    const [
      total,
      byAction,
      byUser,
      recentCount
    ] = await Promise.all([
      prisma.activityLog.count(),
      prisma.activityLog.groupBy({
        by: ['action'],
        _count: { action: true }
      }),
      prisma.activityLog.groupBy({
        by: ['user_id'],
        _count: { user_id: true }
      }),
      prisma.activityLog.count({
        where: {
          created_at: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24 horas
          }
        }
      })
    ]);

    return {
      total,
      recent: recentCount,
      byAction: byAction.reduce((acc, item) => {
        acc[item.action || 'unknown'] = item._count.action;
        return acc;
      }, {} as Record<string, number>),
      byUser: byUser.reduce((acc, item) => {
        acc[item.user_id || 'unknown'] = item._count.user_id;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  // Logs específicos para hospitales
  static async logHospitalAction(hospitalId: string, action: string, details?: any, userId?: string) {
    return await this.createLog({
      user_id: userId,
      hospital_id: hospitalId,
      action: `hospital_${action}`,
      details
    });
  }

  // Logs específicos para comunicaciones
  static async logCommunicationAction(communicationId: string, action: string, details?: any, userId?: string) {
    return await this.createLog({
      user_id: userId,
      action: `communication_${action}`,
      details: {
        communication_id: communicationId,
        ...details
      }
    });
  }

  // Logs específicos para templates
  static async logTemplateAction(templateId: string, action: string, details?: any, userId?: string) {
    return await this.createLog({
      user_id: userId,
      action: `template_${action}`,
      details: {
        template_id: templateId,
        ...details
      }
    });
  }

  // Logs específicos para alertas
  static async logAlertAction(alertId: string, action: string, details?: any, userId?: string) {
    return await this.createLog({
      user_id: userId,
      action: `alert_${action}`,
      details: {
        alert_id: alertId,
        ...details
      }
    });
  }

  // Logs específicos para usuarios
  static async logUserAction(userId: string, action: string, details?: any) {
    return await this.createLog({
      user_id: userId,
      action: `user_${action}`,
      details
    });
  }

  // Limpiar logs antiguos (más de 90 días)
  static async cleanOldLogs() {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const result = await prisma.activityLog.deleteMany({
      where: {
        created_at: {
          lt: ninetyDaysAgo
        }
      }
    });

    return result.count;
  }
}
