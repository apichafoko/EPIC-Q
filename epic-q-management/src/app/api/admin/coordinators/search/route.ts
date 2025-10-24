import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, prisma } from '@/lib';

export const GET = withAdminAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');

    if (query.length < 2) {
      return NextResponse.json({ 
        success: true, 
        coordinators: [] 
      });
    }

    // Buscar coordinadores existentes por nombre, apellido o email
    const coordinators = await prisma.users.findMany({
      where: {
        role: 'coordinator',
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        lastLogin: true,
        created_at: true
      },
      orderBy: [
        { name: 'asc' },
        { email: 'asc' }
      ],
      take: limit
    });

    // Formatear resultados para mostrar "Apellido Nombre - Email"
    const formattedCoordinators = coordinators.map(coord => {
      const nameParts = coord.name?.split(' ') || [];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      return {
        id: coord.id,
        name: coord.name,
        email: coord.email,
        displayName: lastName ? `${lastName} ${firstName}` : firstName,
        lastLogin: coord.lastLogin,
        created_at: coord.created_at
      };
    });

    return NextResponse.json({
      success: true,
      coordinators: formattedCoordinators
    });

  } catch (error) {
    console.error('Error searching coordinators:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
});
