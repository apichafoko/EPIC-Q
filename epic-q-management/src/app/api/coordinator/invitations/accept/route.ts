import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token de invitación es requerido' },
        { status: 400 }
      );
    }

    // Buscar la invitación por token
    const invitation = await prisma.project_coordinators.findFirst({
      where: {
        invitation_token: token,
        is_active: false
      },
      include: {
        user: true,
        project: true,
        hospital: true
      }
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitación no encontrada o ya fue procesada' },
        { status: 404 }
      );
    }

    // Verificar que el token no haya expirado (24 horas)
    const invitationDate = new Date(invitation.invited_at);
    const now = new Date();
    const hoursDiff = (now.getTime() - invitationDate.getTime()) / (1000 * 60 * 60);

    if (hoursDiff > 24) {
      return NextResponse.json(
        { error: 'La invitación ha expirado' },
        { status: 400 }
      );
    }

    // Activar la invitación
    await prisma.project_coordinators.update({
      where: {
        id: invitation.id
      },
      data: {
        is_active: true,
        invitation_token: null,
        accepted_at: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Invitación aceptada exitosamente',
      project: {
        id: invitation.project.id,
        name: invitation.project.name
      },
      hospital: {
        id: invitation.hospital.id,
        name: invitation.hospital.name
      }
    });

  } catch (error) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}