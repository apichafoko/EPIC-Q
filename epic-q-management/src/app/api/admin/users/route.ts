import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, AuthContext } from '@/lib/auth/middleware';
import { prisma } from '@/lib/database';
import bcrypt from 'bcryptjs';
import { createUserSchema } from '@/lib/validations/auth';
import { apiRateLimiter, getClientIdentifier } from '@/lib/security/rate-limit';
import { emailService } from '@/lib/notifications/email-service';
import { InternalNotificationService } from '@/lib/notifications/internal-notification-service';

export const GET = withAdminAuth(async (request: NextRequest, context: AuthContext) => {
  try {
    // Obtener usuarios
    const users = await prisma.users.findMany({
      include: {
        hospitals: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    const formattedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      hospital_id: user.hospitalId,
      hospital_name: user.hospitals?.name,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      created_at: user.created_at,
    }));

    return NextResponse.json({ users: formattedUsers });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch users',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});

export const POST = withAdminAuth(async (request: NextRequest, context: AuthContext) => {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimitResult = apiRateLimiter.isAllowed(clientId, 'api');
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = createUserSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Datos de entrada inválidos',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { name, email, role, hospital_id, hospital_name, sendInvitation } = validationResult.data;

    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con este email' },
        { status: 400 }
      );
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    // Generate reset token for invitation
    const resetToken = Math.random().toString(36).slice(-32);
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    let finalHospitalId = null;

    // Handle hospital assignment for coordinators
    if (role === 'coordinator') {
      if (hospital_id) {
        // Use existing hospital
        finalHospitalId = hospital_id;
      } else if (hospital_name) {
        // Create new hospital
        const newHospital = await prisma.hospitals.create({
          data: {
            id: `hospital-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: hospital_name.trim(),
            province: 'Por definir', // Default values that coordinator will update
            city: 'Por definir',
            status: 'pending',
            lasos_participation: false,
          },
        });
        finalHospitalId = newHospital.id;
      }
    }

    // Create user
    const user = await prisma.users.create({
      data: {
        id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name,
        email,
        password: hashedPassword,
        role: role as 'admin' | 'coordinator',
        hospitalId: finalHospitalId,
        resetToken,
        resetTokenExpiry,
        isActive: true,
        isTemporaryPassword: true, // Mark as temporary password
      },
    });

    // Get hospital name for emails and notifications
    let hospitalName = 'Sistema EPIC-Q';
    if (role === 'coordinator' && finalHospitalId) {
      const hospital = await prisma.hospitals.findUnique({
        where: { id: finalHospitalId },
        select: { name: true }
      });
      if (hospital) {
        hospitalName = hospital.name;
      }
    }

    // Send welcome email if requested
    if (sendInvitation) {
      try {
        await emailService.sendWelcomeEmail(
          email,
          name || 'Usuario',
          role === 'admin' ? 'Administrador' : 'Coordinador',
          hospitalName,
          tempPassword
        );
        console.log(`Welcome email sent to ${email}`);
      } catch (error) {
        console.error('Failed to send welcome email:', error);
        // Don't fail the user creation if email fails
      }
    }

    // Send internal welcome notification for coordinators
    if (role === 'coordinator') {
      try {
        await InternalNotificationService.sendWelcomeNotification(
          user.id,
          name || 'Usuario',
          hospitalName
        );
        console.log(`Welcome notification sent to coordinator ${user.id}`);
      } catch (error) {
        console.error('Failed to send welcome notification:', error);
        // Don't fail the user creation if notification fails
      }
    }

    return NextResponse.json({ 
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        hospital_id: user.hospitalId,
        isActive: user.isActive,
      },
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('Failed to create user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
});
