import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { withAdminAuth } from '@/lib/auth/middleware';

export async function POST(req: NextRequest) {
  return withAdminAuth(req, async (user) => {
    try {
      const { hospitalIds } = await req.json();

      if (!hospitalIds || !Array.isArray(hospitalIds) || hospitalIds.length === 0) {
        return NextResponse.json(
          { error: 'Se requieren IDs de hospitales válidos' },
          { status: 400 }
        );
      }

      // Verificar que todos los hospitales existen y no están asociados a proyectos activos
      const hospitals = await prisma.hospitals.findMany({
        where: { id: { in: hospitalIds } },
        include: {
          project_hospitals: {
            where: { status: 'active' }
          }
        }
      });

      if (hospitals.length !== hospitalIds.length) {
        return NextResponse.json(
          { error: 'Algunos hospitales no fueron encontrados' },
          { status: 404 }
        );
      }

      // Verificar hospitales asociados a proyectos activos
      const hospitalsWithActiveProjects = hospitals.filter(
        hospital => hospital.project_hospitals.length > 0
      );

      if (hospitalsWithActiveProjects.length > 0) {
        return NextResponse.json(
          { 
            error: 'No se pueden desactivar algunos hospitales',
            details: `Los siguientes hospitales están asociados a proyectos activos: ${hospitalsWithActiveProjects.map(h => h.name).join(', ')}`
          },
          { status: 400 }
        );
      }

      // Desactivar todos los hospitales en una transacción
      const result = await prisma.$transaction(async (tx) => {
        const updatedHospitals = await tx.hospital.updateMany({
          where: { 
            id: { in: hospitalIds },
            status: { not: 'inactive' }
          },
          data: {
            status: 'inactive',
            updated_at: new Date()
          }
        });

        return updatedHospitals;
      });

      return NextResponse.json({
        message: `${result.count} hospitales desactivados exitosamente`,
        count: result.count
      });

    } catch (error) {
      console.error('Error bulk deactivating hospitals:', error);
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  });
}
