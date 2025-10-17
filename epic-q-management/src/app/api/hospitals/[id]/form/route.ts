import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { SimpleAuthService } from '@/lib/auth/simple-auth-service';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación
    const authService = new SimpleAuthService();
    const authResult = await authService.verifyToken(request);
    
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const hospitalId = params.id;
    const body = await request.json();
    const {
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
      coordinatorName,
      coordinatorEmail,
      coordinatorPhone,
      coordinatorPosition
    } = body;

    // Verificar que el usuario tenga acceso a este hospital
    if (authResult.user.role === 'coordinator' && authResult.user.hospitalId !== hospitalId) {
      return NextResponse.json(
        { error: 'No tienes acceso a este hospital' },
        { status: 403 }
      );
    }

    // Actualizar o crear hospital_details
    await prisma.hospitalDetails.upsert({
      where: { hospital_id: hospitalId },
      update: {
        num_beds: parseInt(numBeds) || 0,
        num_operating_rooms: parseInt(numOperatingRooms) || 0,
        num_icu_beds: parseInt(numIcuBeds) || 0,
        avg_weekly_surgeries: parseInt(avgWeeklySurgeries) || 0,
        has_residency_program: hasResidencyProgram || false,
        has_preop_clinic: hasPreopClinic || '',
        has_rapid_response_team: hasRapidResponseTeam || false,
        financing_type: financingType || '',
        has_ethics_committee: hasEthicsCommittee || false,
        university_affiliated: universityAffiliated || false,
        notes: notes || ''
      },
      create: {
        hospital_id: hospitalId,
        num_beds: parseInt(numBeds) || 0,
        num_operating_rooms: parseInt(numOperatingRooms) || 0,
        num_icu_beds: parseInt(numIcuBeds) || 0,
        avg_weekly_surgeries: parseInt(avgWeeklySurgeries) || 0,
        has_residency_program: hasResidencyProgram || false,
        has_preop_clinic: hasPreopClinic || '',
        has_rapid_response_team: hasRapidResponseTeam || false,
        financing_type: financingType || '',
        has_ethics_committee: hasEthicsCommittee || false,
        university_affiliated: universityAffiliated || false,
        notes: notes || ''
      }
    });

    // Actualizar o crear contacto del coordinador principal
    if (coordinatorName || coordinatorEmail || coordinatorPhone || coordinatorPosition) {
      await prisma.contact.upsert({
        where: { 
          hospital_id_role: {
            hospital_id: hospitalId,
            role: 'coordinator'
          }
        },
        update: {
          name: coordinatorName || '',
          email: coordinatorEmail || '',
          phone: coordinatorPhone || '',
          specialty: coordinatorPosition || '',
          is_primary: true
        },
        create: {
          hospital_id: hospitalId,
          role: 'coordinator',
          name: coordinatorName || '',
          email: coordinatorEmail || '',
          phone: coordinatorPhone || '',
          specialty: coordinatorPosition || '',
          is_primary: true
        }
      });
    }

    // Actualizar el progreso del hospital
    await prisma.hospitalProgress.upsert({
      where: { hospital_id: hospitalId },
      update: {
        descriptive_form_status: 'completed',
        updated_at: new Date()
      },
      create: {
        hospital_id: hospitalId,
        descriptive_form_status: 'completed',
        updated_at: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Formulario guardado exitosamente'
    });

  } catch (error) {
    console.error('Error saving hospital form:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

