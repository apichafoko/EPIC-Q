import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { withAdminAuth } from '@/lib/auth/middleware';
import { z } from 'zod';

const updateProjectHospitalSchema = z.object({
  required_periods: z.number().min(1),
  redcap_id: z.string().optional(),
  status: z.enum([
    'initial_contact',
    'pending_evaluation', 
    'ethics_approval_process',
    'redcap_setup',
    'active_recruiting',
    'completed',
    'inactive'
  ])
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; hospitalId: string }> }
) {
  return withAdminAuth(async (req, context) => {
    try {
      const { id: projectId, hospitalId } = await params;
      const body = await req.json();

      // Validate input
      const validatedData = updateProjectHospitalSchema.parse(body);

      // Check if project exists
      const project = await prisma.projects.findUnique({
        where: { id: projectId }
      });

      if (!project) {
        return NextResponse.json(
          { error: 'Proyecto no encontrado' },
          { status: 404 }
        );
      }

      // Check if hospital exists
      const hospital = await prisma.hospitals.findUnique({
        where: { id: hospitalId }
      });

      if (!hospital) {
        return NextResponse.json(
          { error: 'Hospital no encontrado' },
          { status: 404 }
        );
      }

      // Check if project-hospital relationship exists
      const existingRelation = await prisma.project_hospitals.findFirst({
        where: {
          project_id: projectId,
          hospital_id: hospitalId
        }
      });

      if (!existingRelation) {
        return NextResponse.json(
          { error: 'Relación hospital-proyecto no encontrada' },
          { status: 404 }
        );
      }

      // Update the project-hospital relationship
      const updatedRelation = await prisma.project_hospitals.update({
        where: { id: existingRelation.id },
        data: {
          required_periods: validatedData.required_periods,
          redcap_id: validatedData.redcap_id || null,
          status: validatedData.status,
          updated_at: new Date()
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              status: true,
              start_date: true,
              end_date: true
            }
          },
          progress: true
        }
      });

      return NextResponse.json({
        success: true,
        data: updatedRelation
      });

    } catch (error) {
      console.error('Error updating project-hospital relationship:', error);
      
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Datos inválidos', details: error.errors },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  })(request, { params });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; hospitalId: string }> }
) {
  return withAdminAuth(async (req, context) => {
    try {
      const { id: projectId, hospitalId } = await params;

      // Check if project exists
      const project = await prisma.projects.findUnique({
        where: { id: projectId }
      });

      if (!project) {
        return NextResponse.json(
          { error: 'Proyecto no encontrado' },
          { status: 404 }
        );
      }

      // Check if hospital exists
      const hospital = await prisma.hospitals.findUnique({
        where: { id: hospitalId }
      });

      if (!hospital) {
        return NextResponse.json(
          { error: 'Hospital no encontrado' },
          { status: 404 }
        );
      }

      // Check if project-hospital relationship exists
      const existingRelation = await prisma.project_hospitals.findFirst({
        where: {
          project_id: projectId,
          hospital_id: hospitalId
        }
      });

      if (!existingRelation) {
        return NextResponse.json(
          { error: 'Relación hospital-proyecto no encontrada' },
          { status: 404 }
        );
      }

      // Delete the project-hospital relationship
      await prisma.project_hospitals.delete({
        where: { id: existingRelation.id }
      });

      return NextResponse.json({
        success: true,
        message: `Hospital "${hospital.name}" eliminado del proyecto exitosamente`
      });

    } catch (error) {
      console.error('Error deleting project-hospital relationship:', error);
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  })(request, { params });
}