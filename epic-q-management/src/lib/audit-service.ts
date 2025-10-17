export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId: string;
  details?: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  private static logs: AuditLog[] = [];

  static logAction(
    userId: string,
    userName: string,
    action: string,
    resource: string,
    resourceId: string,
    details?: Record<string, any>
  ): void {
    const log: AuditLog = {
      id: Date.now().toString(),
      userId,
      userName,
      action,
      resource,
      resourceId,
      details,
      timestamp: new Date(),
      ipAddress: typeof window !== 'undefined' ? 'client-side' : 'server-side',
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server-side'
    };

    this.logs.push(log);

    // En un entorno real, esto se enviaría a un servicio de logging
    console.log('Audit Log:', log);

    // Guardar en localStorage para persistencia local
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('audit_logs');
      const existing = saved ? JSON.parse(saved) : [];
      existing.push(log);
      
      // Mantener solo los últimos 100 logs
      if (existing.length > 100) {
        existing.splice(0, existing.length - 100);
      }
      
      localStorage.setItem('audit_logs', JSON.stringify(existing));
    }
  }

  static getLogs(userId?: string, resource?: string): AuditLog[] {
    let filtered = this.logs;

    if (userId) {
      filtered = filtered.filter(log => log.userId === userId);
    }

    if (resource) {
      filtered = filtered.filter(log => log.resource === resource);
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  static getLogsByResource(resource: string, resourceId: string): AuditLog[] {
    return this.logs
      .filter(log => log.resource === resource && log.resourceId === resourceId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  static clearLogs(): void {
    this.logs = [];
    if (typeof window !== 'undefined') {
      localStorage.removeItem('audit_logs');
    }
  }

  // Cargar logs del localStorage al inicializar
  static loadFromStorage(): void {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('audit_logs');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          this.logs = parsed.map((log: any) => ({
            ...log,
            timestamp: new Date(log.timestamp)
          }));
        } catch (error) {
          console.error('Error loading audit logs:', error);
        }
      }
    }
  }
}

// Inicializar el servicio
if (typeof window !== 'undefined') {
  AuditService.loadFromStorage();
}
