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
            error: 'No se pueden eliminar algunos hospitales',
            details: `Los siguientes hospitales están asociados a proyectos activos: ${hospitalsWithActiveProjects.map(h => h.name).join(', ')}`
          },
          { status: 400 }
        );
      }

      // Eliminar todos los hospitales y sus datos relacionados en una transacción
      const result = await prisma.$transaction(async (tx) => {
        let deletedCount = 0;

        for (const hospitalId of hospitalIds) {
          // Eliminar contactos
          await tx.contact.deleteMany({
            where: { hospital_id: hospitalId }
          });

          // Eliminar detalles del hospital
          await tx.hospitalDetails.deleteMany({
            where: { hospital_id: hospitalId }
          });

          // Eliminar progreso del hospital
          await tx.projectHospitalProgress.deleteMany({
            where: { 
              project_hospital: {
                hospital_id: hospitalId
              }
            }
          });

          // Eliminar períodos de reclutamiento
          await tx.projectRecruitmentPeriod.deleteMany({
            where: {
              project_hospital: {
                hospital_id: hospitalId
              }
            }
          });

          // Eliminar métricas de casos
          await tx.caseMetrics.deleteMany({
            where: { hospital_id: hospitalId }
          });

          // Eliminar alertas
          await tx.alert.deleteMany({
            where: { hospital_id: hospitalId }
          });

          // Eliminar comunicaciones
          await tx.communication.deleteMany({
            where: { hospital_id: hospitalId }
          });

          // Eliminar usuarios coordinadores del hospital
          await tx.user.deleteMany({
            where: { 
              hospital_id: hospitalId,
              role: 'coordinator'
            }
          });

          // Eliminar asociaciones con proyectos
          await tx.projectHospital.deleteMany({
            where: { hospital_id: hospitalId }
          });

          // Finalmente, eliminar el hospital
          await tx.hospital.delete({
            where: { id: hospitalId }
          });

          deletedCount++;
        }

        return { count: deletedCount };
      });

      return NextResponse.json({
        message: `${result.count} hospitales eliminados permanentemente`,
        count: result.count
      });

    } catch (error) {
      console.error('Error bulk deleting hospitals:', error);
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  });
}
