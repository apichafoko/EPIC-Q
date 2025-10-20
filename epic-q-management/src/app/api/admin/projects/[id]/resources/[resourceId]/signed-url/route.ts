import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, AuthContext } from '@/lib/auth/middleware';
import prisma from '@/lib/db-connection';
import { getSignedFileUrl } from '@/lib/services/s3-service';

async function handler(
  req: NextRequest,
  context: AuthContext,
  { params }: { params: Promise<{ id: string; resourceId: string }> }
) {
  const { id: projectId, resourceId } = await params;

  if (req.method === 'GET') {
    try {
      const resource = await prisma.project_resources.findFirst({
        where: {
          id: resourceId,
          project_id: projectId,
          is_active: true,
        },
      });

      if (!resource) {
        return NextResponse.json({ error: 'Recurso no encontrado' }, { status: 404 });
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
  { params }: { params: Promise<{ id: string; resourceId: string }> }
) {
  return withAdminAuth(async (req: NextRequest, context: AuthContext) => {
    return handler(req, context, { params });
  })(request);
}
