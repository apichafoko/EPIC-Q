import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { 
  getCommunicationById, 
  markCommunicationAsRead 
} from '@/lib/services/communication-service';

// GET - Obtener detalle de comunicación
export const GET = withAuth(async (request: NextRequest, context: any, params: Promise<{ id: string }>) => {
  try {
    const { user } = context;
    const { id } = await params;

    const communication = await getCommunicationById(id);

    if (!communication) {
      return NextResponse.json(
        { success: false, error: 'Comunicación no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que el usuario tenga acceso a esta comunicación
    if (user.role !== 'admin' && communication.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'No tienes permisos para ver esta comunicación' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      communication
    });

  } catch (error) {
    console.error('Error obteniendo comunicación:', error);
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

// PATCH - Marcar como leída
export const PATCH = withAuth(async (request: NextRequest, context: any, params: Promise<{ id: string }>) => {
  try {
    const { user } = context;
    const { id } = await params;

    const result = await markCommunicationAsRead(id, user.id);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Comunicación marcada como leída'
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error marcando comunicación como leída:', error);
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
