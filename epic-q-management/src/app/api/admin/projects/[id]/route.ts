import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, AuthContext } from '@/lib/auth/middleware';
import { prisma } from '@/lib/database';
import { z } from 'zod';

const updateProjectSchema = z.object({
  name: z.string().min(1, 'El nombre del proyecto es requerido').max(255).optional(),
  description: z.string().optional(),
  brief_description: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  status: z.enum(['active', 'completed', 'archived']).optional(),
  required_periods: z.number().int().min(1).max(10).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(async (req: NextRequest, context: AuthContext) => {
    try {
      const { id } = await params;

    const rawProject = await prisma.projects.findUnique({
      where: { id },
      include: {
        project_hospitals: {
          include: {
            hospitals: {
              include: {
                hospital_details: true,
                hospital_contacts: true
              }
            },
            hospital_progress: true,
            recruitment_periods: {
              orderBy: { period_number: 'asc' }
            },
            _count: {
              select: {
                recruitment_periods: true
              }
            }
          }
        },
        project_coordinators: {
          include: {
            users: true,
            hospitals: true
          }
        },
        _count: {
          select: {
            project_hospitals: true,
            project_coordinators: true,
          }
        }
      }
    });

    if (!rawProject) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      );
    }

    // Transformar relaciones a la forma esperada por el frontend
    // Aggregations for Overview summary
    const hospitals = rawProject.project_hospitals || [];
    const coordinators = rawProject.project_coordinators || [];

    const summary = (() => {
      let ethicsPending = 0, ethicsSubmitted = 0, ethicsApproved = 0;
      let formPending = 0, formPartial = 0, formComplete = 0;
      const byProvinceMap: Record<string, { 
        province: string; 
        hospitals: number; 
        ethicsApproved: number; 
        formComplete: number;
        totalCasesLoaded: number;
        activeLoading: number;
        completedPeriods: number;
      }> = {};

      const today = new Date();
      const in60 = new Date();
      in60.setDate(today.getDate() + 60);

      const upcomingPeriods: Array<{ id: string; hospitalId: string; hospitalName: string; startDate: Date; endDate: Date | null; periodNumber: number; }>
        = [];

      hospitals.forEach((ph: any) => {
        const prog = Array.isArray(ph.hospital_progress) ? ph.hospital_progress[0] : ph.hospital_progress;
        const pct = typeof prog?.progress_percentage === 'number' ? prog.progress_percentage : null;
        if (prog?.ethics_approved) ethicsApproved++; else if (prog?.ethics_submitted) ethicsSubmitted++; else ethicsPending++;
        if (pct === null || pct === 0) formPending++; else if (pct > 0 && pct < 100) formPartial++; else if (pct >= 100) formComplete++;

        const province = ph.hospitals?.province || 'Sin provincia';
        if (!byProvinceMap[province]) {
          byProvinceMap[province] = { 
            province, 
            hospitals: 0, 
            ethicsApproved: 0, 
            formComplete: 0,
            totalCasesLoaded: 0,
            activeLoading: 0,
            completedPeriods: 0
          };
        }
        byProvinceMap[province].hospitals += 1;
        if (prog?.ethics_approved) byProvinceMap[province].ethicsApproved += 1;
        if (pct && pct >= 100) byProvinceMap[province].formComplete += 1;
        
        // Simular estadísticas de carga de casos (por ahora con datos mock)
        // TODO: Implementar consulta real a case_load_statistics
        const mockCasesLoaded = Math.floor(Math.random() * 100);
        const mockActiveLoading = Math.random() > 0.7 ? 1 : 0;
        const mockCompletedPeriods = Math.floor(Math.random() * 3);
        
        byProvinceMap[province].totalCasesLoaded += mockCasesLoaded;
        byProvinceMap[province].activeLoading += mockActiveLoading;
        byProvinceMap[province].completedPeriods += mockCompletedPeriods;

        // upcoming periods within 60 days
        const periods: any[] = ph.recruitment_periods || [];
        periods.forEach((p: any) => {
          const sd = p.start_date ? new Date(p.start_date) : null;
          if (sd && sd >= today && sd <= in60) {
            upcomingPeriods.push({
              id: p.id,
              hospitalId: ph.hospitals?.id || ph.hospital_id,
              hospitalName: ph.hospitals?.name || 'Hospital',
              startDate: sd,
              endDate: p.end_date ? new Date(p.end_date) : null,
              periodNumber: p.period_number
            });
          }
        });
      });

      const invitationPending = coordinators.filter((c: any) => !c.accepted_at).length;
      const invitationAccepted = coordinators.filter((c: any) => !!c.accepted_at).length;

      return {
        hospitalsTotal: hospitals.length,
        coordinatorsTotal: coordinators.length,
        invitation: { pending: invitationPending, accepted: invitationAccepted },
        ethics: { pending: ethicsPending, submitted: ethicsSubmitted, approved: ethicsApproved },
        form: { pending: formPending, partial: formPartial, complete: formComplete },
        byProvince: Object.values(byProvinceMap),
        upcomingPeriods: upcomingPeriods.sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
      };
    })();

    const project = {
      ...rawProject,
      project_hospitals: rawProject.project_hospitals.map((ph: any) => ({
        ...ph,
        hospital: ph.hospitals, // alias esperado por el frontend
      })),
      project_coordinators: rawProject.project_coordinators.map((pc: any) => ({
        ...pc,
        user: pc.users, // alias esperado por el frontend
        hospital: pc.hospitals,
      })),
      summary,
    };

      return NextResponse.json({
        success: true,
        project
      });

    } catch (error) {
      console.error('Error fetching project:', error);
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  })(request);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(async (req: NextRequest, context: AuthContext) => {
    try {
      const { id } = await params;
    const body = await request.json();
    
    // Validar datos
    const validatedData = updateProjectSchema.parse(body);
    
    // Verificar que el proyecto existe
    const existingProject = await prisma.projects.findUnique({
      where: { id }
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      );
    }

    // Convertir fechas si están presentes
    const updateData: any = {};
    
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.brief_description !== undefined) updateData.brief_description = validatedData.brief_description;
    if (validatedData.status !== undefined) updateData.status = validatedData.status;
    if (validatedData.required_periods !== undefined) updateData.required_periods = validatedData.required_periods;

    if (validatedData.start_date !== undefined) {
      updateData.start_date = validatedData.start_date ? new Date(validatedData.start_date) : null;
    }

    if (validatedData.end_date !== undefined) {
      updateData.end_date = validatedData.end_date ? new Date(validatedData.end_date) : null;
    }

    // Actualizar proyecto
    const updatedProject = await prisma.projects.update({
      where: { id },
      data: updateData,
      include: {
        project_hospitals: {
          include: {
            hospitals: {
              include: {
                hospital_details: true,
                hospital_contacts: true,
                hospital_progress: true,
              }
            },
            recruitment_periods: {
              orderBy: { period_number: 'asc' }
            },
            _count: {
              select: {
                recruitment_periods: true
              }
            }
          }
        },
        project_coordinators: {
          include: {
            users: true,
            hospitals: true
          }
        },
        _count: {
          select: {
            project_hospitals: true,
            project_coordinators: true,
          }
        }
      }
    });

    // Transform project_hospitals to include hospital directly
    const transformedProjectHospitals = updatedProject.project_hospitals.map(ph => ({
      ...ph,
      hospital: ph.hospitals, // Flatten the hospital object
      hospital_progress: ph.hospitals.hospital_progress.find(hp => hp.project_id === updatedProject.id) || null, // Get relevant progress
      recruitment_periods: ph.recruitment_periods,
    }));

    // Transform project_coordinators to include user and hospital directly
    const transformedProjectCoordinators = updatedProject.project_coordinators.map(pc => ({
      ...pc,
      user: pc.users, // Flatten the user object
      hospital: pc.hospitals, // Flatten the hospital object
    }));

    // Calculate summary statistics
    const summary = {
      hospitalsTotal: transformedProjectHospitals.length,
      coordinatorsTotal: transformedProjectCoordinators.length,
      invitation: {
        pending: transformedProjectCoordinators.filter(pc => !pc.accepted_at).length,
        accepted: transformedProjectCoordinators.filter(pc => pc.accepted_at).length,
      },
      ethics: {
        pending: transformedProjectHospitals.filter(ph => !ph.hospital_progress?.ethics_submitted).length,
        submitted: transformedProjectHospitals.filter(ph => ph.hospital_progress?.ethics_submitted && !ph.hospital_progress?.ethics_approved).length,
        approved: transformedProjectHospitals.filter(ph => ph.hospital_progress?.ethics_approved).length,
      },
      form: {
        pending: transformedProjectHospitals.filter(ph => ph.hospital_progress?.progress_percentage === null || ph.hospital_progress?.progress_percentage === 0).length,
        partial: transformedProjectHospitals.filter(ph => typeof ph.hospital_progress?.progress_percentage === 'number' && ph.hospital_progress.progress_percentage > 0 && ph.hospital_progress.progress_percentage < 100).length,
        complete: transformedProjectHospitals.filter(ph => ph.hospital_progress?.progress_percentage === 100).length,
      },
      byProvince: transformedProjectHospitals.reduce((acc, ph) => {
        const province = ph.hospital?.province || 'Desconocida';
        if (!acc[province]) {
          acc[province] = {
            totalHospitals: 0,
            ethicsApproved: 0,
            formComplete: 0,
            totalCasesLoaded: 0,
            activeLoading: 0,
            completedPeriods: 0
          };
        }
        acc[province].totalHospitals++;
        if (ph.hospital_progress?.ethics_approved) acc[province].ethicsApproved++;
        if (ph.hospital_progress?.progress_percentage === 100) acc[province].formComplete++;
        
        // Mock data for case load statistics
        const mockCasesLoaded = Math.floor(Math.random() * 100);
        const mockActiveLoading = Math.random() > 0.7 ? 1 : 0;
        const mockCompletedPeriods = Math.floor(Math.random() * 3);
        
        acc[province].totalCasesLoaded += mockCasesLoaded;
        acc[province].activeLoading += mockActiveLoading;
        acc[province].completedPeriods += mockCompletedPeriods;

        return acc;
      }, {} as Record<string, { totalHospitals: number; ethicsApproved: number; formComplete: number; totalCasesLoaded: number; activeLoading: number; completedPeriods: number }>),
      upcomingPeriods: transformedProjectHospitals.flatMap(ph =>
        ph.recruitment_periods
          .filter(rp => {
            const today = new Date();
            const endDate = new Date(rp.end_date);
            const diffTime = Math.abs(endDate.getTime() - today.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return endDate > today && diffDays <= 60; // Periods ending within 60 days
          })
          .map(rp => ({
            hospitalName: ph.hospital?.name,
            periodNumber: rp.period_number,
            startDate: rp.start_date,
            endDate: rp.end_date,
          }))
      ).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()),
    };

    return NextResponse.json({
      success: true,
      project: {
        id: updatedProject.id,
        name: updatedProject.name,
        description: updatedProject.description,
        brief_description: updatedProject.brief_description,
        status: updatedProject.status,
        start_date: updatedProject.start_date,
        end_date: updatedProject.end_date,
        required_periods: updatedProject.required_periods,
        created_at: updatedProject.created_at,
        updated_at: updatedProject.updated_at,
        project_hospitals: transformedProjectHospitals,
        project_coordinators: transformedProjectCoordinators,
        summary, // Add the summary to the project object
        _count: updatedProject._count
      },
      message: 'Proyecto actualizado exitosamente'
    });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Datos inválidos', details: error.errors },
          { status: 400 }
        );
      }

      console.error('Error updating project:', error);
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
      const { id } = await params;

    // Verificar que el proyecto existe
    const existingProject = await prisma.projects.findUnique({
      where: { id }
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que el proyecto esté desactivado (inactive)
    if (existingProject.status === 'active') {
      return NextResponse.json(
        { error: 'El proyecto debe estar desactivado antes de ser eliminado' },
        { status: 400 }
      );
    }

    // Eliminar proyecto con cascada (elimina automáticamente project_hospitals, project_coordinators, etc.)
    await prisma.projects.delete({
      where: { id }
    });

      return NextResponse.json({
        success: true,
        message: 'Proyecto eliminado exitosamente'
      });

    } catch (error) {
      console.error('Error deleting project:', error);
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  })(request);
}
