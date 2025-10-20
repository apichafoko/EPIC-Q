import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { getAlertStats } from '@/lib/services/alert-service';

// GET - Obtener estadísticas de alertas
export const GET = withAuth(async (request: NextRequest, context: any) => {
  try {
    const stats = await getAlertStats();

    return NextResponse.json({
      success: true,
      ...stats
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas de alertas:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido'
      }, 
      { status: 500 }
    );
  }
});