import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '../../../../lib/auth/middleware';
import { 
  getAllAlertConfigurations, 
  updateAlertConfiguration,
  createAlertConfiguration
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

// POST - Crear nueva configuración de alerta
export const POST = withAdminAuth(async (request: NextRequest, context: any) => {
  try {
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Error parseando JSON:', parseError);
      return NextResponse.json(
        { success: false, error: 'Formato JSON inválido' },
        { status: 400 }
      );
    }

    const { alert_type, enabled, notify_admin, notify_coordinator, auto_send_email, threshold_value, email_template_id } = body;

    if (!alert_type || typeof alert_type !== 'string' || alert_type.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'El tipo de alerta (alert_type) es requerido y debe ser una cadena no vacía' },
        { status: 400 }
      );
    }

    let result;
    try {
      result = await createAlertConfiguration({
        alert_type: alert_type.trim(),
        enabled: enabled !== undefined ? Boolean(enabled) : true,
        notify_admin: notify_admin !== undefined ? Boolean(notify_admin) : true,
        notify_coordinator: notify_coordinator !== undefined ? Boolean(notify_coordinator) : true,
        auto_send_email: auto_send_email !== undefined ? Boolean(auto_send_email) : false,
        threshold_value: threshold_value !== undefined && threshold_value !== null && threshold_value !== '' ? parseInt(String(threshold_value)) : null,
        email_template_id: email_template_id || null,
      });
    } catch (serviceError) {
      console.error('Error en createAlertConfiguration:', serviceError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error al crear configuración',
          message: serviceError instanceof Error ? serviceError.message : 'Error desconocido'
        }, 
        { status: 500 }
      );
    }

    if (!result || typeof result !== 'object') {
      console.error('Resultado inválido de createAlertConfiguration:', result);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error inesperado del servidor'
        }, 
        { status: 500 }
      );
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Configuración creada exitosamente',
        configuration: result.config
      }, { status: 201 });
    } else {
      const statusCode = result.error?.includes('Ya existe') ? 409 : 400;
      return NextResponse.json(
        { success: false, error: result.error || 'Error desconocido' },
        { status: statusCode }
      );
    }

  } catch (error) {
    console.error('Error inesperado en POST /api/alerts/configurations:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack available');
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
