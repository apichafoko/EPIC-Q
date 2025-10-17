import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { SimpleAuthService } from '@/lib/auth/simple-auth-service';

export async function PUT(request: NextRequest) {
  try {
    const authResult = await SimpleAuthService.verifyTokenFromRequest(request);
    
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    if (authResult.user.role !== 'coordinator') {
      return NextResponse.json(
        { error: 'Solo los coordinadores pueden actualizar la información de ética' },
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
    const { ethicsSubmitted, ethicsApproved, ethicsSubmittedDate, ethicsApprovedDate } = body;

    // Obtener ProjectCoordinator para verificar acceso al proyecto
    const projectCoordinator = await prisma.projectCoordinator.findFirst({
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
    const projectHospital = await prisma.projectHospital.findFirst({
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

    // Convertir fechas si están presentes
    const submittedDate = ethicsSubmittedDate ? new Date(ethicsSubmittedDate) : null;
    const approvedDate = ethicsApprovedDate ? new Date(ethicsApprovedDate) : null;

    // Actualizar el progreso del hospital en el proyecto
    const updatedProgress = await prisma.projectHospitalProgress.upsert({
      where: { project_hospital_id: projectHospital.id },
      update: {
        ethics_submitted: ethicsSubmitted,
        ethics_approved: ethicsApproved,
        ethics_submitted_date: submittedDate,
        ethics_approved_date: approvedDate,
      },
      create: {
        project_hospital_id: projectHospital.id,
        ethics_submitted: ethicsSubmitted,
        ethics_approved: ethicsApproved,
        ethics_submitted_date: submittedDate,
        ethics_approved_date: approvedDate,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Información de ética actualizada exitosamente',
      progress: updatedProgress
    });

  } catch (error) {
    console.error('Error updating ethics information:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
