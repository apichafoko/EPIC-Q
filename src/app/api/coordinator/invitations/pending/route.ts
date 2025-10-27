import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Buscar invitaciones pendientes para el usuario (donde accepted_at es null)
    const pendingInvitations = await prisma.project_coordinators.findMany({
      where: {
        user_id: userId,
        is_active: false,
        accepted_at: null
      },
      include: {
        projects: {
          select: {
            id: true,
            name: true,
            description: true,
            start_date: true,
            end_date: true
          }
        },
        hospitals: {
          select: {
            id: true,
            name: true,
            province: true,
            city: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      invitations: pendingInvitations
    });

  } catch (error) {
    console.error('Error fetching pending invitations:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
