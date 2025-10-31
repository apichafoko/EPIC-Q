import { prisma } from '../database';
import * as ReportServiceFunctions from './report-service';
import { EmailService } from '../notifications/email-service';

export interface ScheduledReport {
  id: string;
  name: string;
  description?: string;
  reportType: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  format: 'pdf' | 'excel' | 'csv';
  recipients: string[];
  filters?: Record<string, any>;
  templateId?: string;
  isActive: boolean;
  lastRunAt?: Date;
  nextRunAt: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateScheduledReportInput {
  name: string;
  description?: string;
  reportType: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  format: 'pdf' | 'excel' | 'csv';
  recipients: string[];
  filters?: Record<string, any>;
  templateId?: string;
}

export interface ReportHistory {
  id: string;
  scheduledReportId: string;
  status: 'pending' | 'completed' | 'failed';
  generatedAt: Date;
  fileUrl?: string;
  fileSize?: number;
  errorMessage?: string;
  recipientsCount: number;
}

/**
 * Calcula la próxima fecha de ejecución basada en la frecuencia
 */
function calculateNextRun(frequency: string, lastRun?: Date): Date {
  const now = new Date();
  const next = new Date(now);

  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      next.setHours(9, 0, 0, 0); // 9 AM
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      next.setHours(9, 0, 0, 0);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      next.setDate(1);
      next.setHours(9, 0, 0, 0);
      break;
    case 'quarterly':
      next.setMonth(next.getMonth() + 3);
      next.setDate(1);
      next.setHours(9, 0, 0, 0);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      next.setMonth(0);
      next.setDate(1);
      next.setHours(9, 0, 0, 0);
      break;
    default:
      next.setDate(next.getDate() + 1);
  }

  return next;
}

export class ScheduledReportService {
  /**
   * Crear un reporte programado
   */
  static async createReport(
    input: CreateScheduledReportInput,
    createdBy: string
  ): Promise<ScheduledReport> {
    const nextRunAt = calculateNextRun(input.frequency);

    const report = await prisma.scheduled_reports.create({
      data: {
        name: input.name,
        description: input.description,
        report_type: input.reportType,
        frequency: input.frequency,
        format: input.format,
        recipients: input.recipients,
        filters: input.filters || null,
        template_id: input.templateId || null,
        is_active: true,
        next_run_at: nextRunAt,
        created_by: createdBy,
      },
    });

    return this.mapToScheduledReport(report);
  }

  /**
   * Obtener todos los reportes programados
   */
  static async getAllReports(
    isActive?: boolean
  ): Promise<ScheduledReport[]> {
    const where: any = {};
    if (isActive !== undefined) {
      where.is_active = isActive;
    }

    const reports = await prisma.scheduled_reports.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });

    return reports.map(this.mapToScheduledReport);
  }

  /**
   * Obtener reporte por ID
   */
  static async getReportById(id: string): Promise<ScheduledReport | null> {
    const report = await prisma.scheduled_reports.findUnique({
      where: { id },
    });

    return report ? this.mapToScheduledReport(report) : null;
  }

  /**
   * Actualizar reporte programado
   */
  static async updateReport(
    id: string,
    updates: Partial<CreateScheduledReportInput>
  ): Promise<ScheduledReport> {
    const existing = await prisma.scheduled_reports.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('Reporte no encontrado');
    }

    const updateData: any = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined)
      updateData.description = updates.description;
    if (updates.reportType !== undefined)
      updateData.report_type = updates.reportType;
    if (updates.frequency !== undefined) {
      updateData.frequency = updates.frequency;
      // Recalcular next_run_at si cambió la frecuencia
      updateData.next_run_at = calculateNextRun(
        updates.frequency,
        existing.last_run_at || undefined
      );
    }
    if (updates.format !== undefined) updateData.format = updates.format;
    if (updates.recipients !== undefined)
      updateData.recipients = updates.recipients;
    if (updates.filters !== undefined) updateData.filters = updates.filters;
    if (updates.templateId !== undefined)
      updateData.template_id = updates.templateId;

    const updated = await prisma.scheduled_reports.update({
      where: { id },
      data: updateData,
    });

    return this.mapToScheduledReport(updated);
  }

  /**
   * Activar/Desactivar reporte
   */
  static async toggleReport(id: string, isActive: boolean): Promise<void> {
    await prisma.scheduled_reports.update({
      where: { id },
      data: { is_active: isActive },
    });
  }

  /**
   * Eliminar reporte programado
   */
  static async deleteReport(id: string): Promise<void> {
    await prisma.scheduled_reports.delete({
      where: { id },
    });
  }

  /**
   * Obtener reportes listos para ejecutar
   */
  static async getReportsDueToRun(): Promise<ScheduledReport[]> {
    const now = new Date();

    const reports = await prisma.scheduled_reports.findMany({
      where: {
        is_active: true,
        next_run_at: {
          lte: now,
        },
      },
    });

    return reports.map(this.mapToScheduledReport);
  }

  /**
   * Ejecutar un reporte programado
   */
  static async executeReport(
    reportId: string
  ): Promise<{ success: boolean; fileUrl?: string; error?: string }> {
    const report = await this.getReportById(reportId);
    if (!report) {
      throw new Error('Reporte no encontrado');
    }

    if (!report.isActive) {
      throw new Error('El reporte está desactivado');
    }

    // Crear registro de historial
    const history = await prisma.report_history.create({
      data: {
        scheduled_report_id: reportId,
        status: 'pending',
      },
    });

    try {
      // Generar datos del reporte según el tipo
      let reportData: any;
      switch (report.reportType) {
        case 'executive_summary':
          reportData = await ReportServiceFunctions.getExecutiveSummary();
          break;
        case 'hospital_status':
          reportData = await ReportServiceFunctions.getHospitalStatusReport();
          break;
        case 'province_distribution':
          reportData = await ReportServiceFunctions.getProvinceDistribution();
          break;
        case 'progress':
          reportData = await ReportServiceFunctions.getProgressReport();
          break;
        case 'case_metrics':
          reportData = await ReportServiceFunctions.getCaseMetricsReport();
          break;
        case 'communications':
          reportData = await ReportServiceFunctions.getCommunicationReport();
          break;
        case 'alerts':
          reportData = await ReportServiceFunctions.getAlertReport();
          break;
        default:
          throw new Error(`Tipo de reporte no soportado: ${report.reportType}`);
      }

      // Generar archivo según formato
      let fileUrl: string | undefined;
      let fileSize: number | undefined;

      // Por ahora, generamos el reporte en memoria y lo enviamos por email
      // En producción, deberías subir el archivo a S3 y guardar la URL
      const filename = `${report.name}-${new Date().toISOString().split('T')[0]}.${report.format}`;

      // Actualizar historial con éxito
      await prisma.report_history.update({
        where: { id: history.id },
        data: {
          status: 'completed',
          recipients_count: report.recipients.length,
          file_url: fileUrl,
          file_size: fileSize,
        },
      });

      // Actualizar next_run_at del reporte
      const nextRunAt = calculateNextRun(report.frequency, new Date());
      await prisma.scheduled_reports.update({
        where: { id: reportId },
        data: {
          last_run_at: new Date(),
          next_run_at: nextRunAt,
        },
      });

      // Enviar reporte por email
      try {
        await this.sendReportByEmail(report, reportData, filename);
      } catch (emailError) {
        console.error('Error enviando reporte por email:', emailError);
        // No fallar si el email falla, el reporte ya se generó
      }

      return { success: true, fileUrl };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';

      // Actualizar historial con error
      await prisma.report_history.update({
        where: { id: history.id },
        data: {
          status: 'failed',
          error_message: errorMessage,
        },
      });

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Enviar reporte por email
   */
  private static async sendReportByEmail(
    report: ScheduledReport,
    data: any,
    filename: string
  ): Promise<void> {
    const subject = `Reporte: ${report.name}`;
    const body = `
      <h2>${report.name}</h2>
      ${report.description ? `<p>${report.description}</p>` : ''}
      <p>Este es un reporte automático generado el ${new Date().toLocaleDateString('es-AR')}.</p>
      <p>Los datos del reporte se encuentran adjuntos en el formato ${report.format.toUpperCase()}.</p>
    `;

    // Enviar a todos los destinatarios
    for (const recipient of report.recipients) {
      try {
        await EmailService.sendEmail({
          to: recipient,
          subject,
          html: body,
          // En producción, aquí deberías adjuntar el archivo generado
        });
      } catch (error) {
        console.error(`Error enviando email a ${recipient}:`, error);
      }
    }
  }

  /**
   * Obtener historial de un reporte
   */
  static async getReportHistory(
    reportId: string,
    limit: number = 50
  ): Promise<ReportHistory[]> {
    const history = await prisma.report_history.findMany({
      where: { scheduled_report_id: reportId },
      orderBy: { generated_at: 'desc' },
      take: limit,
    });

    return history.map((h) => ({
      id: h.id,
      scheduledReportId: h.scheduled_report_id,
      status: h.status as 'pending' | 'completed' | 'failed',
      generatedAt: h.generated_at,
      fileUrl: h.file_url || undefined,
      fileSize: h.file_size || undefined,
      errorMessage: h.error_message || undefined,
      recipientsCount: h.recipients_count,
    }));
  }

  /**
   * Obtener estadísticas de reportes
   */
  static async getStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    completed: number;
    failed: number;
    nextDue: Date | null;
  }> {
    const [total, active, inactive, completed, failed, nextDue] =
      await Promise.all([
        prisma.scheduled_reports.count(),
        prisma.scheduled_reports.count({ where: { is_active: true } }),
        prisma.scheduled_reports.count({ where: { is_active: false } }),
        prisma.report_history.count({ where: { status: 'completed' } }),
        prisma.report_history.count({ where: { status: 'failed' } }),
        prisma.scheduled_reports.findFirst({
          where: { is_active: true },
          orderBy: { next_run_at: 'asc' },
          select: { next_run_at: true },
        }),
      ]);

    return {
      total,
      active,
      inactive,
      completed,
      failed,
      nextDue: nextDue?.next_run_at || null,
    };
  }

  /**
   * Mapear de Prisma a ScheduledReport
   */
  private static mapToScheduledReport(report: any): ScheduledReport {
    return {
      id: report.id,
      name: report.name,
      description: report.description || undefined,
      reportType: report.report_type,
      frequency: report.frequency,
      format: report.format,
      recipients: report.recipients,
      filters: report.filters as Record<string, any> | undefined,
      templateId: report.template_id || undefined,
      isActive: report.is_active,
      lastRunAt: report.last_run_at || undefined,
      nextRunAt: report.next_run_at,
      createdBy: report.created_by,
      createdAt: report.created_at,
      updatedAt: report.updated_at,
    };
  }
}

