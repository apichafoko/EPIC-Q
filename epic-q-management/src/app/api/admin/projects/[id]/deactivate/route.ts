import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, AuthContext } from '@/lib/auth/middleware';
import { prisma } from '@/lib/database';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(async (req: NextRequest, context: AuthContext) => {
    try {
      const { id } = await params;

      // Verificar que el proyecto existe
      const existingProject = await prisma.projects.findUnique({
        where: { id }
      });

      if (!existingProject) {
        return NextResponse.json(
          { error: 'Proyecto no encontrado' },
          { status: 404 }
        );
      }

      // Verificar que el proyecto esté activo
      if (existingProject.status !== 'active') {
        return NextResponse.json(
          { error: 'Solo se pueden desactivar proyectos activos' },
          { status: 400 }
        );
      }

      // Desactivar el proyecto (cambiar status a 'inactive')
      const project = await prisma.projects.update({
        where: { id },
        data: {
          status: 'inactive',
          updated_at: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        project,
        message: 'Proyecto desactivado exitosamente'
      });

    } catch (error) {
      console.error('Error deactivating project:', error);
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  })(request);
}
