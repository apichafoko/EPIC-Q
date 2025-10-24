import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/database';
import webpush from 'web-push';

// Configurar VAPID keys
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:admin@epicq.com',
  process.env.VAPID_PUBLIC_KEY || 'BOTJvNXdGDoFNRjk5CO6XvhFPpmtwpedkBL2IBZsKSxZbuRFmMz5XYJg6POUQg7cOkxV9tS6HNoopCSQQ-1pfAI',
  process.env.VAPID_PRIVATE_KEY || '3YM7EhQsSllGBC64GVYNcogc4xdknmhFiqoMvmBYPUw'
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, message, data, targetUserId } = body;

    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
    }

    // Obtener todas las suscripciones push activas
    const subscriptions = await prisma.push_subscriptions.findMany({
      where: {
        // Si se especifica un usuario, podrías filtrar por usuario aquí
        // Por ahora enviamos a todos
      }
    });

    if (subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No push subscriptions found',
        sent: 0
      });
    }

    const payload = JSON.stringify({
      title,
      message,
      data: data || {},
      icon: '/icons/icon-192x192.svg',
      badge: '/icons/icon-192x192.svg',
      timestamp: Date.now()
    });

    const results = await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh_key,
                auth: subscription.auth_key
              }
            },
            payload
          );
          return { success: true, endpoint: subscription.endpoint };
        } catch (error) {
          console.error('Error sending push notification:', error);
          return { success: false, endpoint: subscription.endpoint, error: error instanceof Error ? error.message : 'Unknown error' };
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    return NextResponse.json({
      success: true,
      message: `Push notifications sent: ${successful} successful, ${failed} failed`,
      sent: successful,
      failed: failed,
      results: results.map(r => r.status === 'fulfilled' ? r.value : { success: false, error: r.reason })
    });

  } catch (error) {
    console.error('Error sending push notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
