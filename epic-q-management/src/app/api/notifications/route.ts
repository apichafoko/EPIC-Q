import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { prisma } from '@/lib/database';

// GET - Obtener notificaciones in-app del usuario logueado
export const GET = withAuth(async (request: NextRequest, context: any) => {
  try {
    const { user } = context;
    const { searchParams } = new URL(request.url);
    
    const limit = parseInt(searchParams.get('limit') || '10');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    // Obtener notificaciones del usuario
    const where: any = {
      userId: user.id
    };

    if (unreadOnly) {
      where.isRead = false;
    }

    const notifications = await prisma.notifications.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: limit
    });

    // Obtener comunicaciones no leídas del usuario
    const unreadCommunications = await prisma.communications.findMany({
      where: {
        user_id: user.id,
        read_at: null
      },
      include: {
        hospitals: {
          select: { name: true }
        },
        projects: {
          select: { name: true }
        },
        sender: {
          select: { name: true }
        }
      },
      orderBy: { created_at: 'desc' },
      take: limit
    });

    // Obtener alertas activas relacionadas con el usuario
    const activeAlerts = await prisma.alerts.findMany({
      where: {
        is_resolved: false,
        OR: [
          { hospital_id: { in: user.hospitalId ? [user.hospitalId] : [] } },
          { project_id: { in: [] } } // Aquí podrías agregar proyectos del usuario
        ]
      },
      include: {
        hospitals: {
          select: { name: true }
        },
        projects: {
          select: { name: true }
        }
      },
      orderBy: { created_at: 'desc' },
      take: limit
    });

    // Combinar y formatear todas las notificaciones
    const allNotifications = [
      // Notificaciones del sistema
      ...notifications.map(notif => ({
        id: notif.id,
        type: 'notification',
        title: notif.title,
        message: notif.message,
        data: notif.data,
        read: notif.isRead,
        created_at: notif.created_at,
        source: 'system'
      })),
      
      // Comunicaciones no leídas
      ...unreadCommunications.map(comm => ({
        id: comm.id,
        type: 'communication',
        title: comm.subject,
        message: comm.body,
        data: {
          communicationId: comm.id,
          type: comm.type,
          hospital_name: comm.hospitals?.name,
          project_name: comm.projects?.name,
          sender_name: comm.sender?.name
        },
        read: false,
        created_at: comm.created_at,
        source: 'communication'
      })),
      
      // Alertas activas
      ...activeAlerts.map(alert => ({
        id: alert.id,
        type: 'alert',
        title: alert.title,
        message: alert.message,
        data: {
          alertId: alert.id,
          type: alert.type,
          severity: alert.severity,
          hospital_name: alert.hospitals?.name,
          project_name: alert.projects?.name,
          metadata: alert.metadata
        },
        read: false,
        created_at: alert.created_at,
        source: 'alert'
      }))
    ];

    // Ordenar por fecha de creación (más recientes primero)
    allNotifications.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Limitar resultados
    const limitedNotifications = allNotifications.slice(0, limit);

    // Contar total de no leídas
    const unreadCount = allNotifications.filter(n => !n.read).length;

    return NextResponse.json({
      success: true,
      notifications: limitedNotifications,
      unreadCount,
      total: allNotifications.length
    });

  } catch (error) {
    console.error('Error obteniendo notificaciones:', error);
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

// PATCH - Marcar notificación como leída
export const PATCH = withAuth(async (request: NextRequest, context: any) => {
  try {
    const { user } = context;
    const body = await request.json();
    const { notificationId, type } = body;

    if (!notificationId || !type) {
      return NextResponse.json(
        { success: false, error: 'notificationId y type son requeridos' },
        { status: 400 }
      );
    }

    let result;

    switch (type) {
      case 'notification':
        result = await prisma.notifications.update({
          where: { 
            id: notificationId,
            userId: user.id
          },
          data: { isRead: true }
        });
        break;

      case 'communication':
        result = await prisma.communications.update({
          where: { 
            id: notificationId,
            user_id: user.id
          },
          data: { read_at: new Date() }
        });
        break;

      case 'alert':
        // Para alertas, solo las marcamos como leídas en el contexto del usuario
        // No las resolvemos automáticamente
        result = { id: notificationId };
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Tipo de notificación no válido' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: 'Notificación marcada como leída'
    });

  } catch (error) {
    console.error('Error marcando notificación como leída:', error);
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