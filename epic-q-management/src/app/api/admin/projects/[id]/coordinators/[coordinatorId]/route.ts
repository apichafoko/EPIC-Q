import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, AuthContext } from '@/lib/auth/middleware';
import { prisma } from '@/lib/database';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; coordinatorId: string }> }
) {
  return withAdminAuth(async (req: NextRequest, context: AuthContext) => {
    try {
      const { id: projectId, coordinatorId } = await params;

      // Verificar que el proyecto existe
      const project = await prisma.project.findUnique({
        where: { id: projectId }
      });

      if (!project) {
        return NextResponse.json(
          { error: 'Proyecto no encontrado' },
          { status: 404 }
        );
      }

      // Verificar que el coordinador está en el proyecto
      const projectCoordinator = await prisma.projectCoordinator.findFirst({
        where: {
          project_id: projectId,
          id: coordinatorId
        },
        include: {
          user: true
        }
      });

      if (!projectCoordinator) {
        return NextResponse.json(
          { error: 'Coordinador no encontrado en este proyecto' },
          { status: 404 }
        );
      }

      // Eliminar el coordinador del proyecto
      await prisma.projectCoordinator.delete({
        where: { id: projectCoordinator.id }
      });

      return NextResponse.json({
        success: true,
        message: `Coordinador "${projectCoordinator.user.name}" eliminado del proyecto exitosamente`
      });

    } catch (error) {
      console.error('Error removing coordinator from project:', error);
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  })(request, { params });
}
