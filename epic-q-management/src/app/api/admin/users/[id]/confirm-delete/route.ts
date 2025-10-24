import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, AuthContext } from '../../../../../../lib/auth/middleware';
import { CascadeService } from '../../../../../../lib/services/cascade-service';

export const POST = withAdminAuth(async (request: NextRequest, context: AuthContext) => {
  try {
    const { params } = await request.json();
    const userId = params.id;

    // Ejecutar la eliminación del coordinador con cascada
    const deleteResult = await CascadeService.executeCoordinatorDeletion(userId);

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
    console.error('Error al confirmar eliminación de coordinador:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
});
