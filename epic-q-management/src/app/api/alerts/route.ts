import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { getAlerts } from '@/lib/services/alert-service';

// GET - Listar alertas
export async function GET(request: NextRequest) {
  return withAuth(async (request: NextRequest, context: any) => {
  try {
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const search = searchParams.get('search') || undefined;
    const type = searchParams.get('type') || undefined;
    const status = searchParams.get('status') || undefined;
    const severity = searchParams.get('severity') || undefined;
    const hospital_id = searchParams.get('hospital_id') || undefined;

    const filters = {
      search,
      type: type === 'all' ? undefined : type,
      status: status === 'all' ? undefined : status,
      severity: severity === 'all' ? undefined : severity,
      hospital_id: hospital_id === 'all' ? undefined : hospital_id
    };

    const result = await getAlerts(filters, page, limit);
    
    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Error obteniendo alertas:', error);
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