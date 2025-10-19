import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, AuthContext } from '@/lib/auth/middleware';
import { prisma } from '@/lib/database';

export const GET = withAdminAuth(async (request: NextRequest, context: AuthContext) => {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {};
    if (status !== 'all') {
      where.status = status;
    }

    // Obtener proyectos con conteos
    const [projects, total] = await Promise.all([
      prisma.projects.findMany({
        where,
        include: {
          _count: {
            select: {
              project_hospitals: true,
              project_coordinators: true,
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        },
        skip,
        take: limit,
      }),
      prisma.projects.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      projects,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
});

export const POST = withAdminAuth(async (request: NextRequest, context: AuthContext) => {
  try {
    const body = await request.json();
    
    // Validar datos básicos
    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json(
        { error: 'El nombre del proyecto es requerido' },
        { status: 400 }
      );
    }

    // Crear proyecto
    const project = await prisma.projects.create({
      data: {
        name: body.name.trim(),
        description: body.description?.trim() || null,
        start_date: body.start_date ? new Date(body.start_date) : null,
        end_date: body.end_date ? new Date(body.end_date) : null,
      },
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
      message: 'Proyecto creado exitosamente'
    });

  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
});