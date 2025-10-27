import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/database';
import { SimpleAuthService } from '../../../../lib/auth/simple-auth-service';

export async function GET(request: NextRequest) {
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
        { error: 'Solo los coordinadores pueden acceder a esta información' },
        { status: 403 }
      );
    }

    // Obtener projectId del header o query params
    const projectId = request.headers.get('x-project-id') || 
                     new URL(request.url).searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID es requerido' },
        { status: 400 }
      );
    }

    // Obtener ProjectCoordinator para verificar acceso al proyecto
    const projectCoordinator = await prisma.project_coordinators.findFirst({
      where: {
        user_id: authResult.user.id,
        project_id: projectId,
        is_active: true
      }
    });

    if (!projectCoordinator) {
      return NextResponse.json(
        { error: 'No tienes acceso a este proyecto' },
        { status: 403 }
      );
    }

    // Obtener ProjectHospital
    const projectHospital = await prisma.project_hospitals.findFirst({
      where: {
        project_id: projectId,
        hospital_id: projectCoordinator.hospital_id
      }
    });

    if (!projectHospital) {
      return NextResponse.json(
        { error: 'Hospital no encontrado en este proyecto' },
        { status: 404 }
      );
    }

    // Obtener períodos de reclutamiento del proyecto
    const periods = await prisma.recruitment_periods.findMany({
      where: {
        project_hospital_id: projectHospital.id
      },
      orderBy: {
        start_date: 'asc'
      }
    });

    // Calcular estado automáticamente basado en fechas
    const now = new Date();
    const periodsWithAutoStatus = periods.map(period => {
      let autoStatus = 'planned';
      
      if (period.start_date && period.end_date) {
        const startDate = new Date(period.start_date);
        const endDate = new Date(period.end_date);
        
        if (now < startDate) {
          autoStatus = 'planned';
        } else if (now >= startDate && now <= endDate) {
          autoStatus = 'active';
        } else if (now > endDate) {
          autoStatus = 'completed';
        }
      }
      
      return {
        id: period.id,
        periodNumber: period.period_number,
        startDate: period.start_date,
        endDate: period.end_date,
        status: autoStatus
      };
    });

    return NextResponse.json({
      success: true,
      periods: periodsWithAutoStatus
    });

  } catch (error) {
    console.error('Error fetching recruitment periods:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
        { error: 'Solo los coordinadores pueden crear períodos' },
        { status: 403 }
      );
    }

    // Obtener projectId del header o query params
    const projectId = request.headers.get('x-project-id') || 
                     new URL(request.url).searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID es requerido' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { startDate, endDate, status = 'planned' } = body;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Las fechas de inicio y fin son requeridas' },
        { status: 400 }
      );
    }

    // Validar fechas
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

    // Obtener ProjectCoordinator para verificar acceso al proyecto
    const projectCoordinator = await prisma.project_coordinators.findFirst({
      where: {
        user_id: authResult.user.id,
        project_id: projectId,
        is_active: true
      }
    });

    if (!projectCoordinator) {
      return NextResponse.json(
        { error: 'No tienes acceso a este proyecto' },
        { status: 403 }
      );
    }

    // Obtener ProjectHospital
    const projectHospital = await prisma.project_hospitals.findFirst({
      where: {
        project_id: projectId,
        hospital_id: projectCoordinator.hospital_id
      }
    });

    if (!projectHospital) {
      return NextResponse.json(
        { error: 'Hospital no encontrado en este proyecto' },
        { status: 404 }
      );
    }

    // Verificar si ya se alcanzó el límite de períodos
    const existingPeriodsCount = await prisma.recruitment_periods.count({
      where: { project_hospital_id: projectHospital.id }
    });

    const maxPeriods = 2; // Default value since required_periods doesn't exist in project_hospitals
    if (existingPeriodsCount >= maxPeriods) {
      return NextResponse.json(
        { 
          error: `Este hospital solo puede tener ${maxPeriods} períodos de reclutamiento. Ya se han creado ${existingPeriodsCount}.` 
        },
        { status: 400 }
      );
    }

    // Obtener el siguiente número de período para este hospital en el proyecto
    const lastPeriod = await prisma.recruitment_periods.findFirst({
      where: { project_hospital_id: projectHospital.id },
      orderBy: { period_number: 'desc' }
    });

    const nextPeriodNumber = lastPeriod ? lastPeriod.period_number + 1 : 1;

    // Crear nuevo período de reclutamiento
    const newPeriod = await prisma.recruitment_periods.create({
      data: {
        id: `period-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        project_hospital_id: projectHospital.id,
        period_number: nextPeriodNumber,
        start_date: new Date(startDate),
        end_date: new Date(endDate)
      }
    });

    return NextResponse.json({
      success: true,
      period: {
        id: newPeriod.id,
        periodNumber: newPeriod.period_number,
        startDate: newPeriod.start_date,
        endDate: newPeriod.end_date
      }
    });

  } catch (error) {
    console.error('Error creating recruitment period:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
