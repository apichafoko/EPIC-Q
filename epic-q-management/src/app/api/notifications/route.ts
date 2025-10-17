import { NextRequest, NextResponse } from 'next/server';
import { SimpleAuthService } from '@/lib/auth/simple-auth-service';
import { NotificationService } from '@/lib/notifications/notification-service';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await SimpleAuthService.verifyToken(token);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const read = searchParams.get('read');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    const filters = {
      userId: user.id,
      type: type || undefined,
      read: read ? read === 'true' : undefined,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    };

    const notifications = await NotificationService.getNotifications(filters);
    const unreadCount = await NotificationService.getUnreadCount(user.id);

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await SimpleAuthService.verifyToken(token);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, notificationId } = body;

    switch (action) {
      case 'markAsRead':
        if (!notificationId) {
          return NextResponse.json({ error: 'Notification ID required' }, { status: 400 });
        }
        await NotificationService.markAsRead(notificationId);
        break;

      case 'markAllAsRead':
        await NotificationService.markAllAsRead(user.id);
        break;

      case 'delete':
        if (!notificationId) {
          return NextResponse.json({ error: 'Notification ID required' }, { status: 400 });
        }
        await NotificationService.deleteNotification(notificationId);
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update notification:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}
