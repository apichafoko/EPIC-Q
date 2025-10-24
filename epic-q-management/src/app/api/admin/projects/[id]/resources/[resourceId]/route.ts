import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, AuthContext } from '../../../../../../../lib/auth/middleware';
import prisma from '../../../../../../../lib/db-connection';
import { deleteFile } from '../../../../../../../lib/services/s3-service';

async function handler(
  req: NextRequest,
  context: AuthContext,
  { params }: { params: Promise<{ id: string; resourceId: string }> }
) {
  const { resourceId } = await params;

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; resourceId: string }> }
) {
  return withAdminAuth(async (req: NextRequest, context: AuthContext) => {
    return handler(req, context, { params });
  })(request);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; resourceId: string }> }
) {
  return withAdminAuth(async (req: NextRequest, context: AuthContext) => {
    return handler(req, context, { params });
  })(request);
}
