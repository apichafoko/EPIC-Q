import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth/middleware';
import prisma from '@/lib/db-connection';
import { deleteFile } from '@/lib/services/s3-service';

async function handler(
  req: NextRequest,
  context: any,
  params?: { params: Promise<{ id: string; resourceId: string }> }
) {
  if (!params) {
    return NextResponse.json({ error: 'Parámetros no encontrados' }, { status: 400 });
  }
  const { resourceId } = await params.params;

  if (req.method === 'PATCH') {
    try {
      const body = await req.json();
      const { title, description, order, is_active } = body;

      const resource = await prisma.project_resources.update({
        where: { id: resourceId },
        data: { title, description, order, is_active }
      });

      return NextResponse.json({ success: true, data: resource });
    } catch (error) {
      console.error('Error updating project resource:', error);
      return NextResponse.json({ error: 'Error al actualizar recurso' }, { status: 500 });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const resource = await prisma.project_resources.findUnique({
        where: { id: resourceId }
      });

      if (!resource) {
        return NextResponse.json({ error: 'Recurso no encontrado' }, { status: 404 });
      }

      // Si tiene archivo en S3, eliminarlo
      if (resource.s3_key) {
        await deleteFile(resource.s3_key);
      }

      await prisma.project_resources.delete({
        where: { id: resourceId }
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error deleting project resource:', error);
      return NextResponse.json({ error: 'Error al eliminar recurso' }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export const PATCH = withAdminAuth(handler);
export const DELETE = withAdminAuth(handler);
