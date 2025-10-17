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
      await prisma.activityLog.deleteMany();
      await prisma.communication.deleteMany();
      await prisma.caseMetrics.deleteMany();
      await prisma.recruitmentPeriod.deleteMany();
      await prisma.hospitalProgress.deleteMany();
      await prisma.contact.deleteMany();
      await prisma.hospitalDetails.deleteMany();
      await prisma.hospital.deleteMany();
      await prisma.emailTemplate.deleteMany();
      await prisma.alert.deleteMany();
      await prisma.user.deleteMany();

      return { success: true, message: 'Datos de prueba eliminados' };
    } catch (error) {
      return { success: false, error: error };
    }
  }

  // Crear backup de datos
  static async createBackup() {
    try {
      const data = {
        hospitals: await prisma.hospital.findMany(),
        contacts: await prisma.contact.findMany(),
        hospitalDetails: await prisma.hospitalDetails.findMany(),
        hospitalProgress: await prisma.hospitalProgress.findMany(),
        recruitmentPeriods: await prisma.recruitmentPeriod.findMany(),
        caseMetrics: await prisma.caseMetrics.findMany(),
        communications: await prisma.communication.findMany(),
        emailTemplates: await prisma.emailTemplate.findMany(),
        alerts: await prisma.alert.findMany(),
        users: await prisma.user.findMany(),
        activityLogs: await prisma.activityLog.findMany()
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
        await prisma.hospital.createMany({ data: backupData.hospitals });
      }
      if (backupData.contacts) {
        await prisma.contact.createMany({ data: backupData.contacts });
      }
      if (backupData.hospitalDetails) {
        await prisma.hospitalDetails.createMany({ data: backupData.hospitalDetails });
      }
      if (backupData.hospitalProgress) {
        await prisma.hospitalProgress.createMany({ data: backupData.hospitalProgress });
      }
      if (backupData.recruitmentPeriods) {
        await prisma.recruitmentPeriod.createMany({ data: backupData.recruitmentPeriods });
      }
      if (backupData.caseMetrics) {
        await prisma.caseMetrics.createMany({ data: backupData.caseMetrics });
      }
      if (backupData.communications) {
        await prisma.communication.createMany({ data: backupData.communications });
      }
      if (backupData.emailTemplates) {
        await prisma.emailTemplate.createMany({ data: backupData.emailTemplates });
      }
      if (backupData.alerts) {
        await prisma.alert.createMany({ data: backupData.alerts });
      }
      if (backupData.users) {
        await prisma.user.createMany({ data: backupData.users });
      }
      if (backupData.activityLogs) {
        await prisma.activityLog.createMany({ data: backupData.activityLogs });
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
      const hospitalsWithoutDetails = await prisma.hospital.findMany({
        where: {
          details: null
        }
      });
      if (hospitalsWithoutDetails.length > 0) {
        issues.push(`${hospitalsWithoutDetails.length} hospitales sin detalles`);
      }

      // Verificar hospitales sin contactos
      const hospitalsWithoutContacts = await prisma.hospital.findMany({
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
      const hospitalsWithoutProgress = await prisma.hospital.findMany({
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
