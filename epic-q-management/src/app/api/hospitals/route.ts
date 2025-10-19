import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, AuthContext } from '@/lib/auth/middleware';
import { prisma } from '@/lib/database';
import { z } from 'zod';

const createHospitalSchema = z.object({
  name: z.string().min(1, 'El nombre del hospital es requerido').max(255),
  province: z.string().optional().default(''),
  city: z.string().optional().default(''),
});

export const GET = withAdminAuth(async (request: NextRequest, context: AuthContext) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const [hospitals, total] = await Promise.all([
      prisma.hospitals.findMany({
        where: {
          status: 'active'
        },
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
      prisma.hospitals.count({
        where: {
          status: 'active'
        }
      })
    ]);

    // Mapear los datos para el frontend
    const mappedHospitals = hospitals.map(hospital => ({
      ...hospital,
      participated_lasos: hospital.lasos_participation
    }));

    return NextResponse.json({
      success: true,
      hospitals: mappedHospitals,
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
        id: `hospital-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: validatedData.name.trim(),
        province: validatedData.province?.trim() || '',
        city: validatedData.city?.trim() || '',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
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