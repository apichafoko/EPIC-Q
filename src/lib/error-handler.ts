import { AuditService } from './audit-service';
import { NextRequest } from 'next/server';

// Tipos para logging estructurado
export interface ErrorContext {
  userId?: string;
  userName?: string;
  resource?: string;
  resourceId?: string;
  action?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface LogEntry {
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  error?: Error;
  context?: ErrorContext;
  timestamp: Date;
  stack?: string;
}

class ErrorHandler {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private sentryEnabled = false;

  constructor() {
    // Verificar si Sentry está disponible
    if (typeof window !== 'undefined') {
      // Client-side
      this.sentryEnabled = !!(
        (window as any).Sentry || process.env.NEXT_PUBLIC_SENTRY_DSN
      );
    } else {
      // Server-side
      this.sentryEnabled = !!process.env.SENTRY_DSN;
    }
  }

  /**
   * Capturar y manejar un error
   */
  async captureError(
    error: Error,
    context?: ErrorContext,
    request?: NextRequest
  ): Promise<void> {
    const logEntry: LogEntry = {
      level: 'error',
      message: error.message,
      error,
      context,
      timestamp: new Date(),
      stack: error.stack,
    };

    // Agregar a logs locales
    this.addLog(logEntry);

    // Extraer información de la request si está disponible
    let ipAddress = context?.ipAddress;
    let userAgent = context?.userAgent;

    if (request) {
      const requestInfo = AuditService.extractRequestInfo(request);
      ipAddress = ipAddress || requestInfo.ipAddress;
      userAgent = userAgent || requestInfo.userAgent;
    }

    // Crear log de auditoría
    try {
      await AuditService.logAction(
        context?.userId,
        context?.userName,
        context?.action || 'error',
        context?.resource || 'system',
        context?.resourceId,
        {
          errorMessage: error.message,
          errorName: error.name,
          stack: error.stack,
          ...context?.metadata,
        },
        ipAddress,
        userAgent,
        'error',
        error.message,
        {
          type: 'error',
          severity: this.getSeverity(error),
        }
      );
    } catch (auditError) {
      console.error('Error creating audit log:', auditError);
    }

    // Enviar a Sentry si está disponible
    if (this.sentryEnabled) {
      try {
        await this.sendToSentry(error, context);
      } catch (sentryError) {
        console.error('Error sending to Sentry:', sentryError);
      }
    }

    // Log a consola en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.error('Error captured:', {
        message: error.message,
        stack: error.stack,
        context,
      });
    }
  }

  /**
   * Capturar una advertencia
   */
  async captureWarning(
    message: string,
    context?: ErrorContext,
    request?: NextRequest
  ): Promise<void> {
    const logEntry: LogEntry = {
      level: 'warn',
      message,
      context,
      timestamp: new Date(),
    };

    this.addLog(logEntry);

    let ipAddress = context?.ipAddress;
    let userAgent = context?.userAgent;

    if (request) {
      const requestInfo = AuditService.extractRequestInfo(request);
      ipAddress = ipAddress || requestInfo.ipAddress;
      userAgent = userAgent || requestInfo.userAgent;
    }

    try {
      await AuditService.logAction(
        context?.userId,
        context?.userName,
        context?.action || 'warning',
        context?.resource || 'system',
        context?.resourceId,
        context?.metadata,
        ipAddress,
        userAgent,
        'warning',
        undefined,
        { type: 'warning' }
      );
    } catch (auditError) {
      console.error('Error creating audit log:', auditError);
    }

    if (process.env.NODE_ENV === 'development') {
      console.warn('Warning captured:', { message, context });
    }
  }

  /**
   * Capturar información
   */
  async captureInfo(
    message: string,
    context?: ErrorContext,
    request?: NextRequest
  ): Promise<void> {
    const logEntry: LogEntry = {
      level: 'info',
      message,
      context,
      timestamp: new Date(),
    };

    this.addLog(logEntry);

    if (process.env.NODE_ENV === 'development') {
      console.info('Info captured:', { message, context });
    }
  }

  /**
   * Agregar log a la colección local
   */
  private addLog(log: LogEntry): void {
    this.logs.push(log);

    // Mantener solo los últimos N logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  /**
   * Enviar error a Sentry
   */
  private async sendToSentry(
    error: Error,
    context?: ErrorContext
  ): Promise<void> {
    // Sentry es una dependencia opcional - si no está instalado, simplemente no hacer nada
    if (typeof window !== 'undefined') {
      // Client-side Sentry (opcional)
      try {
        const Sentry = (window as any).Sentry;
        if (Sentry && typeof Sentry.setUser === 'function') {
          Sentry.setUser({
            id: context?.userId,
            username: context?.userName,
          });

          Sentry.setContext('error_context', {
            resource: context?.resource,
            resourceId: context?.resourceId,
            action: context?.action,
            ...context?.metadata,
          });

          Sentry.captureException(error);
        }
      } catch (sentryError) {
        // Sentry no está disponible en el cliente - ignorar silenciosamente
        console.debug('Sentry not available (optional):', sentryError);
      }
    } else {
      // Server-side Sentry - importación dinámica verdaderamente opcional
      try {
        // Solo intentar si hay DSN configurado
        if (process.env.SENTRY_DSN) {
          // Evitar resolución de módulo en build: usar dynamic import indirecto
          const dynamicImport: (m: string) => Promise<any> = new Function(
            'm',
            'return import(m)'
          ) as any;
          const moduleName = ['@sentry', '/nextjs'].join('');
          const sentryModule = await dynamicImport(moduleName).catch(() => null);
          if (sentryModule) {
            const Sentry = sentryModule.default || sentryModule;
            if (Sentry && typeof Sentry.setUser === 'function') {
              Sentry.setUser({
                id: context?.userId,
                username: context?.userName,
              });

              Sentry.setContext('error_context', {
                resource: context?.resource,
                resourceId: context?.resourceId,
                action: context?.action,
                ...context?.metadata,
              });

              Sentry.captureException(error);
            }
          }
        }
      } catch (importError) {
        // Sentry no está instalado o no disponible; es opcional
      }
    }
  }

  /**
   * Determinar severidad del error
   */
  private getSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
    // Lógica básica para determinar severidad
    if (error.message.includes('database') || error.message.includes('connection')) {
      return 'critical';
    }
    if (error.message.includes('unauthorized') || error.message.includes('forbidden')) {
      return 'high';
    }
    if (error.message.includes('not found')) {
      return 'low';
    }
    return 'medium';
  }

  /**
   * Obtener logs recientes
   */
  getLogs(level?: LogEntry['level'], limit: number = 100): LogEntry[] {
    let filtered = this.logs;

    if (level) {
      filtered = filtered.filter((log) => log.level === level);
    }

    return filtered.slice(-limit);
  }

  /**
   * Obtener estadísticas de errores
   */
  getErrorStatistics(): {
    total: number;
    byLevel: Record<string, number>;
    recentErrors: LogEntry[];
  } {
    const byLevel: Record<string, number> = {
      error: 0,
      warn: 0,
      info: 0,
      debug: 0,
    };

    this.logs.forEach((log) => {
      byLevel[log.level] = (byLevel[log.level] || 0) + 1;
    });

    const recentErrors = this.logs
      .filter((log) => log.level === 'error')
      .slice(-10);

    return {
      total: this.logs.length,
      byLevel,
      recentErrors,
    };
  }

  /**
   * Limpiar logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Formatear log como JSON estructurado
   */
  formatLog(log: LogEntry): string {
    return JSON.stringify({
      timestamp: log.timestamp.toISOString(),
      level: log.level,
      message: log.message,
      error: log.error
        ? {
            name: log.error.name,
            message: log.error.message,
            stack: log.error.stack,
          }
        : undefined,
      context: log.context,
      stack: log.stack,
    });
  }
}

// Singleton instance
export const errorHandler = new ErrorHandler();

/**
 * Helper function para capturar errores en API routes
 */
export async function handleApiError(
  error: unknown,
  request: NextRequest,
  context?: ErrorContext
): Promise<Response> {
  const errorInstance =
    error instanceof Error ? error : new Error(String(error));

  await errorHandler.captureError(errorInstance, context, request);

  const statusCode = (error as any)?.statusCode || 500;
  const message =
    error instanceof Error
      ? error.message
      : 'An unexpected error occurred';

  return new Response(
    JSON.stringify({
      error: message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: errorInstance.stack,
      }),
    }),
    {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Helper function para crear un Error con contexto
 */
export class ContextualError extends Error {
  constructor(
    message: string,
    public context?: ErrorContext,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'ContextualError';
  }
}


