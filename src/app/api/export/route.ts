import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/auth/middleware';
import { AdvancedExportService, ExportData } from '@/lib/export-advanced-service';
import { handleApiError } from '@/lib/error-handler';
import * as ReportServiceFunctions from '@/lib/services/report-service';
import { AnalyticsService } from '@/lib/services/analytics-service';

async function handler(
  req: NextRequest,
  context: AuthContext
): Promise<NextResponse> {
  try {
    if (req.method !== 'POST') {
      return NextResponse.json(
        { error: 'Method not allowed' },
        { status: 405 }
      );
    }

    const body = await req.json();
    const {
      reportType,
      format,
      templateId,
      filters,
      compress,
    }: {
      reportType: string;
      format: 'csv' | 'excel' | 'pdf';
      templateId?: string;
      filters?: Record<string, any>;
      compress?: boolean;
    } = body;

    if (!reportType || !format) {
      return NextResponse.json(
        { error: 'reportType y format son requeridos' },
        { status: 400 }
      );
    }

    // Obtener datos según el tipo de reporte
    let reportData: any;
    let data: ExportData;

    switch (reportType) {
      case 'executive_summary':
        reportData = await ReportServiceFunctions.getExecutiveSummary();
        data = {
          headers: [
            'Métrica',
            'Valor',
          ],
          rows: [
            ['Total Hospitales', reportData.totalHospitals],
            ['Hospitales Activos', reportData.activeHospitals],
            ['Total Casos', reportData.totalCases],
            ['Completitud Promedio', `${reportData.averageCompletion}%`],
            ['Alertas Activas', reportData.activeAlerts],
            ['Comunicaciones Recientes', reportData.recentCommunications],
          ],
          metadata: {
            title: 'Resumen Ejecutivo',
            generatedAt: new Date(),
            totalRows: 6,
          },
        };
        break;

      case 'hospital_status':
        reportData = await ReportServiceFunctions.getHospitalStatusReport();
        data = {
          headers: ['Estado', 'Cantidad'],
          rows: reportData.map((item: any) => [item.status, item.count]),
          metadata: {
            title: 'Estado de Hospitales',
            generatedAt: new Date(),
            totalRows: reportData.length,
          },
        };
        break;

      case 'province_distribution':
        reportData = await ReportServiceFunctions.getProvinceDistribution();
        data = {
          headers: ['Provincia', 'Cantidad'],
          rows: reportData.map((item: any) => [item.province, item.count]),
          metadata: {
            title: 'Distribución por Provincias',
            generatedAt: new Date(),
            totalRows: reportData.length,
          },
        };
        break;

      case 'progress':
        reportData = await ReportServiceFunctions.getProgressReport();
        data = {
          headers: [
            'Hospital',
            'Provincia',
            'Progreso %',
            'Ética Enviada',
            'Ética Aprobada',
            'Listo para Reclutamiento',
          ],
          rows: reportData.map((item: any) => [
            item.hospitalName,
            item.province,
            `${item.progressPercentage}%`,
            item.ethicsSubmitted ? 'Sí' : 'No',
            item.ethicsApproved ? 'Sí' : 'No',
            item.readyForRecruitment ? 'Sí' : 'No',
          ]),
          metadata: {
            title: 'Progreso por Hospital',
            generatedAt: new Date(),
            totalRows: reportData.length,
          },
        };
        break;

      case 'case_metrics':
        reportData = await ReportServiceFunctions.getCaseMetricsReport();
        data = {
          headers: [
            'Hospital',
            'Provincia',
            'Casos Creados',
            'Completitud %',
            'Fecha',
          ],
          rows: reportData.map((item: any) => [
            item.hospitalName,
            item.province,
            item.casesCreated,
            `${item.completionPercentage}%`,
            new Date(item.date).toLocaleDateString(),
          ]),
          metadata: {
            title: 'Métricas de Casos',
            generatedAt: new Date(),
            totalRows: reportData.length,
          },
        };
        break;

      case 'communications':
        reportData = await ReportServiceFunctions.getCommunicationReport();
        data = {
          headers: [
            'Hospital',
            'Provincia',
            'Tipo',
            'Asunto',
            'Enviado por',
            'Fecha',
            'Estado',
          ],
          rows: reportData.map((item: any) => [
            item.hospitalName,
            item.province,
            item.type,
            item.subject,
            item.sentBy,
            new Date(item.sentAt).toLocaleString(),
            item.status,
          ]),
          metadata: {
            title: 'Comunicaciones',
            generatedAt: new Date(),
            totalRows: reportData.length,
          },
        };
        break;

      case 'alerts':
        reportData = await ReportServiceFunctions.getAlertReport();
        data = {
          headers: [
            'Hospital',
            'Provincia',
            'Título',
            'Mensaje',
            'Severidad',
            'Resuelta',
            'Creada',
            'Resuelta en',
          ],
          rows: reportData.map((item: any) => [
            item.hospitalName,
            item.province,
            item.title,
            item.message,
            item.severity,
            item.isResolved ? 'Sí' : 'No',
            new Date(item.createdAt).toLocaleString(),
            item.resolvedAt
              ? new Date(item.resolvedAt).toLocaleString()
              : '-',
          ]),
          metadata: {
            title: 'Alertas',
            generatedAt: new Date(),
            totalRows: reportData.length,
          },
        };
        break;

      case 'hospital_progress':
        reportData = await AnalyticsService.getHospitalProgress(
          filters?.projectId,
          {
            hospitalId: filters?.hospitalId,
            province: filters?.province,
          }
        );
        data = {
          headers: [
            'Hospital',
            'Provincia',
            'Progreso %',
            'Casos Creados',
            'Completitud %',
            'Estado',
            'Ética Enviada',
            'Ética Aprobada',
            'Última Actividad',
          ],
          rows: reportData.map((item: any) => [
            item.hospitalName,
            item.province,
            `${item.progressPercentage}%`,
            item.casesCreated,
            `${item.completionPercentage}%`,
            item.status,
            item.ethicsSubmitted ? 'Sí' : 'No',
            item.ethicsApproved ? 'Sí' : 'No',
            item.lastActivity ? new Date(item.lastActivity).toLocaleDateString() : '-',
          ]),
          metadata: {
            title: 'Estado de Avance por Hospital',
            generatedAt: new Date(),
            totalRows: reportData.length,
          },
        };
        break;

      case 'recruitment_velocity':
        reportData = await AnalyticsService.getRecruitmentVelocity(
          filters?.projectId,
          {
            hospitalId: filters?.hospitalId,
            province: filters?.province,
            dateFrom: filters?.dateFrom ? new Date(filters.dateFrom) : undefined,
            dateTo: filters?.dateTo ? new Date(filters.dateTo) : undefined,
            granularity: filters?.granularity as 'day' | 'week' | 'month' | undefined,
          }
        );
        data = {
          headers: ['Fecha', 'Casos Creados', 'Casos Acumulados', 'Velocidad (casos/día)'],
          rows: reportData.map((item: any) => [
            item.date,
            item.casesCreated,
            item.cumulativeCases,
            item.velocity.toFixed(2),
          ]),
          metadata: {
            title: 'Análisis de Velocidad de Reclutamiento',
            generatedAt: new Date(),
            totalRows: reportData.length,
          },
        };
        break;

      case 'province_comparison':
        reportData = await AnalyticsService.getProvinceComparison(
          filters?.projectId,
          {
            province: filters?.province,
            dateFrom: filters?.dateFrom ? new Date(filters.dateFrom) : undefined,
            dateTo: filters?.dateTo ? new Date(filters.dateTo) : undefined,
          }
        );
        data = {
          headers: [
            'Provincia',
            'Hospitales',
            'Hospitales Activos',
            'Total Casos',
            'Progreso Promedio %',
            'Completitud Promedio %',
          ],
          rows: reportData.map((item: any) => [
            item.province,
            item.hospitalCount,
            item.activeHospitals,
            item.totalCases,
            `${item.averageProgress}%`,
            `${item.averageCompletion}%`,
          ]),
          metadata: {
            title: 'Comparativa por Provincias',
            generatedAt: new Date(),
            totalRows: reportData.length,
          },
        };
        break;

      case 'completion_prediction':
        reportData = await AnalyticsService.getCompletionPrediction(
          filters?.projectId,
          {
            hospitalId: filters?.hospitalId,
            province: filters?.province,
            level: filters?.level as 'hospital' | 'province' | 'global' | undefined,
          }
        );
        data = {
          headers: [
            'Entidad',
            'Progreso Actual %',
            'Objetivo %',
            'Días Restantes',
            'Fecha Predicha',
            'Confianza',
            'Tendencia',
          ],
          rows: reportData.map((item: any) => [
            item.entityName,
            `${item.currentProgress}%`,
            `${item.targetProgress}%`,
            item.predictedDaysRemaining || 'N/A',
            item.predictedCompletionDate
              ? new Date(item.predictedCompletionDate).toLocaleDateString()
              : 'N/A',
            item.confidence === 'high' ? 'Alta' : item.confidence === 'medium' ? 'Media' : 'Baja',
            item.trend === 'improving' ? 'Mejorando' : item.trend === 'declining' ? 'Declinando' : 'Estable',
          ]),
          metadata: {
            title: 'Predicción de Finalización',
            generatedAt: new Date(),
            totalRows: reportData.length,
          },
        };
        break;

      default:
        return NextResponse.json(
          { error: `Tipo de reporte no soportado: ${reportType}` },
          { status: 400 }
        );
    }

    // Obtener template si se especificó
    const template = templateId
      ? AdvancedExportService.getTemplate(templateId)
      : undefined;

    // Por ahora, retornamos los datos para que el cliente los exporte
    // En producción, podrías generar el archivo en el servidor y retornar la URL

    if (format === 'csv') {
      // Generar CSV
      const csvHeaders = data.headers.join(',');
      const csvRows = data.rows.map((row) =>
        row.map((cell) => {
          const value = String(cell || '');
          // Escapar comillas y valores que contengan comas
          return value.includes(',') || value.includes('"')
            ? `"${value.replace(/"/g, '""')}"`
            : value;
        }).join(',')
      );
      const csv = [csvHeaders, ...csvRows].join('\n');

      // Encoding UTF-8 con BOM para Excel
      const csvBlob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      
      return NextResponse.json({
        success: true,
        data: {
          content: csv,
          filename: `${data.metadata?.title || 'export'}-${new Date().toISOString().split('T')[0]}.csv`,
          format: 'csv',
        },
      });
    }

    // Para Excel y PDF, el cliente debe usar el servicio directamente
    // o podemos generar en el servidor usando las librerías correspondientes
    return NextResponse.json({
      success: true,
      data: {
        exportData: data,
        template: template,
        format: format,
        message: 'Use AdvancedExportService en el cliente para generar el archivo',
      },
    });
  } catch (error) {
    return handleApiError(error, req, {
      userId: context.user.id,
      userName: context.user.name,
      resource: 'export',
      action: 'export',
    });
  }
}

export async function POST(request: NextRequest) {
  return withAuth(handler)(request);
}


