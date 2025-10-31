'use server';

import { prisma } from '../../lib/database';
import { Communication, CommunicationFilters } from '../../types';

export interface SendCommunicationParams {
  recipientIds: string[];
  subject: string;
  body: string;
  type: 'manual' | 'auto_alert' | 'system';
  senderId?: string;
  alertId?: string;
  channels: string[];
  hospitalId?: string;
  projectId?: string;
}

export async function getCommunications(filters?: CommunicationFilters, page: number = 1, limit: number = 25) {
  const where: any = {};

  // Aplicar filtros
  if (filters?.search) {
    where.OR = [
      { subject: { contains: filters.search, mode: 'insensitive' } },
      { content: { contains: filters.search, mode: 'insensitive' } },
      { hospital: { name: { contains: filters.search, mode: 'insensitive' } } },
    ];
  }

  if (filters?.type && filters.type !== 'all') {
    where.type = filters.type;
  }

  // Note: hospital_id filter not available in CommunicationFilters interface

  const total = await prisma.communications.count({ where });
  const communications = await prisma.communications.findMany({
    where,
    include: {
      hospitals: {
        select: { name: true, city: true, province: true }
      },
      projects: {
        select: { name: true }
      },
      sender: {
        select: { name: true, email: true }
      }
    },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { created_at: 'desc' },
  });

  const formattedCommunications: Communication[] = communications.map((c) => ({
    id: c.id,
    hospital_id: c.hospital_id || 'unknown',
    hospital_name: c.hospitals?.name || undefined,
    project_name: c.projects?.name || undefined,
    type: c.type || undefined,
    subject: c.subject || undefined,
    content: c.body || undefined, // Usar 'body' en lugar de 'content'
    sent_at: c.sent_at.toISOString(), // Usar 'sent_at' en lugar de 'created_at'
    read_at: null, // Campo no existe en el esquema
    user_id: c.user_id || undefined, // Usar 'user_id' en lugar de 'sent_by'
    user_name: c.sender?.name || 'Admin',
    priority: 'normal', // Campo no existe en el esquema, usar valor por defecto
    status: 'sent', // Campo no existe en el esquema, usar valor por defecto
    attachments: [], // Campo no existe en el esquema
  }));

  return {
    communications: formattedCommunications,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
}

export async function getCommunicationById(id: string) {
  const communication = await prisma.communications.findUnique({
    where: { id },
    include: {
      hospitals: true
    },
  });

  if (!communication) {
    return null;
  }

  return {
    id: communication.id,
    hospital_id: communication.hospital_id,
    hospital_name: communication.hospitals?.name || 'Hospital no encontrado',
    type: communication.type || undefined,
    subject: communication.subject || undefined,
    content: communication.body || undefined,
    sent_at: communication.sent_at.toISOString(),
    read_at: null, // Campo no existe en el esquema
    user_id: communication.user_id || undefined,
    user_name: 'Usuario desconocido', // Campo no disponible
    priority: 'normal', // Campo no existe en el esquema
    status: 'sent', // Campo no existe en el esquema, usar valor por defecto
    attachments: [], // Campo no existe en el esquema
  };
}

export async function getCommunicationTypes() {
  const types = await prisma.communications.findMany({
    select: { type: true },
    distinct: ['type'],
    orderBy: { type: 'asc' }
  });

  return types.map(t => t.type).filter(Boolean);
}

export async function getCommunicationStats() {
  const [
    total,
    emails,
    calls,
    notes
  ] = await Promise.all([
    prisma.communications.count(),
    prisma.communications.count({ where: { type: 'email' } }),
    prisma.communications.count({ where: { type: 'call' } }),
    prisma.communications.count({ where: { type: 'note' } })
  ]);

  return {
    total,
    unread: 0, // Campo no disponible en el esquema actual
    emails,
    calls,
    notes
  };
}

/**
 * Envía una comunicación multi-canal
 */
export async function sendCommunication(params: SendCommunicationParams) {
  const { recipientIds, subject, body, type, senderId, alertId, channels, hospitalId, projectId } = params;

  try {
    const communications = [];

    for (const recipientId of recipientIds) {
      const communication = await prisma.communications.create({
        data: {
          id: `comm_${Date.now()}_${recipientId}`,
          hospital_id: hospitalId || null,
          project_id: projectId || null,
          user_id: recipientId,
          sender_id: senderId || null,
          alert_id: alertId || null,
          type,
          subject,
          body,
          channels: channels,
          email_status: channels.includes('email') ? 'pending' : null
        }
      });

      communications.push(communication);

      // Procesar cada canal
      for (const channel of channels) {
        switch (channel) {
          case 'email':
            await sendEmailChannel(communication);
            break;
          case 'in_app':
            await sendInAppChannel(communication);
            break;
          case 'push':
            await sendPushChannel(communication);
            break;
        }
      }
    }

    return {
      success: true,
      communications,
      message: `Comunicación enviada a ${recipientIds.length} destinatario(s) por ${channels.join(', ')}`
    };

  } catch (error) {
    console.error('Error enviando comunicación:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Procesa el canal de email
 */
async function sendEmailChannel(communication: any) {
  try {
    // Obtener el usuario destinatario para obtener su email
    const user = await prisma.users.findUnique({
      where: { id: communication.user_id },
      select: { email: true, name: true }
    });

    if (!user?.email) {
      throw new Error(`Usuario ${communication.user_id} no tiene email`);
    }

    // Importar el servicio de email
    const { sendEmail } = await import('../notifications/email-service');
    
    // Enviar el email
    await sendEmail({
      to: user.email,
      subject: communication.subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">EPIC-Q</h1>
            <p style="margin: 5px 0 0 0;">Sistema de Gestión</p>
          </div>
          <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #1f2937; margin-top: 0;">${communication.subject}</h2>
            <div style="color: #4b5563; line-height: 1.6; white-space: pre-wrap;">
              ${communication.body.replace(/\n/g, '<br>')}
            </div>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">
              Este es un mensaje automático del sistema EPIC-Q. No respondas a este correo.
            </p>
          </div>
        </div>
      `
    });

    // Actualizar estado a 'sent'
    await prisma.communications.update({
      where: { id: communication.id },
      data: { email_status: 'sent' }
    });

    console.log(`📧 Email enviado para comunicación ${communication.id} a ${user.email}`);
  } catch (error) {
    console.error(`❌ Error enviando email para comunicación ${communication.id}:`, error);
    await prisma.communications.update({
      where: { id: communication.id },
      data: { email_status: 'failed' }
    });
  }
}

/**
 * Procesa el canal in-app
 */
async function sendInAppChannel(communication: any) {
  try {
    // Crear notificación in-app
    await prisma.notifications.create({
      data: {
        id: `notif_${Date.now()}_${communication.user_id}`,
        userId: communication.user_id,
        type: 'communication',
        title: communication.subject,
        message: communication.body
      }
    });

    console.log(`🔔 Notificación in-app creada para comunicación ${communication.id}`);
  } catch (error) {
    console.error(`❌ Error creando notificación in-app para comunicación ${communication.id}:`, error);
  }
}

/**
 * Procesa el canal push
 */
async function sendPushChannel(communication: any) {
  try {
    // Enviar push notification usando el endpoint API
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications/send-push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: communication.subject,
        message: communication.body,
        targetUserId: communication.user_id,
        data: {
          communicationId: communication.id,
          type: communication.type,
          hospitalId: communication.hospital_id,
          projectId: communication.project_id
        }
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`📱 Push notification enviada para comunicación ${communication.id}:`, result);
    } else {
      console.error(`❌ Error enviando push para comunicación ${communication.id}:`, response.statusText);
    }
  } catch (error) {
    console.error(`❌ Error enviando push para comunicación ${communication.id}:`, error);
  }
}

/**
 * Marca una comunicación como leída
 */
export async function markCommunicationAsRead(communicationId: string, userId: string) {
  try {
    await prisma.communications.update({
      where: { 
        id: communicationId,
        user_id: userId // Asegurar que solo el destinatario puede marcarla como leída
      },
      data: { read_at: new Date() }
    });

    return { success: true };
  } catch (error) {
    console.error('Error marcando comunicación como leída:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    };
  }
}

/**
 * Obtiene comunicaciones por usuario con filtros
 */
export async function getCommunicationsByUser(userId: string, filters?: {
  type?: string;
  read?: boolean;
  limit?: number;
  offset?: number;
}) {
  const where: any = {
    user_id: userId
  };

  if (filters?.type) {
    where.type = filters.type;
  }

  if (filters?.read !== undefined) {
    if (filters.read) {
      where.read_at = { not: null };
    } else {
      where.read_at = null;
    }
  }

  const communications = await prisma.communications.findMany({
    where,
    include: {
      hospitals: {
        select: { name: true, city: true, province: true }
      },
      projects: {
        select: { name: true }
      },
      sender: {
        select: { name: true, email: true }
      },
      alert: {
        select: { title: true, severity: true }
      }
    },
    orderBy: { created_at: 'desc' },
    take: filters?.limit || 25,
    skip: filters?.offset || 0
  });

  return communications.map(comm => ({
    id: comm.id,
    subject: comm.subject,
    body: comm.body,
    type: comm.type,
    channels: comm.channels,
    email_status: comm.email_status,
    read_at: comm.read_at,
    sent_at: comm.sent_at,
    hospital_name: comm.hospitals?.name,
    project_name: comm.projects?.name,
    sender_name: comm.sender?.name,
    alert_title: comm.alert?.title,
    alert_severity: comm.alert?.severity
  }));
}

/**
 * Obtiene estadísticas de comunicaciones por usuario
 */
export async function getCommunicationStatsByUser(userId: string) {
  const [
    total,
    unread,
    byType,
    byChannel
  ] = await Promise.all([
    prisma.communications.count({ where: { user_id: userId } }),
    prisma.communications.count({ where: { user_id: userId, read_at: null } }),
    prisma.communications.groupBy({
      by: ['type'],
      where: { user_id: userId },
      _count: { type: true }
    }),
    prisma.communications.findMany({
      where: { user_id: userId },
      select: { channels: true }
    })
  ]);

  // Procesar estadísticas por canal
  const channelStats: Record<string, number> = {};
  byChannel.forEach(comm => {
    if (Array.isArray(comm.channels)) {
      comm.channels.forEach((channel) => {
        if (typeof channel === 'string') {
          channelStats[channel] = (channelStats[channel] || 0) + 1;
        }
      });
    }
  });

  return {
    total,
    unread,
    byType: byType.reduce((acc, item) => {
      acc[item.type] = item._count.type;
      return acc;
    }, {} as Record<string, number>),
    byChannel: channelStats
  };
}