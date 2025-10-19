import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

// Inicializar Prisma directamente
const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id: templateId } = await params;

    // Buscar template en la tabla unificada
    const template = await prisma.communication_templates.findUnique({
      where: { id: templateId }
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      template: template
    });

  } catch (error) {
    console.error('Error getting communication template:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: templateId } = await params;
    const body = await request.json();

    // Buscar template en la tabla unificada
    const existingTemplate = await prisma.communication_templates.findUnique({
      where: { id: templateId }
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Template no encontrado' },
        { status: 404 }
      );
    }

    // Si se está cambiando el nombre, verificar que no esté en uso
    if (body.name && body.name !== existingTemplate.name) {
      const nameExists = await prisma.communication_templates.findFirst({
        where: { 
          name: body.name,
          id: { not: templateId }
        }
      });

      if (nameExists) {
        return NextResponse.json(
          { error: 'Ya existe un template con este nombre' },
          { status: 400 }
        );
      }
    }

    // Actualizar template en la tabla unificada
    const updateData: any = {
      updated_at: new Date()
    };

    // Solo actualizar campos que estén presentes en el body
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.internal_subject !== undefined) updateData.internal_subject = body.internal_subject;
    if (body.internal_body !== undefined) updateData.internal_body = body.internal_body;
    if (body.email_subject !== undefined) updateData.email_subject = body.email_subject;
    if (body.email_body !== undefined) updateData.email_body = body.email_body;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.variables !== undefined) updateData.variables = body.variables;

    const updatedTemplate = await prisma.communication_templates.update({
      where: { id: templateId },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      template: updatedTemplate
    });

  } catch (error) {
    console.error('Error updating communication template:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: templateId } = await params;

    // Buscar template en la tabla unificada
    const existingTemplate = await prisma.communication_templates.findUnique({
      where: { id: templateId }
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Template no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar template
    await prisma.communication_templates.delete({
      where: { id: templateId }
    });

    return NextResponse.json({
      success: true,
      message: 'Template eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error deleting communication template:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
