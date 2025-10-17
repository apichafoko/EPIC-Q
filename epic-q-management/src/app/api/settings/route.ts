import { NextRequest, NextResponse } from 'next/server';
import { withRoleAuth, AuthContext } from '@/lib/auth/middleware';
import { prisma } from '@/lib/database';
import { z } from 'zod';

const updateSettingsSchema = z.object({
  // Notificaciones - Oculto por el momento
  // emailNotifications: z.boolean().optional(),
  // pushNotifications: z.boolean().optional(),
  // weeklyReports: z.boolean().optional(),
  // projectUpdates: z.boolean().optional(),
  // systemAlerts: z.boolean().optional(),
  
  // Privacidad - Oculto por el momento
  // profileVisibility: z.enum(['public', 'private', 'team']).optional(),
  // dataSharing: z.boolean().optional(),
  // analyticsTracking: z.boolean().optional(),
  
  // Preferencias de UI
  theme: z.enum(['light', 'dark', 'system']).optional(),
  compactMode: z.boolean().optional(),
  autoSave: z.boolean().optional(),
  
  // Zona horaria y región
  timezone: z.string().optional(),
  country: z.string().optional(),
  language: z.string().optional(),
  
  // Seguridad
  twoFactorAuth: z.boolean().optional(),
  sessionTimeout: z.string().optional(),
  passwordExpiry: z.string().optional()
});

export const PUT = withRoleAuth(
  ['admin', 'coordinator'],
  async (request: NextRequest, context: AuthContext) => {
    try {
      const userId = context.user.id;
      const body = await request.json();
      
      // Validar datos
      const validatedData = updateSettingsSchema.parse(body);
      
      // Buscar configuración existente o crear nueva
      let userSettings = await prisma.userSettings.findUnique({
        where: { userId }
      });

      if (!userSettings) {
        // Crear nueva configuración
        userSettings = await prisma.userSettings.create({
          data: {
            userId,
            settings: validatedData
          }
        });
      } else {
        // Actualizar configuración existente
        userSettings = await prisma.userSettings.update({
          where: { userId },
          data: {
            settings: {
              ...userSettings.settings,
              ...validatedData
            },
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
        await prisma.user.update({
          where: { id: userId },
          data: {
            ...userUpdateData,
            updated_at: new Date()
          }
        });
      }

      return NextResponse.json({
        success: true,
        settings: userSettings.settings,
        message: 'Configuración guardada exitosamente'
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Datos inválidos', details: error.errors },
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
);

export const GET = withRoleAuth(
  ['admin', 'coordinator'],
  async (request: NextRequest, context: AuthContext) => {
    try {
      const userId = context.user.id;
      
      // Buscar configuración del usuario
      const userSettings = await prisma.userSettings.findUnique({
        where: { userId }
      });

      // Configuración por defecto
      const defaultSettings = {
        // emailNotifications: true,
        // pushNotifications: true,
        // weeklyReports: false,
        // projectUpdates: true,
        // systemAlerts: true,
        // profileVisibility: 'private',
        // dataSharing: false,
        // analyticsTracking: true,
        theme: 'system',
        compactMode: false,
        autoSave: true,
        twoFactorAuth: false,
        sessionTimeout: '8',
        passwordExpiry: '90'
      };

      return NextResponse.json({
        success: true,
        settings: userSettings?.settings || defaultSettings
      });

    } catch (error) {
      console.error('Error fetching settings:', error);
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  }
);
