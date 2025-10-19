import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, AuthContext } from '@/lib/auth/middleware';
import { prisma } from '@/lib/database';
import { z } from 'zod';

const createHospitalSchema = z.object({
  name: z.string().min(1, 'El nombre del hospital es requerido').max(255),
  province: z.string().optional(),
  city: z.string().optional(),
});

export const GET = withAdminAuth(async (request: NextRequest, context: AuthContext) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const [hospitals, total] = await Promise.all([
      prisma.hospitals.findMany({
        include: {
          hospital_details: true,
          hospital_contacts: true,
          _count: {
            select: {
              project_hospitals: true,
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        },
        skip,
        take: limit,
      }),
      prisma.hospitals.count()
    ]);

    return NextResponse.json({
      success: true,
      hospitals,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching hospitals:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
});

export const POST = withAdminAuth(async (request: NextRequest, context: AuthContext) => {
  try {
    const body = await request.json();
    
    // Validar datos
    const validatedData = createHospitalSchema.parse(body);

    // Crear hospital
    const hospital = await prisma.hospitals.create({
      data: {
        name: validatedData.name.trim(),
        province: validatedData.province?.trim(),
        city: validatedData.city?.trim(),
        status: 'active',
      },
      include: {
        details: true,
        contacts: true,
      }
    });

    return NextResponse.json({
      success: true,
      hospital,
      message: 'Hospital creado exitosamente'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating hospital:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
});