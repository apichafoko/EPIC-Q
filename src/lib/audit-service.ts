import { prisma } from './database';

export interface AuditLog {
  id: string;
  userId?: string;
  userName?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  status?: 'success' | 'error' | 'warning';
  errorMessage?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface AuditLogFilters {
  userId?: string;
  resource?: string;
  resourceId?: string;
  action?: string;
  status?: 'success' | 'error' | 'warning';
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

export interface AuditLogPagination {
  page?: number;
  limit?: number;
}

export interface AuditLogResult {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class AuditService {
  /**
   * Crear un log de auditoría
   */
  static async logAction(
    userId: string | undefined,
    userName: string | undefined,
    action: string,
    resource: string,
    resourceId?: string,
    details?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
    status: 'success' | 'error' | 'warning' = 'success',
    errorMessage?: string,
    metadata?: Record<string, any>
  ): Promise<AuditLog> {
    try {
      const auditLog = await prisma.audit_logs.create({
        data: {
          user_id: userId || null,
          user_name: userName || null,
          action,
          resource,
          resource_id: resourceId || null,
          details: details ? details : null,
          ip_address: ipAddress || null,
          user_agent: userAgent || null,
          status: status || null,
          error_message: errorMessage || null,
          metadata: metadata ? metadata : null,
        },
      });

      return {
        id: auditLog.id,
        userId: auditLog.user_id || undefined,
        userName: auditLog.user_name || undefined,
        action: auditLog.action,
        resource: auditLog.resource,
        resourceId: auditLog.resource_id || undefined,
        details: auditLog.details as Record<string, any> | undefined,
        ipAddress: auditLog.ip_address || undefined,
        userAgent: auditLog.user_agent || undefined,
        status: auditLog.status as 'success' | 'error' | 'warning' | undefined,
        errorMessage: auditLog.error_message || undefined,
        metadata: auditLog.metadata as Record<string, any> | undefined,
        timestamp: auditLog.created_at,
      };
    } catch (error) {
      console.error('Error creating audit log:', error);
      // No lanzar error para no interrumpir el flujo principal
      // Retornar un log básico
      return {
        id: `error_${Date.now()}`,
        userId,
        userName,
        action,
        resource,
        resourceId,
        details,
        timestamp: new Date(),
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Obtener logs con filtros y paginación
   */
  static async getLogs(
    filters?: AuditLogFilters,
    pagination?: AuditLogPagination
  ): Promise<AuditLogResult> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.userId) {
      where.user_id = filters.userId;
    }

    if (filters?.resource) {
      where.resource = filters.resource;
    }

    if (filters?.resourceId) {
      where.resource_id = filters.resourceId;
    }

    if (filters?.action) {
      where.action = filters.action;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.startDate || filters?.endDate) {
      where.created_at = {};
      if (filters.startDate) {
        where.created_at.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.created_at.lte = filters.endDate;
      }
    }

    if (filters?.search) {
      where.OR = [
        { action: { contains: filters.search, mode: 'insensitive' } },
        { resource: { contains: filters.search, mode: 'insensitive' } },
        { user_name: { contains: filters.search, mode: 'insensitive' } },
        { error_message: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    try {
      const [logs, total] = await Promise.all([
        prisma.audit_logs.findMany({
          where,
          skip,
          take: limit,
          orderBy: { created_at: 'desc' },
        }),
        prisma.audit_logs.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        logs: logs.map((log) => ({
          id: log.id,
          userId: log.user_id || undefined,
          userName: log.user_name || undefined,
          action: log.action,
          resource: log.resource,
          resourceId: log.resource_id || undefined,
          details: log.details as Record<string, any> | undefined,
          ipAddress: log.ip_address || undefined,
          userAgent: log.user_agent || undefined,
          status: log.status as 'success' | 'error' | 'warning' | undefined,
          errorMessage: log.error_message || undefined,
          metadata: log.metadata as Record<string, any> | undefined,
          timestamp: log.created_at,
        })),
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      console.error('Error getting audit logs:', error);
      throw error;
    }
  }

  /**
   * Obtener logs por recurso específico
   */
  static async getLogsByResource(
    resource: string,
    resourceId: string,
    limit: number = 50
  ): Promise<AuditLog[]> {
    try {
      const logs = await prisma.audit_logs.findMany({
        where: {
          resource,
          resource_id: resourceId,
        },
        take: limit,
        orderBy: { created_at: 'desc' },
      });

      return logs.map((log) => ({
        id: log.id,
        userId: log.user_id || undefined,
        userName: log.user_name || undefined,
        action: log.action,
        resource: log.resource,
        resourceId: log.resource_id || undefined,
        details: log.details as Record<string, any> | undefined,
        ipAddress: log.ip_address || undefined,
        userAgent: log.user_agent || undefined,
        status: log.status as 'success' | 'error' | 'warning' | undefined,
        errorMessage: log.error_message || undefined,
        metadata: log.metadata as Record<string, any> | undefined,
        timestamp: log.created_at,
      }));
    } catch (error) {
      console.error('Error getting logs by resource:', error);
      throw error;
    }
  }

  /**
   * Obtener logs por usuario
   */
  static async getLogsByUser(
    userId: string,
    limit: number = 50
  ): Promise<AuditLog[]> {
    try {
      const logs = await prisma.audit_logs.findMany({
        where: {
          user_id: userId,
        },
        take: limit,
        orderBy: { created_at: 'desc' },
      });

      return logs.map((log) => ({
        id: log.id,
        userId: log.user_id || undefined,
        userName: log.user_name || undefined,
        action: log.action,
        resource: log.resource,
        resourceId: log.resource_id || undefined,
        details: log.details as Record<string, any> | undefined,
        ipAddress: log.ip_address || undefined,
        userAgent: log.user_agent || undefined,
        status: log.status as 'success' | 'error' | 'warning' | undefined,
        errorMessage: log.error_message || undefined,
        metadata: log.metadata as Record<string, any> | undefined,
        timestamp: log.created_at,
      }));
    } catch (error) {
      console.error('Error getting logs by user:', error);
      throw error;
    }
  }

  /**
   * Exportar logs a formato CSV
   */
  static async exportToCSV(filters?: AuditLogFilters): Promise<string> {
    const result = await this.getLogs(filters, { page: 1, limit: 10000 });
    
    const headers = [
      'ID',
      'Fecha',
      'Usuario',
      'Nombre Usuario',
      'Acción',
      'Recurso',
      'ID Recurso',
      'Estado',
      'IP',
      'Detalles',
      'Error',
    ];

    const rows = result.logs.map((log) => [
      log.id,
      log.timestamp.toISOString(),
      log.userId || '',
      log.userName || '',
      log.action,
      log.resource,
      log.resourceId || '',
      log.status || '',
      log.ipAddress || '',
      log.details ? JSON.stringify(log.details) : '',
      log.errorMessage || '',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    return csv;
  }

  /**
   * Limpiar logs antiguos (basado en retención configurable)
   */
  static async cleanOldLogs(retentionDays: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const result = await prisma.audit_logs.deleteMany({
        where: {
          created_at: {
            lt: cutoffDate,
          },
        },
      });

      return result.count;
    } catch (error) {
      console.error('Error cleaning old logs:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de auditoría
   */
  static async getStatistics(
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    total: number;
    byAction: Record<string, number>;
    byResource: Record<string, number>;
    byStatus: Record<string, number>;
    errors: number;
    topUsers: Array<{ userId: string; userName: string; count: number }>;
  }> {
    try {
      const where: any = {};
      if (startDate || endDate) {
        where.created_at = {};
        if (startDate) where.created_at.gte = startDate;
        if (endDate) where.created_at.lte = endDate;
      }

      const [total, byAction, byResource, byStatus, errors, topUsers] =
        await Promise.all([
          prisma.audit_logs.count({ where }),
          prisma.audit_logs.groupBy({
            by: ['action'],
            where,
            _count: { action: true },
          }),
          prisma.audit_logs.groupBy({
            by: ['resource'],
            where,
            _count: { resource: true },
          }),
          prisma.audit_logs.groupBy({
            by: ['status'],
            where,
            _count: { status: true },
          }),
          prisma.audit_logs.count({
            where: { ...where, status: 'error' },
          }),
          prisma.audit_logs.groupBy({
            by: ['user_id', 'user_name'],
            where: {
              ...where,
              user_id: { not: null },
            },
            _count: { user_id: true },
            orderBy: { _count: { user_id: 'desc' } },
            take: 10,
          }),
        ]);

      return {
        total,
        byAction: byAction.reduce(
          (acc, item) => ({ ...acc, [item.action]: item._count.action }),
          {} as Record<string, number>
        ),
        byResource: byResource.reduce(
          (acc, item) => ({ ...acc, [item.resource]: item._count.resource }),
          {} as Record<string, number>
        ),
        byStatus: byStatus.reduce(
          (acc, item) => ({
            ...acc,
            [item.status || 'unknown']: item._count.status,
          }),
          {} as Record<string, number>
        ),
        errors,
        topUsers: topUsers.map((item) => ({
          userId: item.user_id || '',
          userName: item.user_name || 'Unknown',
          count: item._count.user_id,
        })),
      };
    } catch (error) {
      console.error('Error getting audit statistics:', error);
      throw error;
    }
  }

  /**
   * Método helper para extraer IP y User-Agent de un Request de Next.js
   */
  static extractRequestInfo(request: Request): {
    ipAddress?: string;
    userAgent?: string;
  } {
    const ipAddress =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      undefined;

    const userAgent = request.headers.get('user-agent') || undefined;

    return { ipAddress, userAgent };
  }
}
