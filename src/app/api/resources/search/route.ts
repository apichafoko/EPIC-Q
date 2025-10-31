import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/auth/middleware';
import { ResourceService } from '@/lib/services/resource-service';
import { handleApiError } from '@/lib/error-handler';
import prisma from '@/lib/db-connection';

async function handler(
  req: NextRequest,
  context: AuthContext
): Promise<NextResponse> {
  try {
    if (req.method !== 'GET') {
      return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const { searchParams } = new URL(req.url);

    // Parámetros de búsqueda
    const query = searchParams.get('query') || undefined;
    const projectId = searchParams.get('projectId') || undefined;
    const category = searchParams.get('category') || undefined;
    const type = searchParams.get('type') || undefined;
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || undefined;
    const isActive = searchParams.get('isActive') !== null
      ? searchParams.get('isActive') === 'true'
      : undefined;
    const createdAfter = searchParams.get('createdAfter')
      ? new Date(searchParams.get('createdAfter')!)
      : undefined;
    const createdBefore = searchParams.get('createdBefore')
      ? new Date(searchParams.get('createdBefore')!)
      : undefined;

    // Parámetros de paginación y ordenamiento
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const sortBy = (searchParams.get('sortBy') || 'relevance') as 'relevance' | 'date' | 'title';

    // Si es coordinador, validar acceso al proyecto si se especifica
    let filteredProjectId = projectId;
    if (context.user.role === 'coordinator' && projectId) {
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

    const result = await ResourceService.searchResources(
      {
        query,
        projectId: filteredProjectId,
        category,
        type,
        tags,
        isActive,
        createdAfter,
        createdBefore,
        userId: context.user.role === 'coordinator' ? context.user.id : undefined,
      },
      { limit, offset, sortBy }
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return handleApiError(error, req, {
      userId: context.user.id,
      userName: context.user.name,
      resource: 'resources',
      action: 'search',
    });
  }
}

// Permitir acceso a admins y coordinadores
export async function GET(request: NextRequest) {
  return withAuth(handler)(request);
}
