import { NextRequest, NextResponse } from 'next/server';
import { withRoleAuth, AuthContext } from '@/lib/auth/middleware';
import { prisma } from '@/lib/database';
import { z } from 'zod';

const updateSettingsSchema = z.object({
  // Notificaciones
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  
  // Zona horaria y región
  timezone: z.string().optional(),
  country: z.string().optional(),
  language: z.string().optional()
});

export async function PUT(request: NextRequest) {
  return withRoleAuth(
    ['admin', 'coordinator'],
    async (request: NextRequest, context: AuthContext) => {
      try {
        const userId = context.user.id;
        const body = await request.json();
        
        // Validar datos
        let validatedData;
        try {
          validatedData = updateSettingsSchema.parse(body);
        } catch (validationError) {
          console.error('Settings PUT - Error de validación:', validationError);
          return NextResponse.json({
            error: 'Datos de configuración inválidos'
          }, { status: 400 });
        }
        
        // Buscar configuración existente
        let userSettings = await prisma.user_settings.findUnique({
          where: { userId }
        });

        if (!userSettings) {
          // Crear nueva configuración
          userSettings = await prisma.user_settings.create({
            data: {
              id: `settings_${userId}_${Date.now()}`,
              userId,
              emailNotifications: validatedData.emailNotifications ?? true,
              pushNotifications: validatedData.pushNotifications ?? true,
              language: validatedData.language ?? 'es',
              timezone: validatedData.timezone ?? null,
              updated_at: new Date()
            }
          });
        } else {
          // Actualizar configuración existente
          userSettings = await prisma.user_settings.update({
            where: { userId },
            data: {
              emailNotifications: validatedData.emailNotifications ?? userSettings.emailNotifications,
              pushNotifications: validatedData.pushNotifications ?? userSettings.pushNotifications,
              language: validatedData.language ?? userSettings.language,
              timezone: validatedData.timezone ?? userSettings.timezone,
              updated_at: new Date()
            }
          });
        }

        // También actualizar campos básicos en la tabla de usuarios si están presentes
        const userUpdateData: any = {};
        if (validatedData.timezone) userUpdateData.timezone = validatedData.timezone;
        if (validatedData.country) userUpdateData.country = validatedData.country;
        if (validatedData.language) userUpdateData.preferredLanguage = validatedData.language;

        if (Object.keys(userUpdateData).length > 0) {
          await prisma.users.update({
            where: { id: userId },
            data: {
              ...userUpdateData,
              updated_at: new Date()
            }
          });
        }

        return NextResponse.json({
          success: true,
          settings: userSettings,
          message: 'Configuración guardada exitosamente'
        });

      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Datos inválidos', details: error.issues },
            { status: 400 }
          );
        }

        console.error('Error updating settings:', error);
        return NextResponse.json(
          { error: 'Error interno del servidor' },
          { status: 500 }
        );
      }
    }
  )(request);
}

export async function GET(request: NextRequest) {
  return withRoleAuth(
    ['admin', 'coordinator'],
    async (request: NextRequest, context: AuthContext) => {
      try {
        const userId = context.user.id;
        
        // Buscar configuración del usuario
        const userSettings = await prisma.user_settings.findUnique({
          where: { userId }
        });

        // Configuración por defecto
        const defaultSettings = {
          emailNotifications: true,
          pushNotifications: true,
          language: 'es',
          timezone: 'America/Argentina/Buenos_Aires',
          country: 'AR'
        };

        return NextResponse.json({
          success: true,
          settings: userSettings ? {
            emailNotifications: userSettings.emailNotifications,
            pushNotifications: userSettings.pushNotifications,
            language: userSettings.language,
            timezone: userSettings.timezone,
            country: 'AR' // Este campo no está en user_settings, se mantiene por defecto
          } : defaultSettings
        });

      } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json(
          { error: 'Error interno del servidor' },
          { status: 500 }
        );
      }
    }
  )(request);
}
