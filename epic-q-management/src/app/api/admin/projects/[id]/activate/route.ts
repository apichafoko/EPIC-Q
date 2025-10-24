import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, AuthContext, prisma } from '@/lib';

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

      // Verificar que el proyecto esté inactivo
      if (existingProject.status !== 'inactive') {
        return NextResponse.json(
          { error: 'Solo se pueden activar proyectos inactivos' },
          { status: 400 }
        );
      }

      // Activar el proyecto (cambiar status a 'active')
      const project = await prisma.projects.update({
        where: { id },
        data: {
          status: 'active',
          updated_at: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        project,
        message: 'Proyecto activado exitosamente'
      });

    } catch (error) {
      console.error('Error activating project:', error);
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  })(request);
}

