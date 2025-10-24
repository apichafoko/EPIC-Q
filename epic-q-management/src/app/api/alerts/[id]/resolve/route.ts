import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { resolveAlert } from '@/lib/services/alert-service';

// POST - Resolver alerta manualmente
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (request: NextRequest, context: any) => {
    try {
      const { user } = context;
      const { id } = await params;

    const result = await resolveAlert(id, user.id, false);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Alerta resuelta exitosamente',
        alert: result.alert
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error resolviendo alerta:', error);
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
