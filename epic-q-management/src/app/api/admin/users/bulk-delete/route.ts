import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, AuthContext } from '../../../../../lib/auth/middleware';
import { prisma } from '../../../../../lib/database';
import { z } from 'zod';

const bulkDeleteSchema = z.object({
  userIds: z.array(z.string().min(1, 'ID de usuario inválido')).min(1, 'Debe seleccionar al menos un usuario'),
});

export const POST = withAdminAuth(async (request: NextRequest, context: AuthContext) => {
  try {
    const body = await request.json();
    const { userIds } = bulkDeleteSchema.parse(body);

    // Verificar que todos los usuarios existen y están inactivos
    const users = await prisma.users.findMany({
      where: {
        id: { in: userIds },
        isActive: false
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    if (users.length !== userIds.length) {
      return NextResponse.json(
        { 
          error: 'No se pueden eliminar algunos usuarios',
          details: 'Solo se pueden eliminar usuarios desactivados. Primero debes desactivar los usuarios activos.'
        },
        { status: 400 }
      );
    }

    // Verificar que el admin no se está eliminando a sí mismo
    if (userIds.includes(context.user.id)) {
      return NextResponse.json(
        { 
          error: 'No se pueden eliminar algunos usuarios',
          details: 'No puedes eliminar tu propia cuenta. Contacta al soporte técnico si necesitas ayuda.'
        },
        { status: 400 }
      );
    }

    // Eliminar usuarios en una transacción
    const result = await prisma.users.deleteMany({
      where: {
        id: { in: userIds },
        isActive: false
      }
    });

    console.log(`${result.count} usuarios eliminados permanentemente por admin ${context.user.email}`);

    return NextResponse.json({
      success: true,
      message: `${result.count} usuarios eliminados permanentemente`,
      count: result.count,
      users: users.map(user => ({ id: user.id, email: user.email, name: user.name }))
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error in bulk delete users:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al eliminar usuarios' },
      { status: 500 }
    );
  }
});
