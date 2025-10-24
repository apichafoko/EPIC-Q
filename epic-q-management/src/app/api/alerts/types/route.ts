import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { getAlertTypes } from '@/lib/services/alert-service';

// GET - Obtener tipos de alertas
export async function GET(request: NextRequest) {
  return withAuth(async (request: NextRequest, context: any) => {
  try {
    const types = await getAlertTypes();

    return NextResponse.json({
      success: true,
      types
    });

  } catch (error) {
    console.error('Error obteniendo tipos de alertas:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido'
      }, 
      { status: 500 }
    );
  }
  })(request);
}