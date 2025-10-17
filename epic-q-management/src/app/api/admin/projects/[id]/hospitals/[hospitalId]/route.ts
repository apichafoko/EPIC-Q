import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, AuthContext } from '@/lib/auth/middleware';
import { prisma } from '@/lib/database';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; hospitalId: string }> }
) {
  return withAdminAuth(async (req: NextRequest, context: AuthContext) => {
    try {
      const { id: projectId, hospitalId } = await params;

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

      // Verificar que el hospital está en el proyecto
      const projectHospital = await prisma.projectHospital.findFirst({
        where: {
          project_id: projectId,
          hospital_id: hospitalId
        },
        include: {
          hospital: true
        }
      });

      if (!projectHospital) {
        return NextResponse.json(
          { error: 'Hospital no encontrado en este proyecto' },
          { status: 404 }
        );
      }

      // Eliminar el hospital del proyecto (cascade delete eliminará progress y recruitment periods)
      await prisma.projectHospital.delete({
        where: { id: projectHospital.id }
      });

      return NextResponse.json({
        success: true,
        message: `Hospital "${projectHospital.hospital.name}" eliminado del proyecto exitosamente`
      });

    } catch (error) {
      console.error('Error removing hospital from project:', error);
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  })(request, { params });
}
