import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

// Inicializar Prisma directamente
const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    console.log('Templates API GET called');
    console.log('Request URL:', request.url);
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));
    
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
    const user = await prisma.users.findUnique({
      where: { id: decoded.userId },
      include: { hospitals: true }
    });

    if (!user || !user.isActive || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Permisos insuficientes' },
        { status: 403 }
      );
    }

    // Obtener todos los templates de la tabla unificada
    const templates = await prisma.communication_templates.findMany({
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    });

    return NextResponse.json({
      success: true,
      templates
    });

  } catch (error) {
    console.error('Error getting communication templates:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    const user = await prisma.users.findUnique({
      where: { id: decoded.userId },
      include: { hospitals: true }
    });

    if (!user || !user.isActive || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Permisos insuficientes' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { 
      name, 
      description, 
      type, 
      internal_subject, 
      internal_body, 
      email_subject, 
      email_body, 
      variables, 
      category 
    } = body;

    // Validar campos requeridos
    if (!name || !type) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Validar que si es tipo 'both', ambos cuerpos deben estar presentes
    if (type === 'both' && (!internal_body || !email_body)) {
      return NextResponse.json(
        { error: 'Para tipo "ambas", se requieren tanto el cuerpo interno como el de email' },
        { status: 400 }
      );
    }

    // Validar que si es tipo 'internal', el cuerpo interno debe estar presente
    if (type === 'internal' && !internal_body) {
      return NextResponse.json(
        { error: 'Para tipo "interna", se requiere el cuerpo interno' },
        { status: 400 }
      );
    }

    // Validar que si es tipo 'email', el cuerpo de email debe estar presente
    if (type === 'email' && !email_body) {
      return NextResponse.json(
        { error: 'Para tipo "email", se requiere el cuerpo de email' },
        { status: 400 }
      );
    }

    // Verificar que el nombre no esté en uso
    const existingTemplate = await prisma.communication_templates.findFirst({
      where: { name }
    });

    if (existingTemplate) {
      return NextResponse.json(
        { error: 'Ya existe un template con este nombre' },
        { status: 400 }
      );
    }

    // Crear template
    const template = await prisma.communication_templates.create({
      data: {
        name,
        description,
        type,
        internal_subject,
        internal_body,
        email_subject,
        email_body,
        variables: variables || {},
        category: category || 'general',
        is_active: true,
        usage_count: 0
      }
    });

    return NextResponse.json({
      success: true,
      template
    });

  } catch (error) {
    console.error('Error creating communication template:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
