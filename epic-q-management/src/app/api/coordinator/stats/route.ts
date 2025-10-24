import { NextRequest, NextResponse } from 'next/server';
import { withCoordinatorAuth, AuthContext } from '@/lib/auth/middleware';
import { CoordinatorService } from '@/lib/services/coordinator-service';

export async function GET(request: NextRequest) {
  return withCoordinatorAuth(async (request: NextRequest, context: AuthContext) => {
    try {
      const { user } = context;
      
      if (!user) {
        return NextResponse.json(
          { error: 'Usuario no autenticado' },
          { status: 401 }
        );
      }

      // Obtener projectId del header o query params (opcional)
      const projectId = request.headers.get('x-project-id') || 
                       new URL(request.url).searchParams.get('projectId');

      const stats = await CoordinatorService.getCoordinatorStats(user.id, projectId || undefined);

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
  })(request);
}
