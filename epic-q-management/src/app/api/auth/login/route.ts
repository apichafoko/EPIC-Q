import { NextRequest, NextResponse } from 'next/server';
import { SimpleAuthService } from '../../../../lib/auth/simple-auth-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    const result = await SimpleAuthService.login({ email, password });

    if (!result.success) {
      return NextResponse.json(result, { status: 401 });
    }

    // Crear respuesta con cookie HTTP-only para el token
    const response = NextResponse.json({
      success: true,
      user: result.user
    });

    // Configurar cookie HTTP-only para el token
    response.cookies.set('auth-token', result.token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 días
    });

    return response;
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}