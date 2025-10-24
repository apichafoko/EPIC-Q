import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

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
    const adminUser = await prisma.users.findUnique({
      where: { id: decoded.userId },
      include: { hospitals: true }
    });

    if (!adminUser || !adminUser.isActive || adminUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Permisos insuficientes' },
        { status: 403 }
      );
    }

    const userId = (await params).id;

    // Verificar que el usuario a reactivar existe
    const userToReactivate = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        hospitals: true,
      }
    });

    if (!userToReactivate) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que el usuario esté inactivo
    if (userToReactivate.isActive) {
      return NextResponse.json(
        { error: 'El usuario ya está activo' },
        { status: 400 }
      );
    }

    // Reactivar usuario
    const reactivatedUser = await prisma.users.update({
      where: { id: userId },
      data: {
        isActive: true,
        updated_at: new Date()
      },
      include: {
        hospitals: true
      }
    });

    console.log(`Usuario ${reactivatedUser.email} reactivado por admin ${adminUser.email}`);

    return NextResponse.json({
      success: true,
      message: 'Usuario reactivado exitosamente',
      user: {
        id: reactivatedUser.id,
        email: reactivatedUser.email,
        name: reactivatedUser.name,
        role: reactivatedUser.role,
        hospital_id: reactivatedUser.hospitalId,
        hospital_name: reactivatedUser.hospitals?.name,
        isActive: reactivatedUser.isActive,
        lastLogin: reactivatedUser.lastLogin,
        created_at: reactivatedUser.created_at
      }
    });

  } catch (error) {
    console.error('Error al reactivar usuario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
