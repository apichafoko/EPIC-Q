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

  const total = await prisma.communication.count({ where });
  const communications = await prisma.communication.findMany({
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
    content: c.body || undefined, // Usar 'body' en lugar de 'content'
    sent_at: c.sent_at.toISOString(), // Usar 'sent_at' en lugar de 'created_at'
    read_at: null, // Campo no existe en el esquema
    user_id: c.user_id || undefined, // Usar 'user_id' en lugar de 'sent_by'
    user_name: 'Usuario desconocido', // Campo no disponible
    priority: 'normal', // Campo no existe en el esquema
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
  const communication = await prisma.communication.findUnique({
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
  const types = await prisma.communication.findMany({
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