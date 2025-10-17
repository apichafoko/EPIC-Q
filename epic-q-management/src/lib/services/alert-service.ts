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
      { hospital: { name: { contains: filters.search, mode: 'insensitive' } } },
    ];
  }

  if (filters?.severity && filters.severity !== 'all') {
    where.severity = filters.severity;
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

  const total = await prisma.alert.count({ where });
  const alerts = await prisma.alert.findMany({
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

  const formattedAlerts: Alert[] = alerts.map((a) => ({
    id: a.id,
    hospital_id: a.hospital_id,
    hospital_name: a.hospital?.name || 'Hospital no encontrado',
    title: a.title,
    message: a.message,
    severity: a.severity,
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
  const alert = await prisma.alert.findUnique({
    where: { id },
    include: {
      hospital: true
    },
  });

  if (!alert) {
    return null;
  }

  return {
    id: alert.id,
    hospital_id: alert.hospital_id,
    hospital_name: alert.hospital?.name || 'Hospital no encontrado',
    title: alert.title,
    message: alert.message,
    severity: alert.severity,
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
    prisma.alert.count(),
    prisma.alert.count({ where: { is_resolved: false } }),
    prisma.alert.count({ where: { is_resolved: true } }),
    prisma.alert.count({ where: { severity: 'critical' } }),
    prisma.alert.count({ where: { severity: 'high' } }),
    prisma.alert.count({ where: { severity: 'medium' } }),
    prisma.alert.count({ where: { severity: 'low' } })
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

export async function getAlertSeverities() {
  const severities = await prisma.alert.findMany({
    select: { severity: true },
    distinct: ['severity'],
    where: { severity: { not: null } },
    orderBy: { severity: 'asc' }
  });

  return severities.map(s => s.severity).filter(Boolean);
}