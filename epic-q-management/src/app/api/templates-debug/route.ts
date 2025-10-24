import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    console.log('Templates Debug API GET called');
    
    // Verificar autenticación manualmente
    const token = request.cookies.get('auth-token')?.value;
    console.log('Token found:', !!token);
    
    if (!token) {
      console.log('No token found, returning 401');
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar token
    const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-key';
    console.log('JWT_SECRET exists:', !!JWT_SECRET);
    
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
      console.log('Token decoded successfully:', !!decoded, 'userId:', typeof decoded === 'string' ? decoded : decoded.userId);
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError);
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    // Verificar que el usuario existe y es admin
    console.log('Looking for user with ID:', typeof decoded === 'string' ? decoded : decoded.userId);
    const user = await prisma.users.findUnique({
      where: { id: typeof decoded === 'string' ? decoded : decoded.userId },
      include: { hospitals: true }
    });
    console.log('User found:', !!user, 'role:', user?.role, 'isActive:', user?.isActive);

    if (!user || !user.isActive || user.role !== 'admin') {
      console.log('User validation failed');
      return NextResponse.json(
        { error: 'Permisos insuficientes' },
        { status: 403 }
      );
    }

    // Obtener templates
    console.log('Fetching templates from database...');
    const templates = await prisma.communication_templates.findMany({
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    });
    console.log('Templates found:', templates.length);

    return NextResponse.json({
      success: true,
      templates,
      debug: {
        userId: typeof decoded === 'string' ? decoded : decoded.userId,
        userRole: user.role,
        userActive: user.isActive,
        templateCount: templates.length
      }
    });

  } catch (error) {
    console.error('Error getting communication templates:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
