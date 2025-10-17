import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, AuthContext } from '@/lib/auth/middleware';
import { prisma } from '@/lib/database';
import { randomBytes } from 'crypto';
import { projectInvitationService } from '@/lib/notifications/project-invitation-service';

export async function POST(
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
          user: true,
          hospital: true
        }
      });

      if (!projectCoordinator) {
        return NextResponse.json(
          { error: 'Coordinador no encontrado en este proyecto' },
          { status: 404 }
        );
      }

      // Si ya fue aceptado, no se puede reenviar
      if (projectCoordinator.accepted_at) {
        return NextResponse.json(
          { error: 'No se puede reenviar la invitación a un coordinador que ya aceptó' },
          { status: 400 }
        );
      }

      // Generar nuevo token de invitación
      const newInvitationToken = randomBytes(32).toString('hex');

      // Actualizar el token de invitación
      await prisma.projectCoordinator.update({
        where: { id: projectCoordinator.id },
        data: {
          invitation_token: newInvitationToken,
          invited_at: new Date() // Actualizar fecha de invitación
        }
      });

      // Enviar email de invitación
      await projectInvitationService.sendProjectInvitation(
        projectCoordinator.user.email,
        projectCoordinator.user.name,
        project.name,
        newInvitationToken,
        projectCoordinator.hospital.name
      );

      return NextResponse.json({
        success: true,
        message: `Invitación reenviada exitosamente a ${projectCoordinator.user.email}`
      });

    } catch (error) {
      console.error('Error resending invitation:', error);
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  })(request, { params });
}
