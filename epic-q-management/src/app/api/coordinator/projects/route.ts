import { NextRequest, NextResponse } from 'next/server';
import { withCoordinatorAuth, AuthContext } from '../../../../lib/auth/middleware';
import { prisma } from '../../../../lib/db-connection';

export async function GET(request: NextRequest) {
  return withCoordinatorAuth(async (request: NextRequest, context: AuthContext) => {
  try {
    const userId = context.user.id;

    // Obtener proyectos donde el usuario es coordinador
    const projectCoordinators = await prisma.project_coordinators.findMany({
      where: {
        user_id: userId,
        is_active: true
      },
      include: {
        projects: {
          include: {
            _count: {
              select: {
                project_hospitals: true,
                project_coordinators: true,
              }
            }
          }
        },
        hospitals: {
          select: {
            id: true,
            name: true,
            province: true,
            city: true,
            address: true,
            phone: true,
            email: true,
            website: true,
            bed_count: true,
            lasos_participation: true,
            status: true,
            created_at: true,
            updated_at: true,
            hospital_details: {
              select: {
                num_beds: true,
                num_operating_rooms: true,
                num_icu_beds: true,
                avg_weekly_surgeries: true,
                financing_type: true,
                has_preop_clinic: true,
                has_residency_program: true,
                has_ethics_committee: true,
                has_rapid_response_team: true,
                university_affiliated: true,
                notes: true
              }
            },
            hospital_contacts: {
              where: {
                role: 'coordinator',
                is_primary: true
              },
              select: {
                name: true,
                email: true,
                phone: true,
                specialty: true
              }
            }
          }
        }
      },
      orderBy: {
        invited_at: 'desc'
      }
    });

    // Transformar los datos para el frontend
    const projects = projectCoordinators.map(pc => ({
      id: pc.projects.id,
      name: pc.projects.name,
      description: pc.projects.description,
      start_date: pc.projects.start_date,
      end_date: pc.projects.end_date,
      status: pc.projects.status,
      created_at: pc.projects.created_at,
      updated_at: pc.projects.updated_at,
      // Información específica del coordinador en este proyecto
      coordinatorInfo: {
        hospital: pc.hospitals,
        role: pc.role,
        invited_at: pc.invited_at,
        accepted_at: pc.accepted_at,
        required_periods: pc.projects._count.project_hospitals
      },
      // Estadísticas del proyecto
      stats: {
        total_hospitals: pc.projects._count.project_hospitals,
        total_coordinators: pc.projects._count.project_coordinators
      }
    }));

    return NextResponse.json({
      success: true,
      projects
    });

  } catch (error) {
    console.error('Error fetching coordinator projects:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
  })(request);
}