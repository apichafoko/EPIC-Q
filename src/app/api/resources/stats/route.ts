import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/auth/middleware';
import { ResourceService } from '@/lib/services/resource-service';
import { handleApiError } from '@/lib/error-handler';

async function handler(
  req: NextRequest,
  context: AuthContext
): Promise<NextResponse> {
  try {
    if (req.method !== 'GET') {
      return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const { searchParams } = new URL(req.url);

    const projectId = searchParams.get('projectId') || undefined;
    const category = searchParams.get('category') || undefined;
    const type = searchParams.get('type') || undefined;

    // Si es coordinador, solo estadísticas de sus proyectos
    let filteredProjectId = projectId;
    if (context.user.role === 'coordinator') {
      // Validar que el coordinador tenga acceso al proyecto si se especifica
      if (projectId) {
        const hasAccess = await prisma.project_coordinators.findFirst({
          where: {
            project_id: projectId,
            user_id: context.user.id,
            is_active: true,
          },
        });
        if (!hasAccess) {
          return NextResponse.json(
            { error: 'No tienes acceso a este proyecto' },
            { status: 403 }
          );
        }
      }
      // Si no hay projectId, filtrar por proyectos del coordinador (se implementa en el servicio)
    }

    const stats = await ResourceService.getResourceStats(filteredProjectId, {
      category: category || undefined,
      type: type || undefined,
    });

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    return handleApiError(error, req, {
      userId: context.user.id,
      userName: context.user.name,
      resource: 'resources',
      action: 'get-stats',
    });
  }
}

export async function GET(request: NextRequest) {
  return withAuth(handler)(request);
}
