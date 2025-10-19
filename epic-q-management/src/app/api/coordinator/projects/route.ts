import { NextRequest, NextResponse } from 'next/server';
import { withCoordinatorAuth, AuthContext } from '@/lib/auth/middleware';
import { prisma } from '@/lib/database';

export const GET = withCoordinatorAuth(async (request: NextRequest, context: AuthContext) => {
  try {
    const userId = context.user.id;

    // Obtener proyectos donde el usuario es coordinador
    const projectCoordinators = await prisma.project_coordinators.findMany({
      where: {
        user_id: userId,
        is_active: true
      },
      include: {
        project: {
          include: {
            _count: {
              select: {
                project_hospitals: true,
                project_coordinators: true,
              }
            }
          }
        },
        hospital: {
          select: {
            id: true,
            name: true,
            province: true,
            city: true
          }
        }
      },
      orderBy: {
        invited_at: 'desc'
      }
    });

    // Transformar los datos para el frontend
    const projects = projectCoordinators.map(pc => ({
      id: pc.project.id,
      name: pc.project.name,
      description: pc.project.description,
      start_date: pc.project.start_date,
      end_date: pc.project.end_date,
      status: pc.project.status,
      created_at: pc.project.created_at,
      updated_at: pc.project.updated_at,
      // Información específica del coordinador en este proyecto
      coordinatorInfo: {
        hospital: pc.hospital,
        role: pc.role,
        invited_at: pc.invited_at,
        accepted_at: pc.accepted_at,
        required_periods: pc.project._count.project_hospitals
      },
      // Estadísticas del proyecto
      stats: {
        total_hospitals: pc.project._count.project_hospitals,
        total_coordinators: pc.project._count.project_coordinators
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
});