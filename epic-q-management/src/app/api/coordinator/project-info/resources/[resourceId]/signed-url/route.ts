import { NextRequest, NextResponse } from 'next/server';
import { withCoordinatorAuth } from '@/lib/auth/middleware';
import prisma from '@/lib/db-connection';
import { getSignedFileUrl } from '@/lib/services/s3-service';

async function handler(
  req: NextRequest,
  context: any,
  { params }: { params: Promise<{ resourceId: string }> }
) {
  const { resourceId } = await params;

  if (req.method === 'GET') {
    try {
      // Verificar que el coordinador tenga acceso al recurso
      const resource = await prisma.project_resources.findFirst({
        where: {
          id: resourceId,
          is_active: true,
          project: {
            project_coordinators: {
              some: {
                user_id: context.user.id,
                is_active: true
              }
            }
          }
        },
        include: {
          project: true
        }
      });

      if (!resource) {
        return NextResponse.json({ error: 'Recurso no encontrado o sin acceso' }, { status: 404 });
      }

      if (!resource.s3_key) {
        return NextResponse.json({ error: 'Este recurso no es un archivo' }, { status: 400 });
      }

      // Generar nueva URL firmada
      const signedUrl = await getSignedFileUrl(resource.s3_key, 7 * 24 * 3600); // 7 días

      return NextResponse.json({ 
        success: true, 
        data: { 
          signedUrl,
          expiresIn: 7 * 24 * 3600 // 7 días en segundos
        } 
      });
    } catch (error) {
      console.error('Error generating signed URL:', error);
      return NextResponse.json({ error: 'Error al generar URL firmada' }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ resourceId: string }> }
) {
  return withCoordinatorAuth(async (req: NextRequest, context: any) => {
    return handler(req, context, { params });
  })(request);
}
