import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth/middleware';
import { CascadeService } from '@/lib/services/cascade-service';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAdminAuth(req, async (user) => {
    try {
      const hospitalId = params.id;
      const body = await req.json();
      const { deleteCoordinators = false } = body;

      // Ejecutar la eliminación con las opciones confirmadas
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
        success: true,
        message: deleteResult.message,
        actions: deleteResult.actions
      });

    } catch (error) {
      console.error('Error al confirmar eliminación de hospital:', error);
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  });
}
