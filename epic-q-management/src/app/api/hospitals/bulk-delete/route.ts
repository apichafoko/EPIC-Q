import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { SimpleAuthService } from '@/lib/auth/simple-auth-service';

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticación manualmente
    const token = req.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await SimpleAuthService.verifyToken(token);
    
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    // Continuar con la lógica de eliminación
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
        await tx.hospital_contacts.deleteMany({
          where: { hospital_id: hospitalId }
        });

        // Eliminar detalles del hospital
        await tx.hospital_details.deleteMany({
          where: { hospital_id: hospitalId }
        });

        // Eliminar progreso del hospital
        await tx.hospital_progress.deleteMany({
          where: { 
            project_hospitals: {
              hospital_id: hospitalId
            }
          }
        });

        // Eliminar períodos de reclutamiento
        await tx.recruitment_periods.deleteMany({
          where: {
            project_hospitals: {
              hospital_id: hospitalId
            }
          }
        });

        // Eliminar métricas de casos
        await tx.case_metrics.deleteMany({
          where: { hospital_id: hospitalId }
        });

        // Eliminar alertas
        await tx.alerts.deleteMany({
          where: { hospital_id: hospitalId }
        });

        // Eliminar comunicaciones
        await tx.communications.deleteMany({
          where: { hospital_id: hospitalId }
        });

        // Eliminar usuarios coordinadores del hospital
        await tx.users.deleteMany({
          where: { 
            hospitalId: hospitalId,
            role: 'coordinator'
          }
        });

        // Eliminar asociaciones con proyectos
        await tx.project_hospitals.deleteMany({
          where: { hospital_id: hospitalId }
        });

        // Finalmente, eliminar el hospital
        await tx.hospitals.delete({
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
}
