'use server';

import { prisma } from '@/lib/database';
import { Communication, CommunicationFilters } from '@/types';

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

  if (filters?.hospital_id && filters.hospital_id !== 'all') {
    where.hospital_id = filters.hospital_id;
  }

  const total = await prisma.communication.count({ where });
  const communications = await prisma.communication.findMany({
    where,
    include: {
      hospital: {
        select: { name: true, city: true, province: true }
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
    hospital_id: c.hospital_id,
    hospital_name: c.hospital?.name || 'Hospital no encontrado',
    type: c.type,
    subject: c.subject,
    content: c.content,
    sent_at: c.created_at,
    read_at: null, // Campo no existe en el esquema
    user_id: c.sent_by,
    user_name: c.sender?.name || 'Usuario desconocido',
    priority: 'normal', // Campo no existe en el esquema
    status: c.status || 'sent',
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
  const communication = await prisma.communication.findUnique({
    where: { id },
    include: {
      hospital: true,
      sender: true
    },
  });

  if (!communication) {
    return null;
  }

  return {
    id: communication.id,
    hospital_id: communication.hospital_id,
    hospital_name: communication.hospital?.name || 'Hospital no encontrado',
    type: communication.type,
    subject: communication.subject,
    content: communication.content,
    sent_at: communication.created_at,
    read_at: null, // Campo no existe en el esquema
    user_id: communication.sent_by,
    user_name: communication.sender?.name || 'Usuario desconocido',
    priority: 'normal', // Campo no existe en el esquema
    status: communication.status || 'sent',
    attachments: [], // Campo no existe en el esquema
  };
}

export async function getCommunicationTypes() {
  const types = await prisma.communication.findMany({
    select: { type: true },
    distinct: ['type'],
    where: { type: { not: null } },
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
    prisma.communication.count(),
    prisma.communication.count({ where: { type: 'email' } }),
    prisma.communication.count({ where: { type: 'call' } }),
    prisma.communication.count({ where: { type: 'note' } })
  ]);

  return {
    total,
    unread: 0, // Campo no disponible en el esquema actual
    emails,
    calls,
    notes
  };
}