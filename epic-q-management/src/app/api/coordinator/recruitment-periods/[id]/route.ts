import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/database';
import { SimpleAuthService } from '../../../../../lib/auth/simple-auth-service';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticación
    const authResult = await SimpleAuthService.verifyTokenFromRequest(request);
    
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    if (authResult.user.role !== 'coordinator') {
      return NextResponse.json(
        { error: 'Solo los coordinadores pueden editar períodos' },
        { status: 403 }
      );
    }

    const periodId = (await params).id;
    const body = await request.json();
    const { startDate, endDate } = body;

    // Validar fechas si se proporcionan
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Establecer a medianoche para comparación

      if (start < today) {
        return NextResponse.json(
          { error: 'La fecha de inicio no puede ser menor a la fecha actual' },
          { status: 400 }
        );
      }

      if (end <= start) {
        return NextResponse.json(
          { error: 'La fecha de fin debe ser posterior a la fecha de inicio' },
          { status: 400 }
        );
      }
    }

    // Verificar que el período pertenece al hospital del coordinador
    const existingPeriod = await prisma.recruitment_periods.findFirst({
      where: {
        id: periodId,
        project_hospitals: {
          hospital_id: authResult.user.hospitalId || ''
        }
      }
    });

    if (!existingPeriod) {
      return NextResponse.json(
        { error: 'Período no encontrado' },
        { status: 404 }
      );
    }

    // Actualizar período
    const updatedPeriod = await prisma.recruitment_periods.update({
      where: { id: periodId },
      data: {
        start_date: startDate ? new Date(startDate) : undefined,
        end_date: endDate ? new Date(endDate) : undefined,
        // El estado se calcula automáticamente, no se actualiza manualmente
      }
    });

    // Calcular estado automáticamente basado en fechas
    const now = new Date();
    let autoStatus = 'planned';
    
    if (updatedPeriod.start_date && updatedPeriod.end_date) {
      const startDate = new Date(updatedPeriod.start_date);
      const endDate = new Date(updatedPeriod.end_date);
      
      if (now < startDate) {
        autoStatus = 'planned';
      } else if (now >= startDate && now <= endDate) {
        autoStatus = 'active';
      } else if (now > endDate) {
        autoStatus = 'completed';
      }
    }

    return NextResponse.json({
      success: true,
      period: {
        id: updatedPeriod.id,
        periodNumber: updatedPeriod.period_number,
        startDate: updatedPeriod.start_date,
        endDate: updatedPeriod.end_date,
        status: autoStatus
      }
    });

  } catch (error) {
    console.error('Error updating recruitment period:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticación
    const authResult = await SimpleAuthService.verifyTokenFromRequest(request);
    
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    if (authResult.user.role !== 'coordinator') {
      return NextResponse.json(
        { error: 'Solo los coordinadores pueden eliminar períodos' },
        { status: 403 }
      );
    }

    const periodId = (await params).id;

    // Verificar que el período pertenece al hospital del coordinador
    const existingPeriod = await prisma.recruitment_periods.findFirst({
      where: {
        id: periodId,
        project_hospitals: {
          hospital_id: authResult.user.hospitalId || ''
        }
      }
    });

    if (!existingPeriod) {
      return NextResponse.json(
        { error: 'Período no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar período
    await prisma.recruitment_periods.delete({
      where: { id: periodId }
    });

    return NextResponse.json({
      success: true,
      message: 'Período eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error deleting recruitment period:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
