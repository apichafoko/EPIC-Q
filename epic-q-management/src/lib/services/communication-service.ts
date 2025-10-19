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

  // Note: hospital_id filter not available in CommunicationFilters interface

  const total = await prisma.communications.count({ where });
  const communications = await prisma.communications.findMany({
    where,
    include: {
      hospital: {
        select: { name: true, city: true, province: true }
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
    type: c.type || undefined,
    subject: c.subject || undefined,
    content: c.content || undefined,
    sent_at: c.created_at.toISOString(),
    read_at: null, // Campo no existe en el esquema
    user_id: c.sent_by || undefined,
    user_name: 'Usuario desconocido', // Campo no disponible
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
  const communication = await prisma.communications.findUnique({
    where: { id },
    include: {
      hospital: true
    },
  });

  if (!communication) {
    return null;
  }

  return {
    id: communication.id,
    hospital_id: communication.hospital_id,
    hospital_name: communication.hospital?.name || 'Hospital no encontrado',
    type: communication.type || undefined,
    subject: communication.subject || undefined,
    content: communication.content || undefined,
    sent_at: communication.created_at.toISOString(),
    read_at: null, // Campo no existe en el esquema
    user_id: communication.sent_by || undefined,
    user_name: 'Usuario desconocido', // Campo no disponible
    priority: 'normal', // Campo no existe en el esquema
    status: communication.status || 'sent',
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