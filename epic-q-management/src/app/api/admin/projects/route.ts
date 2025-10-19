import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, AuthContext } from '@/lib/auth/middleware';
import { prisma } from '@/lib/database';

export const GET = withAdminAuth(async (request: NextRequest, context: AuthContext) => {
  try {
    console.log('GET /api/admin/projects - Starting request');
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    console.log('GET /api/admin/projects - Params:', { status, page, limit, skip });

    // Construir filtros
    const where: any = {};
    if (status !== 'all') {
      where.status = status;
    }

    // Obtener proyectos con conteos
    console.log('GET /api/admin/projects - Querying database...');
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
    
    console.log('GET /api/admin/projects - Query successful:', { projectsCount: projects.length, total });

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
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});

export const POST = withAdminAuth(async (request: NextRequest, context: AuthContext) => {
  let body: any;
  try {
    body = await request.json();
    
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
        id: crypto.randomUUID(),
        name: body.name.trim(),
        description: body.description?.trim() || null,
        start_date: body.start_date ? new Date(body.start_date) : null,
        end_date: body.end_date ? new Date(body.end_date) : null,
        required_periods: body.default_required_periods || 1,
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
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      body: body
    });
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});