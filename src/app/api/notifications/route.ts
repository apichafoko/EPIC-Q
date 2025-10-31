import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../lib/auth/middleware';
import { prisma } from '../../../lib/database';

// GET - Obtener notificaciones in-app del usuario logueado
export async function GET(request: NextRequest) {
  return withAuth(async (request: NextRequest, context: any) => {
    try {
      const { user } = context;
      const { searchParams } = new URL(request.url);
      
      const limit = parseInt(searchParams.get('limit') || '10');
      const unreadOnly = searchParams.get('unreadOnly') === 'true';
      const group = searchParams.get('group') === 'true';

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
      const systemNotifs = notifications.map(notif => ({
        id: notif.id,
        type: 'notification',
        title: notif.title,
        message: notif.message,
        data: null,
        read: notif.isRead,
        created_at: notif.created_at,
        source: 'system'
      }));

      const commNotifs = unreadCommunications.map(comm => ({
        id: comm.id,
        type: comm.type,
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
        created_at: comm.sent_at || comm.created_at,
        source: 'communication'
      }));

      const alertNotifs = activeAlerts.map(alert => ({
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
        read: true, // no cuentan para el badge
        created_at: alert.created_at,
        source: 'alert'
      }));

      const allNotifications = [
        ...systemNotifs,
        ...commNotifs,
        ...alertNotifs
      ];

      // Ordenar por fecha de creación (más recientes primero)
      allNotifications.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      // Limitar resultados
      const limitedNotifications = allNotifications.slice(0, limit);

      // Agrupación opcional
      let grouped: any[] | undefined;
      if (group) {
        const groupsMap = new Map<string, any>();

        const getPriority = (n: any): number => {
          if (n.source === 'alert') {
            const sev = (n.data?.severity || '').toLowerCase();
            if (sev === 'critical') return 100;
            if (sev === 'high' || sev === 'alta') return 90;
            if (sev === 'medium' || sev === 'media') return 70;
            return 50;
          }
          if (n.source === 'communication') return 60;
          return 40; // system
        };

        const normalize = (s?: string) => (s || '').toLowerCase().replace(/\s+/g, ' ').trim();

        for (const n of allNotifications) {
          const key = [
            n.source,
            n.type,
            normalize(n.title),
            normalize(n.data?.hospital_name),
            normalize(n.data?.project_name)
          ].join('|');

          const existing = groupsMap.get(key);
          if (!existing) {
            groupsMap.set(key, {
              key,
              source: n.source,
              type: n.type,
              title: n.title,
              sampleMessage: n.message,
              data: {
                hospital_name: n.data?.hospital_name,
                project_name: n.data?.project_name,
              },
              count: 1,
              unreadCount: n.read ? 0 : 1,
              latest_at: n.created_at,
              priority: getPriority(n),
              items: [n],
            });
          } else {
            existing.count += 1;
            if (!n.read) existing.unreadCount += 1;
            if (new Date(n.created_at).getTime() > new Date(existing.latest_at).getTime()) {
              existing.latest_at = n.created_at;
              existing.sampleMessage = n.message;
            }
            existing.priority = Math.max(existing.priority, getPriority(n));
            if (existing.items.length < 5) existing.items.push(n);
          }
        }

        grouped = Array.from(groupsMap.values())
          .sort((a, b) => {
            if (b.priority !== a.priority) return b.priority - a.priority;
            if (b.unreadCount !== a.unreadCount) return b.unreadCount - a.unreadCount;
            return new Date(b.latest_at).getTime() - new Date(a.latest_at).getTime();
          })
          .slice(0, limit);
      }

      // Contar total de no leídas (solo comunicaciones + sistema) de forma independiente al límite
      const [systemUnreadTotal, commUnreadTotal] = await Promise.all([
        prisma.notifications.count({ where: { userId: user.id, isRead: false } }),
        prisma.communications.count({ where: { user_id: user.id, read_at: null } })
      ]);
      const unreadCount = systemUnreadTotal + commUnreadTotal;

      return NextResponse.json({
        success: true,
        notifications: grouped ?? limitedNotifications,
        unreadCount,
        total: allNotifications.length,
        grouped: !!group
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
  })(request);
}

// PATCH - Marcar notificación como leída
export async function PATCH(request: NextRequest) {
  return withAuth(async (request: NextRequest, context: any) => {
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
  })(request);
}