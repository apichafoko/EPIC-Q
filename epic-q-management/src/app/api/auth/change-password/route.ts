import { NextRequest, NextResponse } from 'next/server';
import { withRoleAuth, AuthContext } from '@/lib/auth/middleware';
import { prisma } from '@/lib/database';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const changePasswordSchema = z.object({
  currentPassword: z.string()
    .min(1, 'La contraseña actual es requerida'),
  newPassword: z.string()
    .min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
    .max(255, 'La contraseña es demasiado larga')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'La contraseña debe contener al menos una letra minúscula, una mayúscula y un número')
});

export const POST = withRoleAuth(
  ['admin', 'coordinator'],
  async (request: NextRequest, context: AuthContext) => {
    try {
      const userId = context.user.id;
      const body = await request.json();
      
      // Validar datos
      const validatedData = changePasswordSchema.parse(body);
      
      // Obtener usuario actual
      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: { password: true, isTemporaryPassword: true }
      });

      if (!user) {
        return NextResponse.json(
          { error: 'Usuario no encontrado' },
          { status: 404 }
        );
      }

      // Verificar contraseña actual
      if (user.password) {
        const isCurrentPasswordValid = await bcrypt.compare(
          validatedData.currentPassword,
          user.password
        );

        if (!isCurrentPasswordValid) {
          return NextResponse.json(
            { error: 'La contraseña actual es incorrecta' },
            { status: 400 }
          );
        }
      }

      // Hash de la nueva contraseña
      const hashedNewPassword = await bcrypt.hash(validatedData.newPassword, 12);

      // Actualizar contraseña
      await prisma.users.update({
        where: { id: userId },
        data: {
          password: hashedNewPassword,
          isTemporaryPassword: false, // Ya no es contraseña temporal
          updated_at: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Contraseña cambiada exitosamente'
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Datos inválidos', details: error.errors },
          { status: 400 }
        );
      }

      console.error('Error changing password:', error);
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  }
);