'use server';

import { prisma } from '@/lib/database';
import { Alert, AlertFilters } from '@/types';

export async function getAlerts(filters?: AlertFilters, page: number = 1, limit: number = 25) {
  try {
    const where: any = {};

    // Aplicar filtros
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { message: { contains: filters.search, mode: 'insensitive' } },
        { hospitals: { name: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    if (filters?.type && filters.type !== 'all') {
      where.type = filters.type;
    }

    if (filters?.severity && filters.severity !== 'all') {
      where.severity = filters.severity;
    }

    if (filters?.status && filters.status !== 'all') {
      if (filters.status === 'active') {
        where.is_resolved = false;
      } else if (filters.status === 'resolved') {
        where.is_resolved = true;
      }
    }

    if (filters?.hospital_id && filters.hospital_id !== 'all') {
      where.hospital_id = filters.hospital_id;
    }

    const total = await prisma.alerts.count({ where });
    const alerts = await prisma.alerts.findMany({
      where,
      include: {
        hospitals: {
          select: { name: true, city: true, province: true }
        },
        projects: {
          select: { name: true }
        },
        resolver: {
          select: { name: true, email: true }
        }
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { created_at: 'desc' },
    });

    const formattedAlerts: Alert[] = alerts.map((a) => ({
      id: a.id,
      hospital_id: a.hospital_id,
      hospital_name: a.hospitals?.name || 'Hospital no encontrado',
      project_name: a.projects?.name,
      title: a.title,
      message: a.message,
      type: a.type,
      severity: a.severity,
      is_resolved: a.is_resolved,
      auto_resolved: a.auto_resolved,
      created_at: a.created_at,
      resolved_at: a.resolved_at,
      resolved_by: a.resolved_by,
      resolver_name: a.resolver?.name,
      metadata: a.metadata || {},
    }));

    return {
      alerts: formattedAlerts,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  } catch (error) {
    console.error('Error obteniendo alertas:', error);
    // En caso de error, devolver lista vacía
    return {
      alerts: [],
      total: 0,
      page: 1,
      totalPages: 0
    };
  }
}

export async function getAlertById(id: string) {
  const alert = await prisma.alerts.findUnique({
    where: { id },
    include: {
      hospitals: true
    },
  });

  if (!alert) {
    return null;
  }

  return {
    id: alert.id,
    hospital_id: alert.hospital_id,
    hospital_name: alert.hospitals?.name || 'Hospital no encontrado',
    title: alert.title,
    message: alert.message,
    type: alert.type,
    is_resolved: alert.is_resolved,
    created_at: alert.created_at,
    resolved_at: alert.resolved_at,
    resolved_by: alert.resolved_by,
    metadata: alert.metadata || {},
  };
}

export async function getAlertStats() {
  try {
    const [
      total,
      active,
      resolved,
      critical,
      high,
      medium,
      low
    ] = await Promise.all([
      prisma.alerts.count(),
      prisma.alerts.count({ where: { is_resolved: false } }),
      prisma.alerts.count({ where: { is_resolved: true } }),
      prisma.alerts.count({ where: { severity: 'critical' } }),
      prisma.alerts.count({ where: { severity: 'high' } }),
      prisma.alerts.count({ where: { severity: 'medium' } }),
      prisma.alerts.count({ where: { severity: 'low' } })
    ]);

    return {
      total,
      active,
      resolved,
      critical,
      high,
      medium,
      low
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas de alertas:', error);
    // En caso de error, devolver estadísticas vacías
    return {
      total: 0,
      active: 0,
      resolved: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };
  }
}

export async function getAlertTypes() {
  try {
    const types = await prisma.alerts.findMany({
      select: { type: true },
      distinct: ['type'],
      orderBy: { type: 'asc' }
    });

    const dbTypes = types.map(t => t.type).filter(Boolean);
    
    // Si no hay tipos en la base de datos, devolver los tipos por defecto
    if (dbTypes.length === 0) {
      return [
        'ethics_approval_pending',
        'missing_documentation', 
        'upcoming_recruitment_period',
        'no_activity_30_days',
        'low_completion_rate'
      ];
    }

    return dbTypes;
  } catch (error) {
    console.error('Error obteniendo tipos de alertas:', error);
    // En caso de error, devolver tipos por defecto
    return [
      'ethics_approval_pending',
      'missing_documentation', 
      'upcoming_recruitment_period',
      'no_activity_30_days',
      'low_completion_rate'
    ];
  }
}

/**
 * Resuelve una alerta manualmente
 */
export async function resolveAlert(alertId: string, userId: string, isAuto: boolean = false) {
  try {
    const alert = await prisma.alerts.update({
      where: { id: alertId },
      data: {
        is_resolved: true,
        resolved_at: new Date(),
        resolved_by: isAuto ? null : userId,
        auto_resolved: isAuto
      }
    });

    return { success: true, alert };
  } catch (error) {
    console.error('Error resolviendo alerta:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    };
  }
}

/**
 * Obtiene configuración de un tipo de alerta
 */
export async function getAlertConfiguration(alertType: string) {
  try {
    const config = await prisma.alert_configurations.findUnique({
      where: { alert_type: alertType }
    });

    return config;
  } catch (error) {
    console.error('Error obteniendo configuración de alerta:', error);
    return null;
  }
}

/**
 * Actualiza configuración de un tipo de alerta
 */
export async function updateAlertConfiguration(alertType: string, config: {
  enabled?: boolean;
  notify_admin?: boolean;
  notify_coordinator?: boolean;
  auto_send_email?: boolean;
  threshold_value?: number;
  email_template_id?: string;
}) {
  try {
    const updatedConfig = await prisma.alert_configurations.upsert({
      where: { alert_type: alertType },
      update: config,
      create: {
        alert_type: alertType,
        ...config
      }
    });

    return { success: true, config: updatedConfig };
  } catch (error) {
    console.error('Error actualizando configuración de alerta:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    };
  }
}

/**
 * Obtiene todas las configuraciones de alertas
 */
export async function getAllAlertConfigurations() {
  try {
    const configs = await prisma.alert_configurations.findMany({
      orderBy: { alert_type: 'asc' }
    });

    return configs;
  } catch (error) {
    console.error('Error obteniendo configuraciones de alertas:', error);
    return [];
  }
}

/**
 * Obtiene estadísticas de alertas por severidad
 */
export async function getAlertStatsBySeverity() {
  try {
    const stats = await prisma.alerts.groupBy({
      by: ['severity'],
      _count: { severity: true },
      where: { is_resolved: false }
    });

    return stats.reduce((acc, stat) => {
      acc[stat.severity] = stat._count.severity;
      return acc;
    }, {} as Record<string, number>);
  } catch (error) {
    console.error('Error obteniendo estadísticas por severidad:', error);
    return {};
  }
}