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

    // Validar acceso
    const resource = await prisma.project_resources.findUnique({
      where: { id: resourceId },
      select: { project_id: true },
    });

    if (!resource) {
      return NextResponse.json({ error: 'Recurso no encontrado' }, { status: 404 });
    }

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

    const versions = await ResourceService.getResourceVersions(resourceId);

    return NextResponse.json({
      success: true,
      data: versions,
    });
  } catch (error) {
    return handleApiError(error, req, {
      userId: context.user.id,
      userName: context.user.name,
      resource: 'resources',
      action: 'get-versions',
    });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(handler)(request, { params });
}
