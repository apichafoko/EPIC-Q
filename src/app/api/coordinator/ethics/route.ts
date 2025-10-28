import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/database';
import { SimpleAuthService } from '../../../../lib/auth/simple-auth-service';
import { uploadFile, getSignedFileUrl } from '../../../../lib/services/s3-service';

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

    // Verificar si es multipart/form-data (upload de archivo)
    const contentType = request.headers.get('content-type');
    let file: File | null = null;
    let ethicsSubmitted, ethicsApproved, ethicsSubmittedDate, ethicsApprovedDate;
    let ethicsDocumentUrl, ethicsDocumentS3Key;

    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData();
      ethicsSubmitted = formData.get('ethicsSubmitted') === 'true';
      ethicsApproved = formData.get('ethicsApproved') === 'true';
      ethicsSubmittedDate = formData.get('ethicsSubmittedDate');
      ethicsApprovedDate = formData.get('ethicsApprovedDate');
      file = formData.get('ethicsDocument') as File | null;
    } else {
      const body = await request.json();
      ethicsSubmitted = body.ethicsSubmitted;
      ethicsApproved = body.ethicsApproved;
      ethicsSubmittedDate = body.ethicsSubmittedDate;
      ethicsApprovedDate = body.ethicsApprovedDate;
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

    // Convertir fechas si están presentes
    const submittedDate = ethicsSubmittedDate ? new Date(ethicsSubmittedDate) : null;
    const approvedDate = ethicsApprovedDate ? new Date(ethicsApprovedDate) : null;

    // Buscar si ya existe un registro de progreso
    const existingProgress = await prisma.hospital_progress.findFirst({
      where: {
        hospital_id: projectCoordinator.hospital_id,
        project_id: projectId
      }
    });

    // Si hay un archivo, subirlo a S3
    if (file && file instanceof File && file.type === 'application/pdf' && file.size > 0) {
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const s3Key = `ethics/${projectId}/${projectCoordinator.hospital_id}/${Date.now()}-${file.name}`;
        await uploadFile(buffer, s3Key, file.type);
        // Generar URL firmada
        ethicsDocumentUrl = await getSignedFileUrl(s3Key, 7 * 24 * 3600); // 7 días
        ethicsDocumentS3Key = s3Key;
        
        console.log('📄 Archivo subido a S3:', { s3Key, fileName: file.name });
      } catch (error) {
        console.error('Error subiendo archivo a S3:', error);
        return NextResponse.json(
          { error: 'Error al subir el archivo' },
          { status: 500 }
        );
      }
    }

    let updatedProgress;
    const progressData: any = {
      ethics_submitted: ethicsSubmitted,
      ethics_approved: ethicsApproved,
      ethics_submitted_date: submittedDate,
      ethics_approved_date: approvedDate,
    };

    // Solo actualizar el documento si hay un nuevo archivo o si hay que limpiarlo
    if (file && file instanceof File && file.size > 0) {
      progressData.ethics_document_url = ethicsDocumentUrl || null;
      progressData.ethics_document_s3_key = ethicsDocumentS3Key || null;
    }

    if (existingProgress) {
      // Actualizar registro existente
      updatedProgress = await prisma.hospital_progress.update({
        where: { id: existingProgress.id },
        data: progressData
      });
    } else {
      // Crear nuevo registro
      updatedProgress = await prisma.hospital_progress.create({
        data: {
          id: `progress-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          hospital_id: projectCoordinator.hospital_id,
          project_id: projectId,
          project_hospital_id: projectHospital.id,
          ...progressData
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Información de ética actualizada exitosamente',
      progress: updatedProgress
    });

  } catch (error) {
    console.error('Error updating ethics information:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
