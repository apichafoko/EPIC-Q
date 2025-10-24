import { PrismaClient } from '@prisma/client';
import { EmailTemplateService, TemplateVariables } from './email-template-service';

const prisma = new PrismaClient();

export class InternalNotificationService {
  static async sendWelcomeNotification(userId: string, userName: string, hospitalName: string) {
    try {
      const template = await EmailTemplateService.getTemplateByName('bienvenida_coordinador_interna');

      if (template) {
        const variables: TemplateVariables = {
          userName: userName,
          hospitalName: hospitalName
        };

        const processed = EmailTemplateService.processTemplate(template, variables);
        await EmailTemplateService.incrementUsageCount(template.id);

        // Crear notificación interna
        await prisma.notifications.create({
          data: {
            id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: userId,
            title: processed.subject || '¡Bienvenido al sistema EPIC-Q!',
            message: processed.body || '',
            type: 'welcome',
            isRead: false
          }
        });

        console.log(`✅ Notificación de bienvenida enviada a usuario ${userId}`);
        return true;
      }

      // Fallback si no hay template
      await prisma.notifications.create({
        data: {
          id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: userId,
          title: '¡Bienvenido al sistema EPIC-Q!',
          message: `¡Hola ${userName}!\n\nBienvenido al sistema de gestión del Estudio Perioperatorio Integral de Cuidados Quirúrgicos (EPIC-Q).\n\nComo coordinador del hospital ${hospitalName}, tienes acceso a todas las funciones del sistema.\n\n¡Esperamos que tengas una excelente experiencia!`,
          type: 'welcome',
          isRead: false
        }
      });

      console.log(`✅ Notificación de bienvenida (fallback) enviada a usuario ${userId}`);
      return true;
    } catch (error) {
      console.error('Error sending welcome notification:', error);
      return false;
    }
  }

  static async sendCustomNotification(userId: string, title: string, message: string, type: string = 'info') {
    try {
      await prisma.notifications.create({
        data: {
          id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: userId,
          title: title,
          message: message,
          type: type,
          isRead: false
        }
      });

      console.log(`✅ Notificación personalizada enviada a usuario ${userId}`);
      return true;
    } catch (error) {
      console.error('Error sending custom notification:', error);
      return false;
    }
  }

  static async getUserNotifications(userId: string, limit: number = 10) {
    try {
      const notifications = await prisma.notifications.findMany({
        where: { userId: userId },
        orderBy: { created_at: 'desc' },
        take: limit
      });

      return notifications;
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      return [];
    }
  }

  static async markAsRead(notificationId: string) {
    try {
      await prisma.notifications.update({
        where: { id: notificationId },
        data: { isRead: true }
      });

      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  static async markAllAsRead(userId: string) {
    try {
      await prisma.notifications.updateMany({
        where: { 
          userId: userId,
          isRead: false 
        },
        data: { isRead: true }
      });

      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }
}
