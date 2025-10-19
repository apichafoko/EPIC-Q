import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, AuthContext } from '@/lib/auth/middleware';
import { prisma } from '@/lib/database';
import { z } from 'zod';

const updateProjectSchema = z.object({
  name: z.string().min(1, 'El nombre del proyecto es requerido').max(255).optional(),
  description: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  status: z.enum(['active', 'completed', 'archived']).optional(),
  default_required_periods: z.number().int().min(1).max(10).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(async (req: NextRequest, context: AuthContext) => {
    try {
      const { id } = await params;

    const project = await prisma.projects.findUnique({
      where: { id },
      include: {
        project_hospitals: {
          include: {
            hospitals: {
              include: {
                hospital_details: true,
                hospital_contacts: true
              }
            },
            recruitment_periods: {
              orderBy: { period_number: 'asc' }
            },
            _count: {
              select: {
                recruitment_periods: true
              }
            }
          }
        },
        project_coordinators: {
          include: {
            users: true,
            hospitals: true
          }
        },
        _count: {
          select: {
            project_hospitals: true,
            project_coordinators: true,
          }
        }
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      );
    }

      return NextResponse.json({
        success: true,
        project
      });

    } catch (error) {
      console.error('Error fetching project:', error);
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  })(request);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(async (req: NextRequest, context: AuthContext) => {
    try {
      const { id } = await params;
    const body = await request.json();
    
    // Validar datos
    const validatedData = updateProjectSchema.parse(body);
    
    // Verificar que el proyecto existe
    const existingProject = await prisma.projects.findUnique({
      where: { id }
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      );
    }

    // Convertir fechas si están presentes
    const updateData: any = {};
    
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.status !== undefined) updateData.status = validatedData.status;
    if (validatedData.default_required_periods !== undefined) updateData.default_required_periods = validatedData.default_required_periods;

    if (validatedData.start_date !== undefined) {
      updateData.start_date = validatedData.start_date ? new Date(validatedData.start_date) : null;
    }

    if (validatedData.end_date !== undefined) {
      updateData.end_date = validatedData.end_date ? new Date(validatedData.end_date) : null;
    }

    // Actualizar proyecto
    const project = await prisma.projects.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            project_hospitals: true,
            project_coordinators: true,
          }
        }
      }
    });

      return NextResponse.json({
        success: true,
        project,
        message: 'Proyecto actualizado exitosamente'
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Datos inválidos', details: error.errors },
          { status: 400 }
        );
      }

      console.error('Error updating project:', error);
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  })(request);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(async (req: NextRequest, context: AuthContext) => {
    try {
      const { id } = await params;

    // Verificar que el proyecto existe
    const existingProject = await prisma.projects.findUnique({
      where: { id }
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar proyecto con cascada (elimina automáticamente project_hospitals, project_coordinators, etc.)
    await prisma.projects.delete({
      where: { id }
    });

      return NextResponse.json({
        success: true,
        message: 'Proyecto eliminado exitosamente'
      });

    } catch (error) {
      console.error('Error deleting project:', error);
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  })(request);
}
