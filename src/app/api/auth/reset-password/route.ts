import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/database';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { emailService } from '../../../../lib/notifications/email-service';
import { passwordResetRateLimiter, getClientIdentifier } from '../../../../lib/security/rate-limit';

const getAppBaseUrl = () => {
  return (
    process.env.PWA_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    'http://localhost:3000'
  ).replace(/\/$/, '');
};

export async function POST(request: NextRequest) {
  try {
    const { email, locale = 'es' } = await request.json();

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Email válido es requerido' },
        { status: 400 }
      );
    }

    // Rate limiting por email
    const rateLimitResult = passwordResetRateLimiter.isAllowed(email.toLowerCase(), 'passwordReset');
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: 'Has excedido el límite de solicitudes. Por favor intenta más tarde.',
          retryAfter: rateLimitResult.retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter?.toString() || '3600',
            'X-RateLimit-Limit': '3',
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          },
        }
      );
    }

    // Find user by email
    const user = await prisma.users.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
      },
    });

    // Don't reveal if user exists or not for security
    // Always return success message even if user doesn't exist
    if (!user || !user.isActive) {
      return NextResponse.json(
        {
          success: true,
          message: 'Si existe una cuenta con ese email, se ha enviado un enlace para restablecer la contraseña.',
        },
        { status: 200 }
      );
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Update user with reset token
    await prisma.users.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // Build reset URL with locale
    const baseUrl = getAppBaseUrl();
    const resetUrl = `${baseUrl}/${locale}/auth/reset-password?token=${resetToken}`;

    // Send reset email using EmailService
    try {
      await emailService.sendPasswordResetEmail(
        user.email,
        resetToken,
        user.name || undefined,
        locale
      );
      
      console.log(`[Password Reset] Email enviado a ${user.email} con token válido por 1 hora`);
    } catch (emailError) {
      console.error('[Password Reset] Error al enviar email:', emailError);
      // No fallar la solicitud si el email falla, pero loguear el error
      // El usuario ya tiene el token en la BD, puede intentar de nuevo más tarde
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Si existe una cuenta con ese email, se ha enviado un enlace para restablecer la contraseña.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Password Reset] Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error interno del servidor. Por favor intenta más tarde.',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, valid: false, message: 'Token es requerido' },
        { status: 400 }
      );
    }

    // Find user with valid reset token
    const user = await prisma.users.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(),
        },
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          message: 'Token inválido o expirado',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      valid: true,
      user: {
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('[Password Reset] Error validando token:', error);
    return NextResponse.json(
      {
        success: false,
        valid: false,
        message: 'Error al validar token',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { token, password, confirmPassword } = await request.json();

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Token es requerido' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Contraseña es requerida' },
        { status: 400 }
      );
    }

    if (!confirmPassword || typeof confirmPassword !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Confirmación de contraseña es requerida' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, message: 'Las contraseñas no coinciden' },
        { status: 400 }
      );
    }

    // Validate password strength
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!minLength || !hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      return NextResponse.json(
        {
          success: false,
          message: 'La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas, números y caracteres especiales',
        },
        { status: 400 }
      );
    }

    // Find user with valid reset token
    const user = await prisma.users.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(),
        },
        isActive: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'Token inválido o expirado. Por favor solicita un nuevo enlace de recuperación.',
        },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user password and clear reset token
    await prisma.users.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        isTemporaryPassword: false,
        updated_at: new Date(),
      },
    });

    console.log(`[Password Reset] Contraseña actualizada exitosamente para usuario ${user.email}`);

    return NextResponse.json(
      {
        success: true,
        message: 'Contraseña restablecida exitosamente',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Password Reset] Error al restablecer contraseña:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error interno del servidor. Por favor intenta más tarde.',
      },
      { status: 500 }
    );
  }
}
