'use server';

import { prisma } from '@/lib/database';
import { Alert, AlertFilters } from '@/types';

export async function getAlerts(filters?: AlertFilters, page: number = 1, limit: number = 25) {
  const where: any = {};

  // Aplicar filtros
  if (filters?.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { message: { contains: filters.search, mode: 'insensitive' } },
      { hospitals: { name: { contains: filters.search, mode: 'insensitive' } } },
    ];
  }

  if (filters?.type && filters.type !== 'all') {
    where.type = filters.type;
  }

  if (filters?.status && filters.status !== 'all') {
    if (filters.status === 'active') {
      where.is_resolved = false;
    } else if (filters.status === 'resolved') {
      where.is_resolved = true;
    }
  }

  if (filters?.hospital_id && filters.hospital_id !== 'all') {
    where.hospital_id = filters.hospital_id;
  }

  const total = await prisma.alerts.count({ where });
  const alerts = await prisma.alerts.findMany({
    where,
    include: {
      hospitals: {
        select: { name: true, city: true, province: true }
      }
    },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { created_at: 'desc' },
  });

  const formattedAlerts: Alert[] = alerts.map((a) => ({
    id: a.id,
    hospital_id: a.hospital_id,
    hospital_name: a.hospitals?.name || 'Hospital no encontrado',
    title: a.title,
    message: a.message,
    type: a.type,
    is_resolved: a.is_resolved,
    created_at: a.created_at,
    resolved_at: a.resolved_at,
    resolved_by: a.resolved_by,
    metadata: a.metadata || {},
  }));

  return {
    alerts: formattedAlerts,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
}

export async function getAlertById(id: string) {
  const alert = await prisma.alerts.findUnique({
    where: { id },
    include: {
      hospitals: true
    },
  });

  if (!alert) {
    return null;
  }

  return {
    id: alert.id,
    hospital_id: alert.hospital_id,
    hospital_name: alert.hospitals?.name || 'Hospital no encontrado',
    title: alert.title,
    message: alert.message,
    type: alert.type,
    is_resolved: alert.is_resolved,
    created_at: alert.created_at,
    resolved_at: alert.resolved_at,
    resolved_by: alert.resolved_by,
    metadata: alert.metadata || {},
  };
}

export async function getAlertStats() {
  const [
    total,
    active,
    resolved,
    critical,
    high,
    medium,
    low
  ] = await Promise.all([
    prisma.alerts.count(),
    prisma.alerts.count({ where: { is_resolved: false } }),
    prisma.alerts.count({ where: { is_resolved: true } }),
    prisma.alerts.count({ where: { type: 'critical' } }),
    prisma.alerts.count({ where: { type: 'high' } }),
    prisma.alerts.count({ where: { type: 'medium' } }),
    prisma.alerts.count({ where: { type: 'low' } })
  ]);

  return {
    total,
    active,
    resolved,
    critical,
    high,
    medium,
    low
  };
}

export async function getAlertTypes() {
  const types = await prisma.alerts.findMany({
    select: { type: true },
    distinct: ['type'],
    orderBy: { type: 'asc' }
  });

  return types.map(t => t.type).filter(Boolean);
}