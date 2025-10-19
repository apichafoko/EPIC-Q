import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, AuthContext } from '@/lib/auth/middleware';
import { prisma } from '@/lib/database';
import { z } from 'zod';

const bulkDeleteSchema = z.object({
  projectIds: z.array(z.string()).min(1, 'Debe seleccionar al menos un proyecto')
});

export async function DELETE(request: NextRequest) {
  return withAdminAuth(async (req: NextRequest, context: AuthContext) => {
    try {
      const body = await request.json();
      const { projectIds } = bulkDeleteSchema.parse(body);

      // Verificar que todos los proyectos existen
      const projects = await prisma.projects.findMany({
        where: {
          id: { in: projectIds }
        }
      });

      if (projects.length !== projectIds.length) {
        return NextResponse.json(
          { error: 'Algunos proyectos no existen' },
          { status: 400 }
        );
      }

      // Verificar que todos los proyectos estén desactivados (inactive)
      const activeProjects = projects.filter(p => p.status === 'active');
      if (activeProjects.length > 0) {
        return NextResponse.json(
          { 
            error: 'Los proyectos deben estar desactivados antes de ser eliminados',
            activeProjects: activeProjects.map(p => ({ id: p.id, name: p.name }))
          },
          { status: 400 }
        );
      }

      // Eliminar todos los proyectos (con cascada automática)
      const result = await prisma.projects.deleteMany({
        where: {
          id: { in: projectIds }
        }
      });

      return NextResponse.json({
        success: true,
        deletedCount: result.count,
        message: `${result.count} proyectos eliminados exitosamente`
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Datos inválidos', details: error.errors },
          { status: 400 }
        );
      }

      console.error('Error bulk deleting projects:', error);
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  })(request);
}
