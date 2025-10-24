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
        { province: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    if (filters?.province && filters.province !== 'all') {
      where.province = filters.province;
    }

    if (filters?.status && filters.status !== 'all') {
      where.status = filters.status;
    } else if (!filters?.status) {
      // Por defecto, solo mostrar hospitales activos si no se especifica un filtro de estado
      where.status = 'active';
    }

    let hospitals, total;
    
    try {
      [hospitals, total] = await Promise.all([
        prisma.hospitals.findMany({
          where,
          include: {
            hospital_details: true,
            hospital_contacts: true,
            hospital_progress: true,
            project_hospitals: {
              include: {
                projects: {
                  select: {
                    id: true,
                    name: true,
                    status: true,
                    start_date: true,
                    end_date: true,
                    required_periods: true
                  }
                }
              }
            }
          },
          orderBy: { name: 'asc' },
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.hospitals.count({ where })
      ]);
    } catch (error: any) {
      // Handle cached plan errors by clearing cache and retrying
      if (error.code === '0A000' && error.message?.includes('cached plan must not change result type')) {
        console.warn('Cached plan error detected, clearing cache and retrying...');
        try {
          // Clear prepared statements
          await prisma.$executeRaw`DEALLOCATE ALL`;
          
          // Retry the query
          [hospitals, total] = await Promise.all([
            prisma.hospitals.findMany({
              where,
              include: {
                hospital_details: true,
                hospital_contacts: true,
                hospital_progress: true,
                project_hospitals: {
                  include: {
                    projects: {
                      select: {
                        id: true,
                        name: true,
                        status: true,
                        start_date: true,
                        end_date: true,
                        required_periods: true
                      }
                    }
                  }
                }
              },
              orderBy: { name: 'asc' },
              skip: (page - 1) * limit,
              take: limit
            }),
            prisma.hospitals.count({ where })
          ]);
        } catch (retryError) {
          console.error('Retry failed:', retryError);
          throw retryError;
        }
      } else {
        throw error;
      }
    }

    // Formatear datos para el frontend
    const formattedHospitals = hospitals.map(hospital => {
      // Separar proyectos activos e históricos
      const activeProjects = hospital.project_hospitals.filter(ph => 
        ph.projects.status === 'active' && 
        (!ph.projects.end_date || new Date(ph.projects.end_date) > new Date())
      );
      
      const historicalProjects = hospital.project_hospitals.filter(ph => 
        ph.projects.status !== 'active' || 
        (ph.projects.end_date && new Date(ph.projects.end_date) <= new Date())
      );

      return {
        id: hospital.id,
        name: hospital.name,
        province: hospital.province || '',
        city: hospital.city || '',
        status: hospital.status || 'pending',
        coordinator: hospital.hospital_contacts?.[0]?.name || 'No asignado',
        active_projects: activeProjects.length,
        historical_projects: historicalProjects.length,
        projects: hospital.project_hospitals.map(ph => ({
          id: ph.projects.id,
          name: ph.projects.name,
          status: ph.projects.status,
          start_date: ph.projects.start_date,
          end_date: ph.projects.end_date,
          required_periods: ph.projects.required_periods,
          redcap_id: ph.redcap_id
        })),
        last_activity: hospital.updated_at,
        participated_lasos: hospital.lasos_participation || false,
        total_beds: hospital.hospital_details?.num_beds || 0,
        icu_beds: hospital.hospital_details?.num_icu_beds || 0,
        operating_rooms: hospital.hospital_details?.num_operating_rooms || 0,
        annual_surgeries: hospital.hospital_details?.avg_weekly_surgeries ? hospital.hospital_details.avg_weekly_surgeries * 52 : 0,
        coordinator_name: hospital.hospital_contacts?.[0]?.name || '',
        coordinator_email: hospital.hospital_contacts?.[0]?.email || '',
        coordinator_phone: hospital.hospital_contacts?.[0]?.phone || '',
        coordinator_specialty: hospital.hospital_contacts?.[0]?.specialty || '',
        ethics_submitted: hospital.hospital_progress?.[0]?.ethics_submitted || false,
        ethics_approved: hospital.hospital_progress?.[0]?.ethics_approved || false,
        ethics_approval_date: null, // Campo no existe en HospitalProgress
        created_at: hospital.created_at,
        updated_at: hospital.updated_at
      };
    });

    return {
      hospitals: formattedHospitals,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

export async function getHospitalById(id: string) {
    const hospital = await prisma.hospitals.findUnique({
      where: { id },
      include: {
        hospital_details: true,
        hospital_progress: true,
        hospital_contacts: true,
        users: {
          where: { role: 'coordinator' }
        },
        case_metrics: {
          orderBy: { recorded_date: 'desc' }
        },
        communications: {
          orderBy: { created_at: 'desc' },
          take: 10
        },
        alerts: {
          where: { is_resolved: false },
          orderBy: { created_at: 'desc' }
        },
        project_hospitals: {
          include: {
            projects: {
              select: {
                id: true,
                name: true,
                status: true,
                start_date: true,
                end_date: true,
                required_periods: true
              }
            },
            hospital_progress: true,
            recruitment_periods: {
              orderBy: { start_date: 'desc' }
            }
          }
        }
      }
    });

    if (!hospital) return null;

    // Obtener coordinadores para cada proyecto-hospital
    const projectCoordinators = await prisma.project_coordinators.findMany({
      where: {
        hospital_id: id,
        is_active: true
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        projects: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Separar proyectos activos e históricos
    const activeProjects = hospital.project_hospitals.filter(ph => 
      ph.projects.status === 'active' && 
      (!ph.projects.end_date || new Date(ph.projects.end_date) > new Date())
    );
    
    const historicalProjects = hospital.project_hospitals.filter(ph => 
      ph.projects.status !== 'active' || 
      (ph.projects.end_date && new Date(ph.projects.end_date) <= new Date())
    );

    return {
      id: hospital.id,
      name: hospital.name,
      province: hospital.province || '',
      city: hospital.city || '',
      status: hospital.status || 'pending',
      participated_lasos: hospital.lasos_participation || false,
      active_projects: activeProjects.length,
      historical_projects: historicalProjects.length,
      projects: hospital.project_hospitals.map(ph => {
        // Filtrar coordinadores para este proyecto específico
        const projectCoords = projectCoordinators.filter(pc => pc.project_id === ph.projects.id);
        
        return {
          id: ph.projects.id,
          name: ph.projects.name,
          status: ph.projects.status,
          start_date: ph.projects.start_date,
          end_date: ph.projects.end_date,
          required_periods: ph.projects.required_periods,
          project_required_periods: ph.projects.required_periods,
          redcap_id: ph.redcap_id,
          project_hospital_status: ph.status,
          joined_at: ph.created_at,
          progress: ph.hospital_progress,
          // IDs necesarios para la relación hospital-proyecto
          project_hospital_id: ph.id,
          project_id: ph.project_id,
          hospital_id: ph.hospital_id,
          coordinators: projectCoords.map(pc => ({
            id: pc.users.id,
            name: pc.users.name,
            email: pc.users.email,
            role: pc.role,
            is_active: pc.is_active,
            accepted_at: pc.accepted_at
          }))
        };
      }),
      created_at: hospital.created_at,
      updated_at: hospital.updated_at,
      details: hospital.hospital_details,
      progress: hospital.hospital_progress,
      contacts: hospital.hospital_contacts,
      users: hospital.users,
      recruitment_periods: hospital.project_hospitals.flatMap(ph => ph.recruitment_periods),
      case_metrics: hospital.case_metrics,
      communications: hospital.communications,
      alerts: hospital.alerts
    };
  }

export async function getProvinces() {
    const provinces = await prisma.hospitals.findMany({
      select: { province: true },
      distinct: ['province'],
      orderBy: { province: 'asc' }
    });

    return provinces.map(p => p.province).filter(Boolean);
  }

export async function getStatuses() {
    // Los estados válidos para hospitales son solo 'active' e 'inactive'
    return ['active', 'inactive'];
  }