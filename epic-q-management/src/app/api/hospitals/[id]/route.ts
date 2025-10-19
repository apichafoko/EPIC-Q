import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { withAdminAuth } from '@/lib/auth/middleware';
import { CascadeService } from '@/lib/services/cascade-service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(req, async (user) => {
    try {
      const { id: hospitalId } = await params;

      const hospital = await prisma.hospitals.findUnique({
        where: { id: hospitalId },
        include: {
          details: true,
          progress: true,
          contacts: true,
          users: {
            where: { role: 'coordinator' }
          },
          project_hospitals: {
            include: {
              project: true
            }
          }
        }
      });

      if (!hospital) {
        return NextResponse.json(
          { error: 'Hospital no encontrado' },
          { status: 404 }
        );
      }

      // Mapear los datos para el frontend
      const mappedHospital = {
        ...hospital,
        participated_lasos: hospital.lasos_participation
      };

      return NextResponse.json({ hospital: mappedHospital });

    } catch (error) {
      console.error('Error fetching hospital:', error);
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(req, async (user) => {
    try {
      const { id: hospitalId } = await params;
      const body = await req.json();

      // Validar datos requeridos
      if (!body.name || !body.province || !body.city) {
        return NextResponse.json(
          { error: 'Nombre, provincia y ciudad son requeridos' },
          { status: 400 }
        );
      }

      // Verificar que el hospital existe
      const existingHospital = await prisma.hospitals.findUnique({
        where: { id: hospitalId }
      });

      if (!existingHospital) {
        return NextResponse.json(
          { error: 'Hospital no encontrado' },
          { status: 404 }
        );
      }

      // Actualizar el hospital
      const updatedHospital = await prisma.hospitals.update({
        where: { id: hospitalId },
        data: {
          name: body.name,
          redcap_id: body.redcap_id || null,
          province: body.province,
          city: body.city,
          status: body.status || 'pending',
          lasos_participation: body.participated_lasos || false,
          updated_at: new Date()
        }
      });

      // Mapear los datos para el frontend
      const mappedHospital = {
        ...updatedHospital,
        participated_lasos: updatedHospital.lasos_participation
      };

      return NextResponse.json({
        message: 'Hospital actualizado exitosamente',
        hospital: mappedHospital
      });

    } catch (error) {
      console.error('Error updating hospital:', error);
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(req, async (user) => {
    try {
      const { id: hospitalId } = await params;
      const { searchParams } = new URL(req.url);
      const deleteCoordinators = searchParams.get('deleteCoordinators') === 'true';

      // Usar el servicio de cascada para analizar las acciones necesarias
      const cascadeResult = await CascadeService.deleteHospitalWithCascade(hospitalId);

      if (!cascadeResult.success) {
        return NextResponse.json(
          { 
            error: cascadeResult.message,
            details: cascadeResult.warnings?.join(' ') || undefined
          },
          { status: 400 }
        );
      }

      // Si hay acciones de cascada, devolver información para confirmación
      if (cascadeResult.actions && cascadeResult.actions.length > 0) {
        return NextResponse.json({
          requiresConfirmation: true,
          message: cascadeResult.message,
          warnings: cascadeResult.warnings,
          actions: cascadeResult.actions,
          hospitalId: hospitalId
        });
      }

      // Si no hay acciones de cascada, proceder con la eliminación
      const deleteResult = await CascadeService.executeHospitalDeletion(hospitalId, deleteCoordinators);

      if (!deleteResult.success) {
        return NextResponse.json(
          { 
            error: deleteResult.message,
            details: deleteResult.actions?.map(a => a.description).join(', ')
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        message: deleteResult.message,
        actions: deleteResult.actions
      });

    } catch (error) {
      console.error('Error al eliminar hospital:', error);
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  });
}