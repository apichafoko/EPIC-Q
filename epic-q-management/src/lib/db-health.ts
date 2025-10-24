import { prisma } from './db-connection';

// Servicio de monitoreo de salud de la base de datos
export class DatabaseHealthService {
  // Verificar salud general de la base de datos
  static async checkHealth() {
    try {
      const startTime = Date.now();
      
      // Verificar conexión básica
      await prisma.$queryRaw`SELECT 1`;
      
      // Verificar tablas principales
      const tableChecks = await Promise.allSettled([
        prisma.hospitals.count(),
        prisma.hospital_contacts.count(),
        prisma.communications.count(),
        prisma.communication_templates.count(),
        prisma.alerts.count(),
        prisma.users.count()
      ]);
      
      const responseTime = Date.now() - startTime;
      
      // Verificar integridad de datos
      const integrityCheck = await this.checkDataIntegrity();
      
      // Verificar conexiones activas
      const connectionCheck = await this.checkConnections();
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        responseTime: `${responseTime}ms`,
        tables: {
          hospitals: tableChecks[0].status === 'fulfilled' ? tableChecks[0].value : 0,
          contacts: tableChecks[1].status === 'fulfilled' ? tableChecks[1].value : 0,
          communications: tableChecks[2].status === 'fulfilled' ? tableChecks[2].value : 0,
          templates: tableChecks[3].status === 'fulfilled' ? tableChecks[3].value : 0,
          alerts: tableChecks[4].status === 'fulfilled' ? tableChecks[4].value : 0,
          users: tableChecks[5].status === 'fulfilled' ? tableChecks[5].value : 0,
        },
        integrity: integrityCheck,
        connections: connectionCheck,
        errors: tableChecks
          .filter(check => check.status === 'rejected')
          .map(check => (check as PromiseRejectedResult).reason)
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: null,
        tables: null,
        integrity: null,
        connections: null
      };
    }
  }
  
  // Verificar integridad de datos
  static async checkDataIntegrity() {
    try {
      const issues = [];
      
      // Verificar hospitales sin detalles
      const hospitalsWithoutDetails = await prisma.hospitals.count({
        where: { hospital_details: null }
      });
      if (hospitalsWithoutDetails > 0) {
        issues.push(`${hospitalsWithoutDetails} hospitales sin detalles`);
      }
      
      // Verificar hospitales sin contactos
      const hospitalsWithoutContacts = await prisma.hospitals.count({
        where: { hospital_contacts: { none: {} } }
      });
      if (hospitalsWithoutContacts > 0) {
        issues.push(`${hospitalsWithoutContacts} hospitales sin contactos`);
      }
      
      // Verificar hospitales sin progreso
      const hospitalsWithoutProgress = await prisma.hospitals.count({
        where: { hospital_progress: { none: {} } }
      });
      if (hospitalsWithoutProgress > 0) {
        issues.push(`${hospitalsWithoutProgress} hospitales sin progreso`);
      }
      
      // Verificar comunicaciones sin hospital
      const orphanedCommunications = await prisma.communications.count({
        where: { hospitals: null }
      });
      if (orphanedCommunications > 0) {
        issues.push(`${orphanedCommunications} comunicaciones huérfanas`);
      }
      
      return {
        status: issues.length === 0 ? 'healthy' : 'warning',
        issues,
        count: issues.length
      };
    } catch (error) {
      return {
        status: 'error',
        issues: [`Error al verificar integridad: ${error instanceof Error ? error.message : 'Unknown error'}`],
        count: 1
      };
    }
  }
  
  // Verificar conexiones
  static async checkConnections() {
    try {
      // Obtener información de conexiones activas
      const connectionInfo = await prisma.$queryRaw`
        SELECT 
          count(*) as active_connections,
          max(now() - state_change) as max_idle_time
        FROM pg_stat_activity 
        WHERE state = 'active'
      `;
      
      const stats = (connectionInfo as any)[0];
      
      return {
        activeConnections: parseInt(stats.active_connections) || 0,
        maxIdleTime: stats.max_idle_time || '0 seconds',
        status: 'healthy'
      };
    } catch (error) {
      return {
        activeConnections: 0,
        maxIdleTime: 'unknown',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  // Verificar rendimiento
  static async checkPerformance() {
    try {
      const startTime = Date.now();
      
      // Ejecutar consultas de prueba
      await Promise.all([
        prisma.hospitals.findMany({ take: 10 }),
        prisma.users.findMany({ take: 10 }),
        prisma.communications.findMany({ take: 10 })
      ]);
      
      const responseTime = Date.now() - startTime;
      
      return {
        status: responseTime < 1000 ? 'good' : responseTime < 3000 ? 'fair' : 'poor',
        responseTime: `${responseTime}ms`,
        threshold: '1000ms'
      };
    } catch (error) {
      return {
        status: 'error',
        responseTime: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  // Verificar espacio en disco
  static async checkDiskSpace() {
    try {
      const diskInfo = await prisma.$queryRaw<Array<{
        database_size: string;
        database_size_pretty: string;
      }>>`
        SELECT 
          pg_database_size(current_database()) as database_size,
          pg_size_pretty(pg_database_size(current_database())) as database_size_pretty
      `;
      
      const stats = diskInfo[0];
      const sizeInMB = parseInt(stats.database_size) / (1024 * 1024);
      
      return {
        size: stats.database_size_pretty,
        sizeInMB: Math.round(sizeInMB),
        status: sizeInMB < 1000 ? 'good' : sizeInMB < 5000 ? 'fair' : 'warning'
      };
    } catch (error) {
      return {
        size: 'unknown',
        sizeInMB: 0,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  // Obtener métricas de uso
  static async getUsageMetrics() {
    try {
      const [
        totalHospitals,
        activeHospitals,
        totalCommunications,
        recentCommunications,
        totalAlerts,
        activeAlerts
      ] = await Promise.all([
        prisma.hospitals.count(),
        prisma.hospitals.count({ where: { status: 'active_recruiting' } }),
        prisma.communications.count(),
        prisma.communications.count({
          where: {
            created_at: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Últimos 7 días
            }
          }
        }),
        prisma.alerts.count(),
        prisma.alerts.count({ where: { is_resolved: false } })
      ]);
      
      return {
        hospitals: {
          total: totalHospitals,
          active: activeHospitals,
          percentage: totalHospitals > 0 ? Math.round((activeHospitals / totalHospitals) * 100) : 0
        },
        communications: {
          total: totalCommunications,
          recent: recentCommunications,
          percentage: totalCommunications > 0 ? Math.round((recentCommunications / totalCommunications) * 100) : 0
        },
        alerts: {
          total: totalAlerts,
          active: activeAlerts,
          percentage: totalAlerts > 0 ? Math.round((activeAlerts / totalAlerts) * 100) : 0
        }
      };
    } catch (error) {
      return {
        hospitals: { total: 0, active: 0, percentage: 0 },
        communications: { total: 0, recent: 0, percentage: 0 },
        alerts: { total: 0, active: 0, percentage: 0 },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  // Generar reporte de salud
  static async generateHealthReport() {
    try {
      const [
        health,
        performance,
        diskSpace,
        usageMetrics
      ] = await Promise.all([
        this.checkHealth(),
        this.checkPerformance(),
        this.checkDiskSpace(),
        this.getUsageMetrics()
      ]);
      
      return {
        timestamp: new Date().toISOString(),
        overall: health.status,
        health,
        performance,
        diskSpace,
        usageMetrics,
        summary: {
          status: health.status,
          responseTime: health.responseTime,
          dataIntegrity: health.integrity?.status || 'unknown',
          performance: performance.status,
          diskUsage: diskSpace.status
        }
      };
    } catch (error) {
      return {
        timestamp: new Date().toISOString(),
        overall: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        health: null,
        performance: null,
        diskSpace: null,
        usageMetrics: null
      };
    }
  }
}
