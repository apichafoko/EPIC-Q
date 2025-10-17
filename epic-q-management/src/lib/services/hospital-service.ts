'use server';

import { prisma } from '@/lib/database';
import { Hospital, HospitalFilters } from '@/types';

export async function getHospitals(filters?: HospitalFilters, page: number = 1, limit: number = 25) {
    const where: any = {};

    // Aplicar filtros
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { city: { contains: filters.search, mode: 'insensitive' } },
        { redcap_id: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    if (filters?.province && filters.province !== 'all') {
      where.province = filters.province;
    }

    if (filters?.status && filters.status !== 'all') {
      where.status = filters.status;
    }

    const [hospitals, total] = await Promise.all([
      prisma.hospital.findMany({
        where,
        include: {
          details: true,
          progress: true,
          contacts: true,
          users: true
        },
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.hospital.count({ where })
    ]);

    // Formatear datos para el frontend
    const formattedHospitals = hospitals.map(hospital => ({
      id: hospital.id,
      redcap_id: hospital.redcap_id || '',
      name: hospital.name,
      province: hospital.province || '',
      city: hospital.city || '',
      status: hospital.status || 'pending',
      coordinator: hospital.contacts[0]?.name || hospital.users[0]?.name || 'No asignado',
      progress: 0, // Campo no existe en HospitalProgress
      cases: 0, // Campo no existe en HospitalProgress
      completion: 0, // Campo no existe en HospitalProgress
      last_activity: hospital.updated_at,
      participated_lasos: hospital.participated_lasos || false,
      total_beds: hospital.details?.num_beds || 0,
      icu_beds: hospital.details?.num_icu_beds || 0,
      operating_rooms: hospital.details?.num_operating_rooms || 0,
      annual_surgeries: hospital.details?.avg_weekly_surgeries ? hospital.details.avg_weekly_surgeries * 52 : 0,
      coordinator_name: hospital.contacts[0]?.name || '',
      coordinator_email: hospital.contacts[0]?.email || '',
      coordinator_phone: hospital.contacts[0]?.phone || '',
      coordinator_specialty: hospital.contacts[0]?.specialty || '',
      ethics_submitted: hospital.progress?.ethics_submitted || false,
      ethics_approved: hospital.progress?.ethics_approved || false,
      ethics_approval_date: null, // Campo no existe en HospitalProgress
      created_at: hospital.created_at,
      updated_at: hospital.updated_at
    }));

    return {
      hospitals: formattedHospitals,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

export async function getHospitalById(id: string) {
    const hospital = await prisma.hospital.findUnique({
      where: { id },
      include: {
        details: true,
        progress: true,
        contacts: true,
        users: {
          where: { role: 'coordinator' }
        },
        recruitment_periods: {
          orderBy: { start_date: 'desc' }
        },
        case_metrics: {
          orderBy: { created_at: 'desc' }
        },
        communications: {
          orderBy: { created_at: 'desc' },
          take: 10
        },
        alerts: {
          where: { is_resolved: false },
          orderBy: { created_at: 'desc' }
        }
      }
    });

    if (!hospital) return null;

    return {
      id: hospital.id,
      redcap_id: hospital.redcap_id || '',
      name: hospital.name,
      province: hospital.province || '',
      city: hospital.city || '',
      status: hospital.status || 'pending',
      participated_lasos: hospital.participated_lasos || false,
      created_at: hospital.created_at,
      updated_at: hospital.updated_at,
      details: hospital.details,
      progress: hospital.progress,
      contacts: hospital.contacts,
      users: hospital.users,
      recruitment_periods: hospital.recruitment_periods,
      case_metrics: hospital.case_metrics,
      communications: hospital.communications,
      alerts: hospital.alerts
    };
  }

export async function getProvinces() {
    const provinces = await prisma.hospital.findMany({
      select: { province: true },
      distinct: ['province'],
      where: { province: { not: null } },
      orderBy: { province: 'asc' }
    });

    return provinces.map(p => p.province).filter(Boolean);
  }

export async function getStatuses() {
    const statuses = await prisma.hospital.findMany({
      select: { status: true },
      distinct: ['status'],
      where: { status: { not: null } },
      orderBy: { status: 'asc' }
    });

    return statuses.map(s => s.status).filter(Boolean);
  }