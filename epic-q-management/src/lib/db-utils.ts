import { prisma } from './database';

// Utilidades para la base de datos
export class DatabaseUtils {
  // Verificar conexión
  static async testConnection() {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { success: true, message: 'Conexión exitosa' };
    } catch (error) {
      return { success: false, message: `Error de conexión: ${error}` };
    }
  }

  // Obtener información de la base de datos
  static async getDatabaseInfo() {
    try {
      const version = await prisma.$queryRaw`SELECT version()`;
      const currentTime = await prisma.$queryRaw`SELECT NOW()`;
      
      return {
        version: version[0]?.version || 'Unknown',
        currentTime: currentTime[0]?.now || new Date(),
        connected: true
      };
    } catch (error) {
      return {
        version: 'Unknown',
        currentTime: new Date(),
        connected: false,
        error: error
      };
    }
  }

  // Ejecutar consulta personalizada
  static async executeQuery(query: string) {
    try {
      const result = await prisma.$queryRawUnsafe(query);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error };
    }
  }

  // Obtener estadísticas de tablas
  static async getTableStats() {
    try {
      const tables = [
        'hospitals',
        'contacts',
        'hospital_details',
        'hospital_progress',
        'recruitment_periods',
        'case_metrics',
        'communications',
        'email_templates',
        'alerts',
        'users',
        'activity_log'
      ];

      const stats = {};
      
      for (const table of tables) {
        try {
          const count = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM ${table}`);
          stats[table] = count[0]?.count || 0;
        } catch (error) {
          stats[table] = 0;
        }
      }

      return stats;
    } catch (error) {
      throw error;
    }
  }

  // Limpiar datos de prueba
  static async cleanTestData() {
    try {
      await prisma.activity_logs.deleteMany();
      await prisma.communications.deleteMany();
      await prisma.case_metrics.deleteMany();
      await prisma.recruitment_periods.deleteMany();
      await prisma.hospital_progress.deleteMany();
      await prisma.contact.deleteMany();
      await prisma.hospital_details.deleteMany();
      await prisma.hospitals.deleteMany();
      await prisma.communication_templates.deleteMany();
      await prisma.alerts.deleteMany();
      await prisma.users.deleteMany();

      return { success: true, message: 'Datos de prueba eliminados' };
    } catch (error) {
      return { success: false, error: error };
    }
  }

  // Crear backup de datos
  static async createBackup() {
    try {
      const data = {
        hospitals: await prisma.hospitals.findMany(),
        contacts: await prisma.contact.findMany(),
        hospitalDetails: await prisma.hospital_details.findMany(),
        hospitalProgress: await prisma.hospital_progress.findMany(),
        recruitmentPeriods: await prisma.recruitment_periods.findMany(),
        caseMetrics: await prisma.case_metrics.findMany(),
        communications: await prisma.communications.findMany(),
        emailTemplates: await prisma.communication_templates.findMany(),
        alerts: await prisma.alerts.findMany(),
        users: await prisma.users.findMany(),
        activityLogs: await prisma.activity_logs.findMany()
      };

      return {
        success: true,
        data,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return { success: false, error: error };
    }
  }

  // Restaurar datos desde backup
  static async restoreFromBackup(backupData: any) {
    try {
      // Limpiar datos existentes
      await this.cleanTestData();

      // Restaurar datos
      if (backupData.hospitals) {
        await prisma.hospitals.createMany({ data: backupData.hospitals });
      }
      if (backupData.contacts) {
        await prisma.contact.createMany({ data: backupData.contacts });
      }
      if (backupData.hospitalDetails) {
        await prisma.hospital_details.createMany({ data: backupData.hospitalDetails });
      }
      if (backupData.hospitalProgress) {
        await prisma.hospital_progress.createMany({ data: backupData.hospitalProgress });
      }
      if (backupData.recruitmentPeriods) {
        await prisma.recruitment_periods.createMany({ data: backupData.recruitmentPeriods });
      }
      if (backupData.caseMetrics) {
        await prisma.case_metrics.createMany({ data: backupData.caseMetrics });
      }
      if (backupData.communications) {
        await prisma.communications.createMany({ data: backupData.communications });
      }
      if (backupData.emailTemplates) {
        await prisma.communication_templates.createMany({ data: backupData.emailTemplates });
      }
      if (backupData.alerts) {
        await prisma.alerts.createMany({ data: backupData.alerts });
      }
      if (backupData.users) {
        await prisma.users.createMany({ data: backupData.users });
      }
      if (backupData.activityLogs) {
        await prisma.activity_logs.createMany({ data: backupData.activityLogs });
      }

      return { success: true, message: 'Datos restaurados exitosamente' };
    } catch (error) {
      return { success: false, error: error };
    }
  }

  // Optimizar base de datos
  static async optimizeDatabase() {
    try {
      // Analizar tablas
      await prisma.$executeRaw`ANALYZE`;
      
      // Vacuum (solo en PostgreSQL)
      await prisma.$executeRaw`VACUUM`;
      
      return { success: true, message: 'Base de datos optimizada' };
    } catch (error) {
      return { success: false, error: error };
    }
  }

  // Verificar integridad de datos
  static async checkDataIntegrity() {
    try {
      const issues = [];

      // Verificar hospitales sin detalles
      const hospitalsWithoutDetails = await prisma.hospitals.findMany({
        where: {
          details: null
        }
      });
      if (hospitalsWithoutDetails.length > 0) {
        issues.push(`${hospitalsWithoutDetails.length} hospitales sin detalles`);
      }

      // Verificar hospitales sin contactos
      const hospitalsWithoutContacts = await prisma.hospitals.findMany({
        where: {
          contacts: {
            none: {}
          }
        }
      });
      if (hospitalsWithoutContacts.length > 0) {
        issues.push(`${hospitalsWithoutContacts.length} hospitales sin contactos`);
      }

      // Verificar hospitales sin progreso
      const hospitalsWithoutProgress = await prisma.hospitals.findMany({
        where: {
          progress: null
        }
      });
      if (hospitalsWithoutProgress.length > 0) {
        issues.push(`${hospitalsWithoutProgress.length} hospitales sin progreso`);
      }

      return {
        success: issues.length === 0,
        issues,
        message: issues.length === 0 ? 'Integridad de datos OK' : 'Se encontraron problemas de integridad'
      };
    } catch (error) {
      return { success: false, error: error };
    }
  }
}
