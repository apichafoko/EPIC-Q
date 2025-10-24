import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, AuthContext } from '../../../../../lib/auth/middleware';
import { prisma } from '../../../../../lib/database';
import { emailService } from '../../../../../lib/notifications/email-service';
import { apiRateLimiter, getClientIdentifier } from '../../../../../lib/security/rate-limit';

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
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user information
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        hospitals: {
          select: { name: true }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Generate new reset token and temporary password
    const resetToken = Math.random().toString(36).slice(-32);
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const tempPassword = Math.random().toString(36).slice(-8); // Generar contraseña temporal
    
    // Hash the temporary password
    const bcrypt = require('bcryptjs');
    const hashedTempPassword = await bcrypt.hash(tempPassword, 12);

    // Update user with new token and temporary password
    await prisma.users.update({
      where: { id: userId },
      data: {
        resetToken,
        resetTokenExpiry,
        password: hashedTempPassword, // Guardar la contraseña temporal hasheada
      }
    });

    // Send invitation email
    try {
      const hospitalName = user.hospitals?.name || 'Sistema EPIC-Q';
      await emailService.sendInvitationEmail(
        user.email, 
        resetToken, 
        hospitalName, 
        user.name || 'Usuario', // Pasar el nombre del usuario
        user.role, // Pasar el rol del usuario
        tempPassword // Pasar la contraseña temporal (sin hashear)
      );
      
      return NextResponse.json({ 
        message: 'Invitación reenviada exitosamente',
        success: true
      });
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      return NextResponse.json(
        { error: 'Error al enviar el email, pero el token fue actualizado' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Failed to resend invitation:', error);
    return NextResponse.json(
      { error: 'Error al reenviar la invitación' },
      { status: 500 }
    );
  }
});
