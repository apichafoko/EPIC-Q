import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, AuthContext } from '@/lib/auth/middleware';
import { prisma } from '@/lib/database';
import { z } from 'zod';

const bulkDeactivateSchema = z.object({
  projectIds: z.array(z.string()).min(1, 'Debe seleccionar al menos un proyecto')
});

export async function PUT(request: NextRequest) {
  return withAdminAuth(async (req: NextRequest, context: AuthContext) => {
    try {
      const body = await request.json();
      const { projectIds } = bulkDeactivateSchema.parse(body);

      // Verificar que todos los proyectos existen y están activos
      const projects = await prisma.projects.findMany({
        where: {
          id: { in: projectIds },
          status: 'active'
        }
      });

      if (projects.length !== projectIds.length) {
        return NextResponse.json(
          { error: 'Algunos proyectos no existen o no están activos' },
          { status: 400 }
        );
      }

      // Desactivar todos los proyectos
      const result = await prisma.projects.updateMany({
        where: {
          id: { in: projectIds }
        },
        data: {
          status: 'inactive',
          updated_at: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        updatedCount: result.count,
        message: `${result.count} proyectos desactivados exitosamente`
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Datos inválidos', details: error.errors },
          { status: 400 }
        );
      }

      console.error('Error bulk deactivating projects:', error);
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  })(request);
}
