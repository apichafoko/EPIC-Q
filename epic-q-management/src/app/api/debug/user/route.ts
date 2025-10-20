import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

// Inicializar Prisma directamente
const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    console.log('Debug user API called');
    console.log('Request URL:', request.url);
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));
    
    // Verificar autenticación manualmente
    const token = request.cookies.get('auth-token')?.value;
    console.log('Token found:', !!token);
    console.log('Token value:', token);
    
    if (!token) {
      return NextResponse.json({
        error: 'No token found',
        cookies: request.cookies.getAll()
      });
    }

    // Verificar token
    const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-key';
    
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
      console.log('Decoded token:', decoded);
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError);
      return NextResponse.json({
        error: 'Token inválido',
        jwtError: jwtError instanceof Error ? jwtError.message : 'Unknown error'
      });
    }

    // Verificar que el usuario existe
    const user = await prisma.users.findUnique({
      where: { id: decoded.userId },
      include: { hospitals: true }
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user?.id,
        name: user?.name,
        email: user?.email,
        role: user?.role,
        isActive: user?.isActive,
        createdAt: user?.created_at
      },
      token: {
        userId: decoded.userId,
        iat: decoded.iat,
        exp: decoded.exp
      }
    });

  } catch (error) {
    console.error('Error in debug user API:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
