import { NextRequest, NextResponse } from 'next/server';
import { withCoordinatorAuth, AuthContext } from '@/lib/auth/middleware';
import { CoordinatorService } from '@/lib/services/coordinator-service';

export const GET = withCoordinatorAuth(async (request: NextRequest, context: AuthContext) => {
  try {
    const { user } = context;
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }

    // Obtener projectId del header o query params
    const projectId = request.headers.get('x-project-id') || 
                     new URL(request.url).searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID es requerido' },
        { status: 400 }
      );
    }

    const stats = await CoordinatorService.getCoordinatorStats(user.id, projectId);

    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching coordinator stats:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas del coordinador' },
      { status: 500 }
    );
  }
});
