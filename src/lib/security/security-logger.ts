import { prisma } from '../database';
import { NextRequest } from 'next/server';

export interface SecurityEvent {
  type: 'login_failed' | 'login_success' | 'unauthorized_access' | 'suspicious_activity' | 'rate_limit_exceeded' | 'password_reset' | 'account_locked' | 'ip_blocked' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  userName?: string;
  ipAddress?: string;
  userAgent?: string;
  details: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface SecurityLog {
  id: string;
  eventType: string;
  severity: string;
  userId?: string;
  userName?: string;
  ipAddress?: string;
  userAgent?: string;
  details: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface SecurityPattern {
  type: string;
  count: number;
  timeWindow: number;
  threshold: number;
}

export class SecurityLogger {
  /**
   * Registrar evento de seguridad
   */
  static async logEvent(event: SecurityEvent): Promise<void> {
    try {
      await prisma.security_logs.create({
        data: {
          event_type: event.type,
          severity: event.severity,
          user_id: event.userId || null,
          user_name: event.userName || null,
          ip_address: event.ipAddress || null,
          user_agent: event.userAgent || null,
          details: event.details,
          metadata: event.metadata || null,
        },
      });

      // Si es crítico, podría enviar alerta
      if (event.severity === 'critical') {
        await this.triggerSecurityAlert(event);
      }
    } catch (error) {
      console.error('Error logging security event:', error);
      // No fallar la aplicación si el logging falla
    }
  }

  /**
   * Registrar intento de login fallido
   */
  static async logFailedLogin(
    email: string,
    ipAddress: string,
    userAgent?: string
  ): Promise<void> {
    await this.logEvent({
      type: 'login_failed',
      severity: 'medium',
      ipAddress,
      userAgent,
      details: {
        email,
        attemptTime: new Date().toISOString(),
      },
    });
  }

  /**
   * Registrar login exitoso
   */
  static async logSuccessfulLogin(
    userId: string,
    userName: string,
    ipAddress: string,
    userAgent?: string
  ): Promise<void> {
    await this.logEvent({
      type: 'login_success',
      severity: 'low',
      userId,
      userName,
      ipAddress,
      userAgent,
      details: {
        loginTime: new Date().toISOString(),
      },
    });
  }

  /**
   * Registrar acceso no autorizado
   */
  static async logUnauthorizedAccess(
    request: NextRequest,
    resource?: string,
    action?: string
  ): Promise<void> {
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const userAgent = request.headers.get('user-agent') || undefined;

    await this.logEvent({
      type: 'unauthorized_access',
      severity: 'high',
      ipAddress,
      userAgent,
      details: {
        resource,
        action,
        path: new URL(request.url).pathname,
        method: request.method,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Registrar actividad sospechosa
   */
  static async logSuspiciousActivity(
    request: NextRequest,
    reason: string,
    details?: Record<string, any>
  ): Promise<void> {
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const userAgent = request.headers.get('user-agent') || undefined;

    await this.logEvent({
      type: 'suspicious_activity',
      severity: 'high',
      ipAddress,
      userAgent,
      details: {
        reason,
        path: new URL(request.url).pathname,
        method: request.method,
        timestamp: new Date().toISOString(),
        ...details,
      },
    });
  }

  /**
   * Registrar rate limit excedido
   */
  static async logRateLimitExceeded(
    request: NextRequest,
    endpoint: string,
    limit: number
  ): Promise<void> {
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const userAgent = request.headers.get('user-agent') || undefined;

    await this.logEvent({
      type: 'rate_limit_exceeded',
      severity: 'medium',
      ipAddress,
      userAgent,
      details: {
        endpoint,
        limit,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Obtener logs de seguridad con filtros
   */
  static async getSecurityLogs(
    filters?: {
      type?: string;
      severity?: string;
      userId?: string;
      ipAddress?: string;
      dateFrom?: Date;
      dateTo?: Date;
    },
    limit: number = 100,
    offset: number = 0
  ): Promise<{ logs: SecurityLog[]; total: number }> {
    const where: any = {};

    if (filters?.type) {
      where.event_type = filters.type;
    }

    if (filters?.severity) {
      where.severity = filters.severity;
    }

    if (filters?.userId) {
      where.user_id = filters.userId;
    }

    if (filters?.ipAddress) {
      where.ip_address = filters.ipAddress;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.created_at = {};
      if (filters.dateFrom) {
        where.created_at.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.created_at.lte = filters.dateTo;
      }
    }

    const [logs, total] = await Promise.all([
      prisma.security_logs.findMany({
        where,
        orderBy: { created_at: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.security_logs.count({ where }),
    ]);

    return {
      logs: logs.map((log) => ({
        id: log.id,
        eventType: log.event_type,
        severity: log.severity,
        userId: log.user_id || undefined,
        userName: log.user_name || undefined,
        ipAddress: log.ip_address || undefined,
        userAgent: log.user_agent || undefined,
        details: log.details as Record<string, any>,
        metadata: log.metadata as Record<string, any> | undefined,
        createdAt: log.created_at,
      })),
      total,
    };
  }

  /**
   * Detectar patrones sospechosos
   */
  static async detectSuspiciousPatterns(
    patterns: SecurityPattern[]
  ): Promise<{ pattern: string; detected: boolean; count: number }[]> {
    const results = [];

    for (const pattern of patterns) {
      const timeWindow = new Date();
      timeWindow.setMinutes(timeWindow.getMinutes() - pattern.timeWindow);

      const count = await prisma.security_logs.count({
        where: {
          event_type: pattern.type,
          created_at: {
            gte: timeWindow,
          },
        },
      });

      results.push({
        pattern: pattern.type,
        detected: count >= pattern.threshold,
        count,
      });
    }

    return results;
  }

  /**
   * Obtener estadísticas de seguridad
   */
  static async getSecurityStatistics(
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<{
    totalEvents: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    topIPs: { ip: string; count: number }[];
    recentCritical: SecurityLog[];
  }> {
    const where: any = {};

    if (dateFrom || dateTo) {
      where.created_at = {};
      if (dateFrom) {
        where.created_at.gte = dateFrom;
      }
      if (dateTo) {
        where.created_at.lte = dateTo;
      }
    }

    const logs = await prisma.security_logs.findMany({
      where,
    });

    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    const ipCounts: Record<string, number> = {};

    logs.forEach((log) => {
      byType[log.event_type] = (byType[log.event_type] || 0) + 1;
      bySeverity[log.severity] = (bySeverity[log.severity] || 0) + 1;

      if (log.ip_address) {
        ipCounts[log.ip_address] = (ipCounts[log.ip_address] || 0) + 1;
      }
    });

    const topIPs = Object.entries(ipCounts)
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const recentCritical = logs
      .filter((log) => log.severity === 'critical')
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .slice(0, 10)
      .map((log) => ({
        id: log.id,
        eventType: log.event_type,
        severity: log.severity,
        userId: log.user_id || undefined,
        userName: log.user_name || undefined,
        ipAddress: log.ip_address || undefined,
        userAgent: log.user_agent || undefined,
        details: log.details as Record<string, any>,
        metadata: log.metadata as Record<string, any> | undefined,
        createdAt: log.created_at,
      }));

    return {
      totalEvents: logs.length,
      byType,
      bySeverity,
      topIPs,
      recentCritical,
    };
  }

  /**
   * Trigger alerta de seguridad (puede enviar email o notificación)
   */
  private static async triggerSecurityAlert(event: SecurityEvent): Promise<void> {
    // Implementar lógica de alerta (email, notificación push, etc.)
    console.warn('SECURITY ALERT:', event);
    
    // Aquí podrías:
    // - Enviar email a administradores
    // - Enviar notificación push
    // - Integrar con sistemas de monitoreo externos
  }
}


