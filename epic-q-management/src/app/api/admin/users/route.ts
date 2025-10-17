import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, AuthContext } from '@/lib/auth/middleware';
import { prisma } from '@/lib/database';
import bcrypt from 'bcryptjs';
import { createUserSchema } from '@/lib/validations/auth';
import { apiRateLimiter, getClientIdentifier } from '@/lib/security/rate-limit';
import { emailService } from '@/lib/notifications/email-service';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación manualmente
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar token
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-key';
    
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError);
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    // Verificar que el usuario existe y es admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { hospital: true }
    });

    if (!user || !user.isActive || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Permisos insuficientes' },
        { status: 403 }
      );
    }

    // Obtener usuarios
    const users = await prisma.user.findMany({
      include: {
        hospital: {
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
      hospital_id: user.hospital_id,
      hospital_name: user.hospital?.name,
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
}

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
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { name, email, role, hospital_id, sendInvitation } = validationResult.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
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

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role as 'admin' | 'coordinator',
        hospital_id: role === 'coordinator' ? hospital_id : null,
        resetToken,
        resetTokenExpiry,
        isActive: true,
      },
    });

    // Send invitation email if requested
    if (sendInvitation) {
      try {
        // Get hospital name for the invitation email
        let hospitalName = 'Sistema EPIC-Q';
        if (role === 'coordinator' && hospital_id) {
          const hospital = await prisma.hospital.findUnique({
            where: { id: hospital_id },
            select: { name: true }
          });
          if (hospital) {
            hospitalName = hospital.name;
          }
        }

        await emailService.sendInvitationEmail(email, resetToken, hospitalName);
        console.log(`Invitation email sent to ${email}`);
      } catch (error) {
        console.error('Failed to send invitation email:', error);
        // Don't fail the user creation if email fails
      }
    }

    return NextResponse.json({ 
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        hospital_id: user.hospital_id,
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
