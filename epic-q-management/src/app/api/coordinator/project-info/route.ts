import { NextRequest, NextResponse } from 'next/server';
import { withCoordinatorAuth, AuthContext } from '@/lib/auth/middleware';
import prisma from '@/lib/db-connection';

async function handler(req: NextRequest, context: AuthContext) {
  try {
    console.log('🔍 Buscando proyecto para coordinador:', context.user.id);
    
    // Obtener el proyecto actual del coordinador
    const coordinator = await prisma.project_coordinators.findFirst({
      where: {
        user_id: context.user.id,
        is_active: true
      },
      include: {
        projects: {
          include: {
            resources: {
              where: { is_active: true },
              orderBy: { order: 'asc' }
            }
          }
        }
      }
    });

    console.log('🔍 Coordinador encontrado:', !!coordinator);
    if (coordinator) {
      console.log('🔍 Proyecto:', coordinator.projects.name);
      console.log('🔍 Recursos:', coordinator.projects.resources.length);
    }

    if (!coordinator) {
      return NextResponse.json({ error: 'No project found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        project: {
          name: coordinator.projects.name,
          description: coordinator.projects.description,
          brief_description: coordinator.projects.brief_description,
        },
        resources: coordinator.projects.resources
      }
    });
  } catch (error) {
    console.error('Error fetching project info:', error);
    return NextResponse.json({ error: 'Error al cargar información del proyecto' }, { status: 500 });
  }
}

export const GET = withCoordinatorAuth(handler);
