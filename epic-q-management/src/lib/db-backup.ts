import { prisma } from './db-connection';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';

// Servicio de backup y restauración de base de datos
export class DatabaseBackupService {
  private static backupDir = join(process.cwd(), 'backups');
  
  // Crear backup completo de la base de datos
  static async createBackup(backupName?: string): Promise<{ success: boolean; filename?: string; error?: string }> {
    try {
      // Crear directorio de backups si no existe
      await mkdir(this.backupDir, { recursive: true });
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = backupName || `epicq-backup-${timestamp}.json`;
      const filepath = join(this.backupDir, filename);
      
      console.log('🔄 Creando backup de la base de datos...');
      
      // Obtener todos los datos
      const backupData = {
        metadata: {
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          database: 'epicq',
          tables: [
            'hospitals',
            'hospital_details',
            'contacts',
            'hospital_progress',
            'recruitment_periods',
            'case_metrics',
            'communications',
            'email_templates',
            'alerts',
            'users',
            'activity_log'
          ]
        },
        data: {
          hospitals: await prisma.hospital.findMany(),
          hospital_details: await prisma.hospitalDetails.findMany(),
          contacts: await prisma.contact.findMany(),
          hospital_progress: await prisma.hospitalProgress.findMany(),
          recruitment_periods: await prisma.recruitmentPeriod.findMany(),
          case_metrics: await prisma.caseMetrics.findMany(),
          communications: await prisma.communication.findMany(),
          email_templates: await prisma.emailTemplate.findMany(),
          alerts: await prisma.alert.findMany(),
          users: await prisma.user.findMany(),
          activity_logs: await prisma.activityLog.findMany()
        }
      };
      
      // Escribir archivo de backup
      await writeFile(filepath, JSON.stringify(backupData, null, 2));
      
      console.log(`✅ Backup creado exitosamente: ${filename}`);
      
      return {
        success: true,
        filename
      };
    } catch (error) {
      console.error('❌ Error al crear backup:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Restaurar base de datos desde backup
  static async restoreBackup(filename: string): Promise<{ success: boolean; error?: string }> {
    try {
      const filepath = join(this.backupDir, filename);
      
      console.log(`🔄 Restaurando backup: ${filename}`);
      
      // Leer archivo de backup
      const backupContent = await readFile(filepath, 'utf-8');
      const backupData = JSON.parse(backupContent);
      
      // Verificar formato del backup
      if (!backupData.metadata || !backupData.data) {
        throw new Error('Formato de backup inválido');
      }
      
      // Limpiar datos existentes
      console.log('🧹 Limpiando datos existentes...');
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
      
      // Restaurar datos
      console.log('📥 Restaurando datos...');
      
      if (backupData.data.hospitals) {
        await prisma.hospital.createMany({ data: backupData.data.hospitals });
      }
      
      if (backupData.data.hospital_details) {
        await prisma.hospitalDetails.createMany({ data: backupData.data.hospital_details });
      }
      
      if (backupData.data.contacts) {
        await prisma.contact.createMany({ data: backupData.data.contacts });
      }
      
      if (backupData.data.hospital_progress) {
        await prisma.hospitalProgress.createMany({ data: backupData.data.hospital_progress });
      }
      
      if (backupData.data.recruitment_periods) {
        await prisma.recruitmentPeriod.createMany({ data: backupData.data.recruitment_periods });
      }
      
      if (backupData.data.case_metrics) {
        await prisma.caseMetrics.createMany({ data: backupData.data.case_metrics });
      }
      
      if (backupData.data.communications) {
        await prisma.communication.createMany({ data: backupData.data.communications });
      }
      
      if (backupData.data.email_templates) {
        await prisma.emailTemplate.createMany({ data: backupData.data.email_templates });
      }
      
      if (backupData.data.alerts) {
        await prisma.alert.createMany({ data: backupData.data.alerts });
      }
      
      if (backupData.data.users) {
        await prisma.user.createMany({ data: backupData.data.users });
      }
      
      if (backupData.data.activity_logs) {
        await prisma.activityLog.createMany({ data: backupData.data.activity_logs });
      }
      
      console.log('✅ Backup restaurado exitosamente');
      
      return {
        success: true
      };
    } catch (error) {
      console.error('❌ Error al restaurar backup:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Listar backups disponibles
  static async listBackups(): Promise<{ success: boolean; backups?: any[]; error?: string }> {
    try {
      const { readdir, stat } = await import('fs/promises');
      
      const files = await readdir(this.backupDir);
      const backupFiles = files.filter(file => file.endsWith('.json'));
      
      const backups = await Promise.all(
        backupFiles.map(async (file) => {
          const filepath = join(this.backupDir, file);
          const stats = await stat(filepath);
          
          return {
            filename: file,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime
          };
        })
      );
      
      return {
        success: true,
        backups: backups.sort((a, b) => b.created.getTime() - a.created.getTime())
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Eliminar backup
  static async deleteBackup(filename: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { unlink } = await import('fs/promises');
      const filepath = join(this.backupDir, filename);
      
      await unlink(filepath);
      
      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Crear backup incremental
  static async createIncrementalBackup(since: Date): Promise<{ success: boolean; filename?: string; error?: string }> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `epicq-incremental-${timestamp}.json`;
      const filepath = join(this.backupDir, filename);
      
      console.log(`🔄 Creando backup incremental desde ${since.toISOString()}`);
      
      const backupData = {
        metadata: {
          timestamp: new Date().toISOString(),
          type: 'incremental',
          since: since.toISOString(),
          version: '1.0.0'
        },
        data: {
          hospitals: await prisma.hospital.findMany({
            where: { updated_at: { gte: since } }
          }),
          communications: await prisma.communication.findMany({
            where: { created_at: { gte: since } }
          }),
          alerts: await prisma.alert.findMany({
            where: { created_at: { gte: since } }
          }),
          activity_logs: await prisma.activityLog.findMany({
            where: { created_at: { gte: since } }
          })
        }
      };
      
      await writeFile(filepath, JSON.stringify(backupData, null, 2));
      
      return {
        success: true,
        filename
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Limpiar backups antiguos
  static async cleanOldBackups(retentionDays: number = 30): Promise<{ success: boolean; deleted: number; error?: string }> {
    try {
      const { readdir, stat, unlink } = await import('fs/promises');
      
      const files = await readdir(this.backupDir);
      const backupFiles = files.filter(file => file.endsWith('.json'));
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      
      let deleted = 0;
      
      for (const file of backupFiles) {
        const filepath = join(this.backupDir, file);
        const stats = await stat(filepath);
        
        if (stats.birthtime < cutoffDate) {
          await unlink(filepath);
          deleted++;
        }
      }
      
      return {
        success: true,
        deleted
      };
    } catch (error) {
      return {
        success: false,
        deleted: 0,
        error: error.message
      };
    }
  }
  
  // Verificar integridad del backup
  static async verifyBackup(filename: string): Promise<{ success: boolean; valid: boolean; error?: string }> {
    try {
      const filepath = join(this.backupDir, filename);
      const backupContent = await readFile(filepath, 'utf-8');
      const backupData = JSON.parse(backupContent);
      
      // Verificar estructura básica
      if (!backupData.metadata || !backupData.data) {
        return {
          success: true,
          valid: false,
          error: 'Estructura de backup inválida'
        };
      }
      
      // Verificar que tenga las tablas principales
      const requiredTables = ['hospitals', 'contacts', 'communications'];
      const hasRequiredTables = requiredTables.every(table => 
        backupData.data[table] && Array.isArray(backupData.data[table])
      );
      
      if (!hasRequiredTables) {
        return {
          success: true,
          valid: false,
          error: 'Faltan tablas requeridas en el backup'
        };
      }
      
      return {
        success: true,
        valid: true
      };
    } catch (error) {
      return {
        success: false,
        valid: false,
        error: error.message
      };
    }
  }
}
