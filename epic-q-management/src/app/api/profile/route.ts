import { NextRequest, NextResponse } from 'next/server';
import { withRoleAuth, AuthContext } from '@/lib/auth/middleware';
import { prisma } from '@/lib/database';
import { z } from 'zod';

const updateProfileSchema = z.object({
  name: z.string()
    .min(1, 'El nombre es requerido')
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(255, 'El nombre es demasiado largo')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras y espacios'),
  preferredLanguage: z.string()
    .min(2, 'El idioma es requerido')
    .max(5, 'Código de idioma inválido'),
  timezone: z.string()
    .min(1, 'La zona horaria es requerida'),
  country: z.string()
    .min(2, 'El país es requerido')
    .max(2, 'Código de país inválido')
});

export const PUT = withRoleAuth(
  ['admin', 'coordinator'],
  async (request: NextRequest, context: AuthContext) => {
    try {
      const userId = context.user.id;
      const body = await request.json();
      
      // Validar datos
      const validatedData = updateProfileSchema.parse(body);
      
      // Actualizar usuario
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          name: validatedData.name,
          preferredLanguage: validatedData.preferredLanguage,
          timezone: validatedData.timezone,
          country: validatedData.country,
          updated_at: new Date()
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          preferredLanguage: true,
          timezone: true,
          country: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
          updated_at: true
        }
      });

      return NextResponse.json({
        success: true,
        user: updatedUser,
        message: 'Perfil actualizado exitosamente'
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Datos inválidos', details: error.errors },
          { status: 400 }
        );
      }

      console.error('Error updating profile:', error);
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  }
);
