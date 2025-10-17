import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

export async function DELETE(
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
    const adminUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { hospital: true }
    });

    if (!adminUser || !adminUser.isActive || adminUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Permisos insuficientes' },
        { status: 403 }
      );
    }

    const userId = params.id;

    // Verificar que el usuario a eliminar existe y está inactivo
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        hospital: true,
        // Incluir relaciones que podrían necesitar eliminación en cascada
        notifications: true,
        // Agregar más relaciones según el esquema de la base de datos
      }
    });

    if (!userToDelete) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Solo permitir eliminación de usuarios inactivos
    if (userToDelete.isActive) {
      return NextResponse.json(
        { error: 'Solo se pueden eliminar usuarios inactivos' },
        { status: 400 }
      );
    }

    // No permitir que un admin se elimine a sí mismo
    if (userToDelete.id === adminUser.id) {
      return NextResponse.json(
        { error: 'No puedes eliminarte a ti mismo' },
        { status: 400 }
      );
    }

    // Eliminar usuario y todas sus relaciones en cascada
    // Prisma manejará automáticamente las eliminaciones en cascada si están configuradas en el schema
    await prisma.user.delete({
      where: { id: userId }
    });

    console.log(`Usuario ${userToDelete.email} eliminado permanentemente por admin ${adminUser.email}`);

    return NextResponse.json({
      success: true,
      message: 'Usuario eliminado permanentemente'
    });

  } catch (error) {
    console.error('Error al eliminar usuario permanentemente:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
