import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { createUserSchema } from '@/lib/validations/auth';
import bcrypt from 'bcryptjs';

// GET - Obtener usuario por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        hospital: {
          select: { name: true }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        hospital_id: user.hospital_id,
        hospital_name: user.hospital?.name,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        created_at: user.created_at,
      }
    });
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return NextResponse.json(
      { error: 'Error al obtener el usuario' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar usuario
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar token
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-key';
    
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtError) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Verificar que el usuario existe y es admin
    const adminUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { hospital: true }
    });

    if (!adminUser || !adminUser.isActive || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, role, hospital_id, isActive } = body;

    // Validar datos
    if (!name || !email) {
      return NextResponse.json({ error: 'Nombre y email son requeridos' }, { status: 400 });
    }

    // Verificar si el email ya existe en otro usuario
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        id: { not: params.id }
      }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Ya existe un usuario con este email' }, { status: 400 });
    }

    // Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        name,
        email,
        role: role || 'coordinator',
        hospital_id: role === 'coordinator' ? hospital_id : null,
        isActive: isActive !== undefined ? isActive : true,
      },
      include: {
        hospital: {
          select: { name: true }
        }
      }
    });

    return NextResponse.json({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        hospital_id: updatedUser.hospital_id,
        hospital_name: updatedUser.hospital?.name,
        isActive: updatedUser.isActive,
        lastLogin: updatedUser.lastLogin,
        created_at: updatedUser.created_at,
      },
      message: 'Usuario actualizado exitosamente'
    });
  } catch (error) {
    console.error('Failed to update user:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el usuario' },
      { status: 500 }
    );
  }
}

// DELETE - Desactivar usuario
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar token
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-key';
    
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtError) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Verificar que el usuario existe y es admin
    const adminUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { hospital: true }
    });

    if (!adminUser || !adminUser.isActive || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    // No permitir desactivar el propio usuario
    if (params.id === decoded.userId) {
      return NextResponse.json({ error: 'No puedes desactivar tu propia cuenta' }, { status: 400 });
    }

    // Desactivar usuario
    await prisma.user.update({
      where: { id: params.id },
      data: { isActive: false }
    });

    return NextResponse.json({
      message: 'Usuario desactivado exitosamente'
    });
  } catch (error) {
    console.error('Failed to deactivate user:', error);
    return NextResponse.json(
      { error: 'Error al desactivar el usuario' },
      { status: 500 }
    );
  }
}
