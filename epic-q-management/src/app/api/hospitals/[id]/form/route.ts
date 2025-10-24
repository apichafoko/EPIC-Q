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

    const { id: hospitalId } = await params;
    const body = await request.json();
    
    console.log('Hospital form save request:', {
      hospitalId,
      userId: authResult.user.id,
      userRole: authResult.user.role,
      userHospitalId: authResult.user.hospitalId,
      bodyKeys: Object.keys(body)
    });
    
    const {
      // Datos básicos del hospital
      name,
      province,
      city,
      participatedLasos,
      // Datos estructurales
      numBeds,
      numOperatingRooms,
      numIcuBeds,
      avgWeeklySurgeries,
      hasResidencyProgram,
      hasPreopClinic,
      hasRapidResponseTeam,
      financingType,
      hasEthicsCommittee,
      universityAffiliated,
      notes,
      // Datos del coordinador
      coordinatorFirstName,
      coordinatorLastName,
      coordinatorEmail,
      coordinatorPhone,
      coordinatorPosition
    } = body;

    // Para coordinadores, verificar acceso al hospital a través de ProjectCoordinator
    if (authResult.user.role === 'coordinator') {
      const projectCoordinator = await prisma.project_coordinators.findFirst({
        where: {
          user_id: authResult.user.id,
          hospital_id: hospitalId,
          is_active: true
        }
      });

      if (!projectCoordinator) {
        console.log('Coordinator access denied:', {
          userId: authResult.user.id,
          hospitalId,
          projectCoordinator: null
        });
        return NextResponse.json(
          { error: 'No tienes acceso a este hospital' },
          { status: 403 }
        );
      }
    }

        // Actualizar datos básicos del hospital (sin duplicar bed_count)
        console.log('Updating hospital basic info:', {
          hospitalId,
          province,
          city,
          lasos_participation: participatedLasos
        });

        await prisma.hospitals.update({
          where: { id: hospitalId },
          data: {
            province: province || '',
            city: city || '',
            lasos_participation: participatedLasos || false
          }
        });

        console.log('Hospital basic info updated successfully');

    // Actualizar o crear hospital_details
    console.log('Saving hospital details:', {
      hospitalId,
      numBeds: parseInt(numBeds) || 0,
      numOperatingRooms: parseInt(numOperatingRooms) || 0,
      numIcuBeds: parseInt(numIcuBeds) || 0,
      avgWeeklySurgeries: parseInt(avgWeeklySurgeries) || 0,
      hasResidencyProgram: hasResidencyProgram || false,
      hasPreopClinic: hasPreopClinic || '',
      hasRapidResponseTeam: hasRapidResponseTeam || false,
      financingType: financingType || '',
      hasEthicsCommittee: hasEthicsCommittee || false,
      universityAffiliated: universityAffiliated || false,
      notes: notes || ''
    });

        const detailsResult = await prisma.hospital_details.upsert({
          where: { hospital_id: hospitalId },
          update: {
            num_beds: parseInt(numBeds) || 0,
            num_operating_rooms: parseInt(numOperatingRooms) || 0,
            num_icu_beds: parseInt(numIcuBeds) || 0,
            avg_weekly_surgeries: parseInt(avgWeeklySurgeries) || 0,
            has_preop_clinic: hasPreopClinic || '',
            financing_type: financingType || '',
            has_residency_program: hasResidencyProgram || false,
            has_ethics_committee: hasEthicsCommittee || false,
            has_rapid_response_team: hasRapidResponseTeam || false,
            university_affiliated: universityAffiliated || false,
            notes: notes || ''
          },
          create: {
            id: `details-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            hospital_id: hospitalId,
            num_beds: parseInt(numBeds) || 0,
            num_operating_rooms: parseInt(numOperatingRooms) || 0,
            num_icu_beds: parseInt(numIcuBeds) || 0,
            avg_weekly_surgeries: parseInt(avgWeeklySurgeries) || 0,
            has_preop_clinic: hasPreopClinic || '',
            financing_type: financingType || '',
            has_residency_program: hasResidencyProgram || false,
            has_ethics_committee: hasEthicsCommittee || false,
            has_rapid_response_team: hasRapidResponseTeam || false,
            university_affiliated: universityAffiliated || false,
            notes: notes || ''
          }
        });

    console.log('Hospital details saved:', detailsResult);

    // Actualizar o crear contacto del coordinador principal
    if (coordinatorFirstName || coordinatorLastName || coordinatorEmail || coordinatorPhone || coordinatorPosition) {
      // Combinar nombre y apellido
      const fullName = [coordinatorFirstName, coordinatorLastName].filter(Boolean).join(' ');
      
      // Buscar si ya existe un contacto coordinador principal
      const existingContact = await prisma.hospital_contacts.findFirst({
        where: {
          hospital_id: hospitalId,
          role: 'coordinator',
          is_primary: true
        }
      });

      if (existingContact) {
        // Actualizar contacto existente
        await prisma.hospital_contacts.update({
          where: { id: existingContact.id },
          data: {
            name: fullName || '',
            email: coordinatorEmail || '',
            phone: coordinatorPhone || '',
            specialty: coordinatorPosition || '',
            is_primary: true
          }
        });
      } else {
        // Crear nuevo contacto
        await prisma.hospital_contacts.create({
          data: {
            id: `contact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            hospital_id: hospitalId,
            role: 'coordinator',
            name: fullName || '',
            email: coordinatorEmail || '',
            phone: coordinatorPhone || '',
            specialty: coordinatorPosition || '',
            is_primary: true
          }
        });
      }
    }

    // Actualizar el progreso del hospital
    // Buscar el project_hospital_id para este hospital
    const projectHospital = await prisma.project_hospitals.findFirst({
      where: { hospital_id: hospitalId },
      select: { id: true, project_id: true }
    });

    if (projectHospital) {
      await prisma.hospital_progress.upsert({
        where: { project_hospital_id: projectHospital.id },
        update: {
          status: 'completed',
          progress_percentage: 100,
          updated_at: new Date()
        },
        create: {
          id: `progress-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          hospital_id: hospitalId,
          project_id: projectHospital.project_id,
          project_hospital_id: projectHospital.id,
          status: 'completed',
          progress_percentage: 100,
          updated_at: new Date()
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Formulario guardado exitosamente'
    });

  } catch (error) {
    console.error('Error saving hospital form:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

