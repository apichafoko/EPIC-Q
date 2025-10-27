import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '../../../../lib/auth/middleware';
import { 
  getAllAlertConfigurations, 
  updateAlertConfiguration 
} from '../../../../lib/services/alert-service';

// GET - Obtener todas las configuraciones
export const GET = withAdminAuth(async (request: NextRequest, context: any) => {
  try {
    const configs = await getAllAlertConfigurations();

    return NextResponse.json({
      success: true,
      configurations: configs
    });

  } catch (error) {
    console.error('Error obteniendo configuraciones de alertas:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido'
      }, 
      { status: 500 }
    );
  }
});

// PUT - Actualizar configuración de tipo de alerta
export const PUT = withAdminAuth(async (request: NextRequest, context: any) => {
  try {
    const body = await request.json();
    const { alertType, ...config } = body;

    if (!alertType) {
      return NextResponse.json(
        { success: false, error: 'alertType es requerido' },
        { status: 400 }
      );
    }

    const result = await updateAlertConfiguration(alertType, config);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Configuración actualizada exitosamente',
        configuration: result.config
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error actualizando configuración de alerta:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido'
      }, 
      { status: 500 }
    );
  }
});
