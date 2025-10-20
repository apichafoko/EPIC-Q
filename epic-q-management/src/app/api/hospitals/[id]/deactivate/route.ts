import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { withAdminAuth } from '@/lib/auth/middleware';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🏥 POST /api/hospitals/[id]/deactivate - Iniciando desactivación');
    
    return withAdminAuth(req, async (user) => {
    console.log('👤 Usuario autenticado:', { id: user.id, email: user.email, role: user.role });
    
    try {
      const { id: hospitalId } = await params;
      console.log('📋 Parámetros:', { hospitalId });
      console.log('🔍 Buscando hospital con ID:', hospitalId);

      // Verificar que el hospital existe
      const hospital = await prisma.hospitals.findUnique({
        where: { id: hospitalId },
        include: {
          project_hospitals: {
            where: { status: 'active' }
          }
        }
      });

      console.log('🏥 Hospital encontrado:', hospital ? { id: hospital.id, name: hospital.name, status: hospital.status } : 'No encontrado');

      if (!hospital) {
        console.log('❌ Hospital no encontrado');
        return NextResponse.json(
          { error: 'Hospital no encontrado' },
          { status: 404 }
        );
      }

      // Verificar si el hospital está asociado a proyectos activos
      console.log('📊 Proyectos activos asociados:', hospital.project_hospitals.length);
      
      if (hospital.project_hospitals.length > 0) {
        console.log('⚠️ Hospital tiene proyectos activos, no se puede desactivar');
        return NextResponse.json(
          { 
            error: 'No se puede desactivar el hospital',
            details: 'El hospital está asociado a proyectos activos. Primero debe ser removido de todos los proyectos.'
          },
          { status: 400 }
        );
      }

      // Desactivar el hospital
      console.log('✅ Desactivando hospital...');
      const updatedHospital = await prisma.hospitals.update({
        where: { id: hospitalId },
        data: {
          status: 'inactive',
          updated_at: new Date()
        }
      });
      
      console.log('✅ Hospital desactivado exitosamente:', { id: updatedHospital.id, name: updatedHospital.name, status: updatedHospital.status });

      return NextResponse.json({
        message: 'Hospital desactivado exitosamente',
        hospital: {
          id: updatedHospital.id,
          name: updatedHospital.name,
          status: updatedHospital.status
        }
      });

    } catch (error) {
      console.error('❌ Error deactivating hospital:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : 'Unknown'
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
  } catch (error) {
    console.error('❌ Error crítico en endpoint de desactivación:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    return NextResponse.json(
      { 
        error: 'Error crítico del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
