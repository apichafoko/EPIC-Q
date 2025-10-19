import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

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
    const user = await prisma.users.findUnique({
      where: { id: decoded.userId },
      include: { hospital: true }
    });

    if (!user || !user.isActive || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Permisos insuficientes' },
        { status: 403 }
      );
    }

    // Obtener templates
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
    console.error('Error getting email templates:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
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
    const user = await prisma.users.findUnique({
      where: { id: decoded.userId },
      include: { hospital: true }
    });

    if (!user || !user.isActive || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Permisos insuficientes' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, subject, body: templateBody, variables, category } = body;

    // Validar campos requeridos
    if (!name || !subject || !templateBody || !category) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
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
        subject,
        body: templateBody,
        variables: variables || {},
        category,
        is_active: true,
        usage_count: 0
      }
    });

    return NextResponse.json({
      success: true,
      template
    });

  } catch (error) {
    console.error('Error creating email template:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
