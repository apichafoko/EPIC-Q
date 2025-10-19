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
    }

    let hospitals, total;
    
    try {
      [hospitals, total] = await Promise.all([
        prisma.hospitals.findMany({
          where,
          include: {
            hospital_details: true,
            hospital_contacts: true,
            project_hospitals: {
              include: {
                projects: {
                  select: {
                    id: true,
                    name: true,
                    status: true,
                    start_date: true,
                    end_date: true
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
                details: true,
                progress: true,
                contacts: true,
                users: true,
                project_hospitals: {
                  include: {
                    projects: {
                      select: {
                        id: true,
                        name: true,
                        status: true,
                        start_date: true,
                        end_date: true
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
        ph.project.status === 'active' && 
        (!ph.project.end_date || new Date(ph.project.end_date) > new Date())
      );
      
      const historicalProjects = hospital.project_hospitals.filter(ph => 
        ph.project.status !== 'active' || 
        (ph.project.end_date && new Date(ph.project.end_date) <= new Date())
      );

      return {
        id: hospital.id,
        name: hospital.name,
        province: hospital.province || '',
        city: hospital.city || '',
        status: hospital.status || 'pending',
        coordinator: hospital.contacts[0]?.name || hospital.users[0]?.name || 'No asignado',
        active_projects: activeProjects.length,
        historical_projects: historicalProjects.length,
        projects: hospital.project_hospitals.map(ph => ({
          id: ph.project.id,
          name: ph.project.name,
          status: ph.project.status,
          start_date: ph.project.start_date,
          end_date: ph.project.end_date,
          required_periods: ph.required_periods,
          redcap_id: ph.redcap_id
        })),
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
                end_date: true
              }
            },
            progress: true
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
        user: {
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
      ph.project.status === 'active' && 
      (!ph.project.end_date || new Date(ph.project.end_date) > new Date())
    );
    
    const historicalProjects = hospital.project_hospitals.filter(ph => 
      ph.project.status !== 'active' || 
      (ph.project.end_date && new Date(ph.project.end_date) <= new Date())
    );

    return {
      id: hospital.id,
      name: hospital.name,
      province: hospital.province || '',
      city: hospital.city || '',
      status: hospital.status || 'pending',
      participated_lasos: hospital.participated_lasos || false,
      active_projects: activeProjects.length,
      historical_projects: historicalProjects.length,
      projects: hospital.project_hospitals.map(ph => {
        // Filtrar coordinadores para este proyecto específico
        const projectCoords = projectCoordinators.filter(pc => pc.project_id === ph.project.id);
        
        return {
          id: ph.project.id,
          name: ph.project.name,
          status: ph.project.status,
          start_date: ph.project.start_date,
          end_date: ph.project.end_date,
          required_periods: ph.required_periods,
          redcap_id: ph.redcap_id,
          project_hospital_status: ph.status,
          joined_at: ph.joined_at,
          progress: ph.progress,
          coordinators: projectCoords.map(pc => ({
            id: pc.user.id,
            name: pc.user.name,
            email: pc.user.email,
            role: pc.role,
            is_active: pc.is_active,
            accepted_at: pc.accepted_at
          }))
        };
      }),
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