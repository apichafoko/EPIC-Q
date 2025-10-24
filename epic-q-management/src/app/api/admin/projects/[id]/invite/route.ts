import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, AuthContext } from '@/lib/auth/simple-middleware';
import { prisma } from '@/lib/database';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { projectInvitationService } from '@/lib/notifications/project-invitation-service';
import { emailService } from '@/lib/notifications/email-service';

const inviteCoordinatorSchema = z.object({
  email: z.string()
    .email('Email inválido')
    .min(1, 'El email es requerido')
    .max(255, 'El email es demasiado largo'),
  name: z.string()
    .min(1, 'El nombre completo es requerido')
    .min(2, 'El nombre completo debe tener al menos 2 caracteres')
    .max(255, 'El nombre completo es demasiado largo')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras y espacios'),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  phone: z.string()
    .optional()
    .refine((val) => !val || /^[\d\s\-\+\(\)]+$/.test(val), 'Formato de teléfono inválido'),
  hospital_id: z.string().min(1, 'ID de hospital requerido'),
  required_periods: z.coerce.number().int().min(1, 'Debe tener al menos 1 período').max(10, 'No puede tener más de 10 períodos').default(2),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(async (req: NextRequest, context: AuthContext) => {
    try {
      const { id: projectId } = await params;
      const body = await req.json();
      
      console.log('Received invitation data:', body);
      console.log('Data types:', {
        email: typeof body.email,
        name: typeof body.name,
        hospital_id: typeof body.hospital_id,
        required_periods: typeof body.required_periods
      });
      
      // Validar datos
      const validatedData = inviteCoordinatorSchema.parse(body);
      console.log('Validated data:', validatedData);
    
    // Verificar que el proyecto existe
    const project = await prisma.projects.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que el hospital existe
    const hospital = await prisma.hospitals.findUnique({
      where: { id: validatedData.hospital_id }
    });

    if (!hospital) {
      return NextResponse.json(
        { error: 'Hospital no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si el hospital ya está en el proyecto
    const existingProjectHospital = await prisma.project_hospitals.findFirst({
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
    let user = await prisma.users.findUnique({
      where: { email: validatedData.email }
    });

    let tempPassword = null;
    
    if (!user) {
      // Generar contraseña temporal
      tempPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(tempPassword, 12);
      
      // Crear nuevo usuario
      user = await prisma.users.create({
        data: {
          id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          email: validatedData.email,
          name: validatedData.name,
          role: 'coordinator',
          isActive: true,
          isTemporaryPassword: true,
          preferredLanguage: 'es',
          password: hashedPassword,
          created_at: new Date(),
          updated_at: new Date()
        }
      });

      // Si se proporcionó teléfono, crear contacto
      if (validatedData.phone) {
        await prisma.hospital_contacts.create({
          data: {
            id: `contact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            hospital_id: validatedData.hospital_id,
            role: 'coordinator',
            name: validatedData.name,
            email: validatedData.email,
            phone: validatedData.phone,
            is_primary: true,
            created_at: new Date(),
            updated_at: new Date()
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
    const existingProjectCoordinator = await prisma.project_coordinators.findFirst({
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

    // Generar token de invitación
    const invitationToken = randomBytes(32).toString('hex');

    // Si es un usuario existente sin contraseña temporal, generar una nueva
    if (!tempPassword && user.isTemporaryPassword) {
      tempPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(tempPassword, 12);
      
      await prisma.users.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          isTemporaryPassword: true
        }
      });
    }

    // Enviar email con credenciales ANTES de crear los registros
    console.log('Sending invitation email...');
    const emailSent = await emailService.sendInvitationEmail(
      validatedData.email,
      invitationToken,
      hospital.name,
      validatedData.name,
      'Coordinador',
      tempPassword || 'Ya tienes una cuenta activa'
    );
    console.log('Email sent result:', emailSent);

    if (!emailSent) {
      console.error(`Failed to send invitation email to ${validatedData.email}`);
      return NextResponse.json(
        { error: 'No se pudo enviar el email de invitación. Por favor, verifica la configuración de email.' },
        { status: 500 }
      );
    }

    // Solo si el email se envió correctamente, crear los registros en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // Crear ProjectHospital si no existe
      let projectHospital: any = existingProjectHospital;
      if (!projectHospital) {
        projectHospital = await tx.project_hospitals.create({
          data: {
            id: `ph-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            project_id: projectId,
            hospital_id: validatedData.hospital_id,
            status: 'active',
            created_at: new Date(),
            updated_at: new Date()
          }
        });
      }

      // Crear ProjectCoordinator
      const projectCoordinator = await tx.project_coordinators.create({
        data: {
          id: `pc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          project_id: projectId,
          user_id: user.id,
          hospital_id: validatedData.hospital_id,
          is_active: true, // Coordinador activo desde el inicio
          created_at: new Date(),
          updated_at: new Date()
        },
        include: {
          users: true,
          hospitals: true,
          projects: true
        }
      });

      return { projectHospital, projectCoordinator };
    });

    return NextResponse.json({
      success: true,
      projectCoordinator: result.projectCoordinator,
      emailSent: true,
      message: 'Invitación enviada exitosamente'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.issues);
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error inviting coordinator:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
  })(request);
}
