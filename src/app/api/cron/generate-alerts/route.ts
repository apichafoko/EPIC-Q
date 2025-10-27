import { NextRequest, NextResponse } from 'next/server';
import { runAllAlertChecks } from '../../../../lib/services/alert-generation-service';

export async function GET(request: NextRequest) {
  try {
    // Verificar autorización con CRON_SECRET
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret) {
      console.error('❌ CRON_SECRET no configurado');
      return NextResponse.json(
        { error: 'CRON_SECRET no configurado' }, 
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('❌ Autorización inválida para cron job');
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    console.log('🚀 Iniciando generación automática de alertas...');
    
    // Ejecutar generación de alertas
    const results = await runAllAlertChecks();
    
    console.log('✅ Generación de alertas completada:', {
      totalGenerated: results.totalGenerated,
      totalSkipped: results.totalSkipped,
      totalErrors: results.totalErrors
    });

    return NextResponse.json({
      success: true,
      message: 'Generación de alertas completada exitosamente',
      results: {
        totalGenerated: results.totalGenerated,
        totalSkipped: results.totalSkipped,
        totalErrors: results.totalErrors,
        details: results.results.map(r => ({
          alertType: r.alertType,
          generated: r.generated,
          skipped: r.skipped,
          errors: r.errors.length
        }))
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error en cron job de generación de alertas:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      message: error instanceof Error ? error.message : 'Error desconocido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// También permitir POST para testing manual
export async function POST(request: NextRequest) {
  return GET(request);
}
