import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { 
  getCommunications, 
  sendCommunication, 
  getCommunicationsByUser 
} from '@/lib/services/communication-service';

// GET - Listar comunicaciones
export const GET = withAuth(async (request: NextRequest, context: any) => {
  try {
    const { user } = context;
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const search = searchParams.get('search') || undefined;
    const type = searchParams.get('type') || undefined;
    const read = searchParams.get('read');
    const userId = searchParams.get('userId');

    // Si se especifica un userId, obtener comunicaciones de ese usuario específico
    if (userId) {
      const filters = {
        type,
        read: read ? read === 'true' : undefined,
        limit,
        offset: (page - 1) * limit
      };

      const communications = await getCommunicationsByUser(userId, filters);
      
      return NextResponse.json({
        success: true,
        communications,
        page,
        limit
      });
    }

    // Para admin: todas las comunicaciones
    // Para coordinador: solo sus comunicaciones
    const filters = {
      search,
      type: type === 'all' ? undefined : type
    };

    const result = await getCommunications(filters, page, limit);
    
    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Error obteniendo comunicaciones:', error);
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

// POST - Enviar comunicación manual
export const POST = withAuth(async (request: NextRequest, context: any) => {
  try {
    const { user } = context;
    const body = await request.json();
    
    const { 
      recipientIds, 
      subject, 
      body: messageBody, 
      channels = ['email', 'in_app'],
      hospitalId,
      projectId
    } = body;

    // Validaciones
    if (!recipientIds || !Array.isArray(recipientIds) || recipientIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'recipientIds es requerido y debe ser un array no vacío' },
        { status: 400 }
      );
    }

    if (!subject || !messageBody) {
      return NextResponse.json(
        { success: false, error: 'subject y body son requeridos' },
        { status: 400 }
      );
    }

    if (!channels || !Array.isArray(channels) || channels.length === 0) {
      return NextResponse.json(
        { success: false, error: 'channels es requerido y debe ser un array no vacío' },
        { status: 400 }
      );
    }

    // Solo admin puede enviar comunicaciones manuales
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Solo los administradores pueden enviar comunicaciones' },
        { status: 403 }
      );
    }

    const result = await sendCommunication({
      recipientIds,
      subject,
      body: messageBody,
      type: 'manual',
      senderId: user.id,
      channels,
      hospitalId,
      projectId
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        communications: result.communications
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error enviando comunicación:', error);
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
