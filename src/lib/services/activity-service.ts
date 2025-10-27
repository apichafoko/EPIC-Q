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
    return await prisma.activity_logs.create({
      data: {
        id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: data.user_id || 'system',
        action: data.action,
        details: data.details ? JSON.stringify(data.details) : null,
        created_at: new Date()
      }
    });
  }

  // Obtener logs por usuario
  static async getLogsByUser(userId: string, limit: number = 50) {
    return await prisma.activity_logs.findMany({
      where: { userId: userId },
      include: {
        users: {
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

  // Obtener logs por hospital
  static async getLogsByHospital(hospitalId: string, limit: number = 50) {
    return await prisma.activity_logs.findMany({
      where: { 
        details: {
          contains: hospitalId
        }
      },
      include: {
        users: {
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
    return await prisma.activity_logs.findMany({
      include: {
        users: {
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

  // Obtener logs por acción
  static async getLogsByAction(action: string, limit: number = 50) {
    return await prisma.activity_logs.findMany({
      where: { action },
      include: {
        users: {
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

  // Obtener logs por rango de fechas
  static async getLogsByDateRange(startDate: Date, endDate: Date, limit: number = 100) {
    return await prisma.activity_logs.findMany({
      where: {
        created_at: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        users: {
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

  // Obtener estadísticas de actividad
  static async getActivityStats() {
    const [
      total,
      byAction,
      byUser,
      recentCount
    ] = await Promise.all([
      prisma.activity_logs.count(),
      prisma.activity_logs.groupBy({
        by: ['action'],
        _count: { action: true }
      }),
      prisma.activity_logs.groupBy({
        by: ['userId'],
        _count: { userId: true }
      }),
      prisma.activity_logs.count({
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
        acc[item.userId || 'unknown'] = item._count.userId;
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

    const result = await prisma.activity_logs.deleteMany({
      where: {
        created_at: {
          lt: ninetyDaysAgo
        }
      }
    });

    return result.count;
  }
}
