import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, AuthContext } from '@/lib/auth/middleware';
import { prisma } from '@/lib/database';
import { z } from 'zod';

const bulkDeactivateSchema = z.object({
  userIds: z.array(z.string().min(1, 'ID de usuario inválido')).min(1, 'Debe seleccionar al menos un usuario'),
});

export const POST = withAdminAuth(async (request: NextRequest, context: AuthContext) => {
  try {
    const body = await request.json();
    const { userIds } = bulkDeactivateSchema.parse(body);

    // Verificar que todos los usuarios existen y están activos
    const users = await prisma.users.findMany({
      where: {
        id: { in: userIds },
        isActive: true
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
          error: 'No se pueden desactivar algunos usuarios',
          details: 'Algunos usuarios no existen o ya están desactivados. Solo se pueden desactivar usuarios activos.'
        },
        { status: 400 }
      );
    }

    // Verificar que el admin no se está desactivando a sí mismo
    if (userIds.includes(context.user.id)) {
      return NextResponse.json(
        { 
          error: 'No se pueden desactivar algunos usuarios',
          details: 'No puedes desactivar tu propia cuenta. Contacta al soporte técnico si necesitas ayuda.'
        },
        { status: 400 }
      );
    }

    // Desactivar usuarios en una transacción
    const result = await prisma.users.updateMany({
      where: {
        id: { in: userIds },
        isActive: true
      },
      data: {
        isActive: false,
        updated_at: new Date()
      }
    });

    console.log(`${result.count} usuarios desactivados por admin ${context.user.email}`);

    return NextResponse.json({
      success: true,
      message: `${result.count} usuarios desactivados exitosamente`,
      count: result.count,
      users: users.map(user => ({ id: user.id, email: user.email, name: user.name }))
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error in bulk deactivate users:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al desactivar usuarios' },
      { status: 500 }
    );
  }
});
