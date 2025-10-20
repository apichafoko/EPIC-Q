import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { CascadeService } from '@/lib/services/cascade-service';

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

    const userId = params.id;

    // Verificar que el usuario a eliminar existe
    const userToDelete = await prisma.users.findUnique({
      where: { id: userId }
    });

    if (!userToDelete) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // No permitir que un admin se elimine a sí mismo
    if (userToDelete.id === adminUser.id) {
      return NextResponse.json(
        { 
          error: 'No se puede eliminar el usuario',
          details: 'No puedes eliminarte a ti mismo. Contacta al soporte técnico si necesitas ayuda.'
        },
        { status: 400 }
      );
    }

    // Solo permitir eliminación de usuarios inactivos
    if (userToDelete.isActive) {
      return NextResponse.json(
        { 
          error: 'No se puede eliminar el usuario',
          details: 'Solo se pueden eliminar usuarios inactivos. Primero debes desactivar el usuario.'
        },
        { status: 400 }
      );
    }

    // Usar el servicio de cascada para analizar las acciones necesarias
    const cascadeResult = await CascadeService.deleteCoordinatorWithCascade(userId);

    if (!cascadeResult.success) {
      return NextResponse.json(
        { 
          error: cascadeResult.message,
          details: cascadeResult.warnings?.join(' ') || undefined
        },
        { status: 400 }
      );
    }

    // Si hay acciones de cascada, devolver información para confirmación
    if (cascadeResult.actions && cascadeResult.actions.length > 0) {
      return NextResponse.json({
        requiresConfirmation: true,
        message: cascadeResult.message,
        warnings: cascadeResult.warnings,
        actions: cascadeResult.actions,
        userId: userId
      });
    }

    // Si no hay acciones de cascada, proceder con la eliminación
    const deleteResult = await CascadeService.executeCoordinatorDeletion(userId);

    if (!deleteResult.success) {
      return NextResponse.json(
        { 
          error: deleteResult.message,
          details: deleteResult.actions?.map(a => a.description).join(', ')
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: deleteResult.message,
      actions: deleteResult.actions
    });

  } catch (error) {
    console.error('Error al eliminar usuario permanentemente:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}