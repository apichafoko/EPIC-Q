import { prisma } from '@/lib/database';

export interface CreateNotificationData {
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'email' | 'push';
  metadata?: Record<string, any>;
}

export interface NotificationFilters {
  userId?: string;
  type?: string;
  read?: boolean;
  limit?: number;
  offset?: number;
}

export class NotificationService {
  /**
   * Create a new notification
   */
  static async createNotification(data: CreateNotificationData) {
    const notification = await prisma.notifications.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        isRead: false,
      },
    });

    // Note: Push and email notifications are handled by API routes
    // to avoid client-side module compatibility issues

    return notification;
  }

  /**
   * Get notifications for a user
   */
  static async getNotifications(filters: NotificationFilters) {
    const where: any = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.read !== undefined) {
      where.read = filters.read;
    }

    const notifications = await prisma.notifications.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    });

    return notifications;
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string) {
    return await prisma.notifications.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string) {
    return await prisma.notifications.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  /**
   * Get unread count for a user
   */
  static async getUnreadCount(userId: string) {
    return await prisma.notifications.count({
      where: { userId, isRead: false },
    });
  }

  /**
   * Delete notification
   */
  static async deleteNotification(notificationId: string) {
    return await prisma.notifications.delete({
      where: { id: notificationId },
    });
  }

  /**
   * Create notification for all coordinators
   */
  static async notifyAllCoordinators(title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
    const coordinators = await prisma.users.findMany({
      where: { role: 'coordinator' },
      select: { id: true },
    });

    const notifications = await Promise.all(
      coordinators.map(coordinator =>
        this.createNotification({
          userId: coordinator.id,
          title,
          message,
          type,
        })
      )
    );

    return notifications;
  }

  /**
   * Create notification for hospital coordinators
   */
  static async notifyHospitalCoordinators(hospitalId: string, title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
    const coordinators = await prisma.users.findMany({
      where: { 
        role: 'coordinator',
        hospital_id: hospitalId,
      },
      select: { id: true },
    });

    const notifications = await Promise.all(
      coordinators.map(coordinator =>
        this.createNotification({
          userId: coordinator.id,
          title,
          message,
          type,
        })
      )
    );

    return notifications;
  }
}
