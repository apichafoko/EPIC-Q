import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/database';
import { withAdminAuth, AuthContext } from '../../../../lib/auth/middleware';
import { CascadeService } from '../../../../lib/services/cascade-service';

async function handler(
  req: NextRequest,
  context: AuthContext,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🏥 GET /api/hospitals/[id] - Starting request');
    const { id: hospitalId } = await params;
    console.log('🏥 GET /api/hospitals/[id] - Hospital ID:', hospitalId);
    
    console.log('🏥 GET /api/hospitals/[id] - Querying database...');
    const hospital = await prisma.hospitals.findUnique({
      where: { id: hospitalId },
      include: {
        hospital_details: true,
        hospital_contacts: true,
        project_hospitals: {
          include: {
            projects: true,
            recruitment_periods: true,
            hospital_progress: true,
            _count: { select: { recruitment_periods: true } },
          }
        },
        _count: {
          select: {
            project_hospitals: true,
            hospital_contacts: true,
          }
        }
      }
    });
    console.log('🏥 GET /api/hospitals/[id] - Query result:', !!hospital);

    if (!hospital) {
      console.log('🏥 GET /api/hospitals/[id] - Hospital not found');
      return NextResponse.json(
        { error: 'Hospital no encontrado' },
        { status: 404 }
      );
    }

    // Mapear los datos para el frontend + métricas
    console.log('🏥 GET /api/hospitals/[id] - Mapping data...');
    const phs: any[] = (hospital as any).project_hospitals || [];

    let ethicsPending = 0, ethicsSubmitted = 0, ethicsApproved = 0;
    let formPending = 0, formPartial = 0, formComplete = 0;
    let periodsTotal = 0, periodsUpcoming = 0;

    const today = new Date();
    const in60 = new Date();
    in60.setDate(today.getDate() + 60);

    phs.forEach((ph) => {
      const progress = Array.isArray(ph.hospital_progress) ? ph.hospital_progress[0] : ph.hospital_progress;
      const pct = typeof progress?.progress_percentage === 'number' ? progress.progress_percentage : null;
      if (progress?.ethics_approved) ethicsApproved++; else if (progress?.ethics_submitted) ethicsSubmitted++; else ethicsPending++;
      if (pct === null || pct === 0) formPending++; else if (pct > 0 && pct < 100) formPartial++; else if (pct >= 100) formComplete++;

      const periods = ph.recruitment_periods || [];
      periodsTotal += periods.length;
      periods.forEach((p: any) => {
        const sd = p.start_date ? new Date(p.start_date) : null;
        if (sd && sd >= today && sd <= in60) periodsUpcoming++;
      });
    });

    const mappedHospital = {
      id: hospital.id,
      name: hospital.name,
      province: hospital.province,
      city: hospital.city,
      status: hospital.status,
      participated_lasos: hospital.lasos_participation,
      created_at: hospital.created_at,
      updated_at: hospital.updated_at,
      details: hospital.hospital_details ? {
        num_beds: hospital.hospital_details.num_beds,
        num_operating_rooms: hospital.hospital_details.num_operating_rooms,
        num_icu_beds: hospital.hospital_details.num_icu_beds,
        avg_weekly_surgeries: hospital.hospital_details.avg_weekly_surgeries,
        has_residency_program: hospital.hospital_details.has_residency_program,
        has_preop_clinic: hospital.hospital_details.has_preop_clinic,
        has_rapid_response_team: hospital.hospital_details.has_rapid_response_team,
        financing_type: hospital.hospital_details.financing_type,
        has_ethics_committee: hospital.hospital_details.has_ethics_committee,
        university_affiliated: hospital.hospital_details.university_affiliated,
        notes: hospital.hospital_details.notes,
      } : undefined,
      contacts: (hospital.hospital_contacts || []).map((c) => ({
        id: c.id,
        role: c.role,
        name: c.name,
        email: c.email,
        phone: c.phone,
        specialty: c.specialty,
        is_primary: c.is_primary,
      })),
      project_hospitals: phs.map((ph) => ({
        id: ph.id,
        project: ph.projects ? {
          id: ph.projects.id,
          name: ph.projects.name,
          status: ph.projects.status,
        } : { id: ph.project_id, name: 'Proyecto', status: 'active' },
        required_periods: ph.projects?.required_periods ?? 0,
        status: ph.status,
        joined_at: ph.created_at,
        _count: { recruitment_periods: ph._count?.recruitment_periods || (ph.recruitment_periods?.length || 0) },
      })),
      summary: {
        projectsTotal: phs.length,
        contactsTotal: hospital._count?.hospital_contacts || 0,
        ethics: { pending: ethicsPending, submitted: ethicsSubmitted, approved: ethicsApproved },
        form: { pending: formPending, partial: formPartial, complete: formComplete },
        periods: { total: periodsTotal, upcoming60d: periodsUpcoming },
      }
    };
    console.log('🏥 GET /api/hospitals/[id] - Data mapped successfully');

    return NextResponse.json({ hospital: mappedHospital });

  } catch (error) {
    console.error('Error in GET /api/hospitals/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(async (req: NextRequest, context: AuthContext) => {
    return handler(req, context, { params });
  })(request);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(async (req: NextRequest, context: AuthContext) => {
    try {
      const { id: hospitalId } = await params;
      const body = await req.json();

      // Validar datos requeridos
      if (!body.name || !body.province || !body.city) {
        return NextResponse.json(
          { error: 'Nombre, provincia y ciudad son requeridos' },
          { status: 400 }
        );
      }

      // Verificar que el hospital existe
      const existingHospital = await prisma.hospitals.findUnique({
        where: { id: hospitalId }
      });

      if (!existingHospital) {
        return NextResponse.json(
          { error: 'Hospital no encontrado' },
          { status: 404 }
        );
      }

      // Actualizar el hospital
      const updatedHospital = await prisma.hospitals.update({
        where: { id: hospitalId },
        data: {
          name: body.name,
          province: body.province,
          city: body.city,
          status: body.status || 'pending',
          lasos_participation: body.participated_lasos || false,
          updated_at: new Date()
        }
      });

      // Mapear los datos para el frontend
      const mappedHospital = {
        ...updatedHospital,
        participated_lasos: updatedHospital.lasos_participation
      };

      return NextResponse.json({
        message: 'Hospital actualizado exitosamente',
        hospital: mappedHospital
      });

    } catch (error) {
      console.error('Error updating hospital:', error);
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  })(request);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(async (req: NextRequest, context: AuthContext) => {
    try {
      const { id: hospitalId } = await params;
      const { searchParams } = new URL(req.url);
      const deleteCoordinators = searchParams.get('deleteCoordinators') === 'true';

      // Usar el servicio de cascada para analizar las acciones necesarias
      const cascadeResult = await CascadeService.deleteHospitalWithCascade(hospitalId);

      if (!cascadeResult.success) {
        return NextResponse.json(
          { 
            error: cascadeResult.message,
            details: cascadeResult.warnings?.join(' ') || undefined
          },
          { status: 400 }
        );
      }

      // Si hay acciones de cascada, devolver información para confirmación
      if (cascadeResult.actions && cascadeResult.actions.length > 0) {
        return NextResponse.json({
          requiresConfirmation: true,
          message: cascadeResult.message,
          warnings: cascadeResult.warnings,
          actions: cascadeResult.actions,
          hospitalId: hospitalId
        });
      }

      // Si no hay acciones de cascada, proceder con la eliminación
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
        message: deleteResult.message,
        actions: deleteResult.actions
      });

    } catch (error) {
      console.error('Error al eliminar hospital:', error);
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  })(request);
}