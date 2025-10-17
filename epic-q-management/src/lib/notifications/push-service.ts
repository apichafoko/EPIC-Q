import webpush from 'web-push';
import { prisma } from '@/lib/database';

// Configure VAPID keys
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || '',
  privateKey: process.env.VAPID_PRIVATE_KEY || '',
};

if (vapidKeys.publicKey && vapidKeys.privateKey) {
  webpush.setVapidDetails(
    'mailto:admin@epic-q.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );
}

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export async function sendPushNotification(userId: string, title: string, message: string) {
  try {
    // Get user's push subscription
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true,
        pushSubscription: true,
      },
    });

    if (!user?.pushSubscription) {
      console.log('No push subscription found for user:', userId);
      return;
    }

    const subscription: PushSubscription = JSON.parse(user.pushSubscription);

    const payload = JSON.stringify({
      title,
      body: message,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      url: '/notifications',
      timestamp: Date.now(),
    });

    await webpush.sendNotification(subscription, payload);
    console.log('Push notification sent to user:', userId);
  } catch (error) {
    console.error('Failed to send push notification:', error);
    throw error;
  }
}

export async function subscribeUser(userId: string, subscription: PushSubscription) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        pushSubscription: JSON.stringify(subscription),
      },
    });
    console.log('Push subscription saved for user:', userId);
  } catch (error) {
    console.error('Failed to save push subscription:', error);
    throw error;
  }
}

export async function unsubscribeUser(userId: string) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        pushSubscription: null,
      },
    });
    console.log('Push subscription removed for user:', userId);
  } catch (error) {
    console.error('Failed to remove push subscription:', error);
    throw error;
  }
}

export function getVapidPublicKey() {
  return vapidKeys.publicKey;
}
