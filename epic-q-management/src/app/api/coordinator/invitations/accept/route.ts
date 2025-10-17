import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { z } from 'zod';
import { projectInvitationService } from '@/lib/notifications/project-invitation-service';

const acceptInvitationSchema = z.object({
  token: z.string().min(1, 'Token de invitación requerido'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar datos
    const validatedData = acceptInvitationSchema.parse(body);
    
    // Buscar la invitación por token
    const projectCoordinator = await prisma.projectCoordinator.findFirst({
      where: {
        invitation_token: validatedData.token,
        is_active: false
      },
      include: {
        user: true,
        hospital: true,
        project: true
      }
    });

    if (!projectCoordinator) {
      return NextResponse.json(
        { error: 'Token de invitación inválido o expirado' },
        { status: 400 }
      );
    }

    // Verificar que el token no haya expirado (opcional: agregar expiración)
    // Por ahora no implementamos expiración

    // Activar la invitación
    const updatedProjectCoordinator = await prisma.projectCoordinator.update({
      where: { id: projectCoordinator.id },
      data: {
        is_active: true,
        accepted_at: new Date(),
        invitation_token: null // Limpiar el token
      },
      include: {
        user: true,
        hospital: true,
        project: true
      }
    });

    // Enviar notificación al administrador
    try {
      await projectInvitationService.sendInvitationAcceptedNotification(updatedProjectCoordinator.id);
    } catch (error) {
      console.error('Error sending acceptance notification:', error);
      // No fallar la operación si no se puede enviar la notificación
    }

    return NextResponse.json({
      success: true,
      projectCoordinator: updatedProjectCoordinator,
      message: 'Invitación aceptada exitosamente'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Endpoint para obtener información de la invitación sin aceptarla
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token de invitación requerido' },
        { status: 400 }
      );
    }

    // Buscar la invitación por token
    const projectCoordinator = await prisma.projectCoordinator.findFirst({
      where: {
        invitation_token: token,
        is_active: false
      },
      include: {
        user: true,
        hospital: true,
        project: true
      }
    });

    if (!projectCoordinator) {
      return NextResponse.json(
        { error: 'Token de invitación inválido o expirado' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      invitation: {
        project: projectCoordinator.project,
        hospital: projectCoordinator.hospital,
        user: {
          name: projectCoordinator.user.name,
          email: projectCoordinator.user.email
        },
        invited_at: projectCoordinator.invited_at
      }
    });

  } catch (error) {
    console.error('Error fetching invitation:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
