import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/auth/middleware';
import { ResourceService } from '@/lib/services/resource-service';
import { handleApiError } from '@/lib/error-handler';
import prisma from '@/lib/db-connection';

async function handler(
  req: NextRequest,
  context: AuthContext,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    if (req.method !== 'GET') {
      return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const { id: resourceId } = await params;
    const { searchParams } = new URL(req.url);
    const includeVersions = searchParams.get('includeVersions') === 'true';

    // Obtener recurso
    const resource = await ResourceService.getResourceById(resourceId, includeVersions);

    if (!resource) {
      return NextResponse.json({ error: 'Recurso no encontrado' }, { status: 404 });
    }

    // Validar acceso: coordinadores solo pueden acceder a recursos de sus proyectos
    if (context.user.role === 'coordinator') {
      const hasAccess = await prisma.project_coordinators.findFirst({
        where: {
          project_id: resource.project_id,
          user_id: context.user.id,
          is_active: true,
        },
      });

      if (!hasAccess) {
        return NextResponse.json(
          { error: 'No tienes acceso a este recurso' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: resource,
    });
  } catch (error) {
    return handleApiError(error, req, {
      userId: context.user.id,
      userName: context.user.name,
      resource: 'resources',
      action: 'get-resource',
    });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(handler)(request, { params });
}
