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
    if (req.method !== 'POST') {
      return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const { id: resourceId } = await params;

    // Validar que el recurso existe
    const resource = await prisma.project_resources.findUnique({
      where: { id: resourceId },
      include: {
        project: {
          select: { id: true },
        },
      },
    });

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

    // Obtener body
    const body = await req.json().catch(() => ({}));
    const accessType = (body.accessType || 'view') as 'view' | 'download' | 'preview';

    // Obtener IP y user agent
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined;
    const userAgent = req.headers.get('user-agent') || undefined;

    // Registrar acceso
    await ResourceService.logResourceAccess(
      resourceId,
      accessType,
      context.user.id,
      ipAddress || undefined,
      userAgent || undefined
    );

    return NextResponse.json({
      success: true,
      message: 'Acceso registrado',
    });
  } catch (error) {
    return handleApiError(error, req, {
      userId: context.user.id,
      userName: context.user.name,
      resource: 'resources',
      action: 'log-access',
    });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(handler)(request, { params });
}
