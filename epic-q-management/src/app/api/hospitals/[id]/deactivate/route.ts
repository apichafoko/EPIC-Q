import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { withAdminAuth } from '@/lib/auth/middleware';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAdminAuth(req, async (user) => {
    try {
      const hospitalId = params.id;

      // Verificar que el hospital existe
      const hospital = await prisma.hospitals.findUnique({
        where: { id: hospitalId },
        include: {
          project_hospitals: {
            where: { status: 'active' }
          }
        }
      });

      if (!hospital) {
        return NextResponse.json(
          { error: 'Hospital no encontrado' },
          { status: 404 }
        );
      }

      // Verificar si el hospital está asociado a proyectos activos
      if (hospital.project_hospitals.length > 0) {
        return NextResponse.json(
          { 
            error: 'No se puede desactivar el hospital',
            details: 'El hospital está asociado a proyectos activos. Primero debe ser removido de todos los proyectos.'
          },
          { status: 400 }
        );
      }

      // Desactivar el hospital
      const updatedHospital = await prisma.hospitals.update({
        where: { id: hospitalId },
        data: {
          status: 'inactive',
          updated_at: new Date()
        }
      });

      return NextResponse.json({
        message: 'Hospital desactivado exitosamente',
        hospital: {
          id: updatedHospital.id,
          name: updatedHospital.name,
          status: updatedHospital.status
        }
      });

    } catch (error) {
      console.error('Error deactivating hospital:', error);
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  });
}
