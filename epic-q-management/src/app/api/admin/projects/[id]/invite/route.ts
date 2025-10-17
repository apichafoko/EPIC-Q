import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, AuthContext } from '@/lib/auth/middleware';
import { prisma } from '@/lib/database';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { projectInvitationService } from '@/lib/notifications/project-invitation-service';

const inviteCoordinatorSchema = z.object({
  email: z.string()
    .email('Email inválido')
    .min(1, 'El email es requerido')
    .max(255, 'El email es demasiado largo'),
  name: z.string()
    .min(1, 'El nombre es requerido')
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(255, 'El nombre es demasiado largo')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras y espacios'),
  phone: z.string()
    .optional()
    .refine((val) => !val || /^[\d\s\-\+\(\)]+$/.test(val), 'Formato de teléfono inválido'),
  hospital_id: z.string().uuid('ID de hospital inválido'),
  required_periods: z.number().int().min(1, 'Debe tener al menos 1 período').max(10, 'No puede tener más de 10 períodos').default(2),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(async (req: NextRequest, context: AuthContext) => {
    try {
      const { id: projectId } = await params;
    const body = await request.json();
    
    // Validar datos
    const validatedData = inviteCoordinatorSchema.parse(body);
    
    // Verificar que el proyecto existe
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que el hospital existe
    const hospital = await prisma.hospital.findUnique({
      where: { id: validatedData.hospital_id }
    });

    if (!hospital) {
      return NextResponse.json(
        { error: 'Hospital no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si el hospital ya está en el proyecto
    const existingProjectHospital = await prisma.projectHospital.findFirst({
      where: {
        project_id: projectId,
        hospital_id: validatedData.hospital_id
      }
    });

    if (existingProjectHospital) {
      return NextResponse.json(
        { error: 'Este hospital ya está participando en el proyecto' },
        { status: 400 }
      );
    }

    // Buscar o crear el usuario
    let user = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (!user) {
      // Crear nuevo usuario
      user = await prisma.user.create({
        data: {
          email: validatedData.email,
          name: validatedData.name,
          role: 'coordinator',
          isActive: true,
          isTemporaryPassword: true,
          preferredLanguage: 'es'
        }
      });

      // Si se proporcionó teléfono, crear contacto
      if (validatedData.phone) {
        await prisma.contact.create({
          data: {
            hospital_id: validatedData.hospital_id,
            role: 'coordinator',
            name: validatedData.name,
            email: validatedData.email,
            phone: validatedData.phone,
            is_primary: true
          }
        });
      }
    } else {
      // Verificar que no sea admin
      if (user.role === 'admin') {
        return NextResponse.json(
          { error: 'No se puede invitar a un administrador como coordinador' },
          { status: 400 }
        );
      }
    }

    // Verificar si el usuario ya está en el proyecto con este hospital
    const existingProjectCoordinator = await prisma.projectCoordinator.findFirst({
      where: {
        project_id: projectId,
        user_id: user.id,
        hospital_id: validatedData.hospital_id
      }
    });

    if (existingProjectCoordinator) {
      return NextResponse.json(
        { error: 'Este coordinador ya está asignado a este hospital en el proyecto' },
        { status: 400 }
      );
    }

    // Crear ProjectHospital si no existe
    let projectHospital = existingProjectHospital;
    if (!projectHospital) {
      projectHospital = await prisma.projectHospital.create({
        data: {
          project_id: projectId,
          hospital_id: validatedData.hospital_id,
          required_periods: validatedData.required_periods,
          status: 'active'
        }
      });
    }

    // Generar token de invitación
    const invitationToken = randomBytes(32).toString('hex');

    // Crear ProjectCoordinator
    const projectCoordinator = await prisma.projectCoordinator.create({
      data: {
        project_id: projectId,
        user_id: user.id,
        hospital_id: validatedData.hospital_id,
        role: 'coordinator',
        invitation_token: invitationToken,
        is_active: false // Se activará cuando acepte la invitación
      },
      include: {
        user: true,
        hospital: true,
        project: true
      }
    });

    // Enviar email de invitación
    const emailSent = await projectInvitationService.sendProjectInvitation({
      projectName: project.name,
      hospitalName: hospital.name,
      coordinatorName: validatedData.name,
      coordinatorEmail: validatedData.email,
      invitationToken,
      requiredPeriods: validatedData.required_periods,
      projectDescription: project.description,
      adminName: context.user.name
    });

    if (!emailSent) {
      console.warn(`Failed to send invitation email to ${validatedData.email}`);
    }

    return NextResponse.json({
      success: true,
      projectCoordinator,
      emailSent,
      message: emailSent ? 'Invitación enviada exitosamente' : 'Invitación creada pero el email no pudo ser enviado'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

      console.error('Error inviting coordinator:', error);
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  })(request, { params });
}
