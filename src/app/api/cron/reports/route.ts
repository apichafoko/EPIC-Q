import { NextRequest, NextResponse } from 'next/server';
import { ScheduledReportService } from '@/lib/services/scheduled-report-service';

/**
 * Cron job para ejecutar reportes programados
 * Llamado por Vercel Cron o sistema similar
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar secret de cron
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Obtener reportes listos para ejecutar
    const reports = await ScheduledReportService.getReportsDueToRun();

    const results = [];

    // Ejecutar cada reporte
    for (const report of reports) {
      try {
        const result = await ScheduledReportService.executeReport(report.id);
        results.push({
          reportId: report.id,
          reportName: report.name,
          success: result.success,
          error: result.error,
        });
      } catch (error) {
        results.push({
          reportId: report.id,
          reportName: report.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      executed: results.length,
      results,
    });
  } catch (error) {
    console.error('Error ejecutando cron de reportes:', error);
    return NextResponse.json(
      {
        error: 'Error ejecutando cron',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}


