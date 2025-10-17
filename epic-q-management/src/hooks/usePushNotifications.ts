'use client';

import { useState, useEffect } from 'react';

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [vapidPublicKey, setVapidPublicKey] = useState<string>('');

  useEffect(() => {
    // Check if push notifications are supported
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      getVapidPublicKey();
    }
  }, []);

  const getVapidPublicKey = async () => {
    try {
      const response = await fetch('/api/notifications/push');
      const data = await response.json();
      if (data.publicKey) {
        setVapidPublicKey(data.publicKey);
      }
    } catch (error) {
      console.error('Failed to get VAPID public key:', error);
    }
  };

  const subscribe = async () => {
    if (!isSupported || !vapidPublicKey) {
      throw new Error('Push notifications not supported or VAPID key not available');
    }

    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      // Send subscription to server
      const response = await fetch('/api/notifications/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'subscribe',
          subscription: subscription.toJSON(),
        }),
      });

      if (response.ok) {
        setIsSubscribed(true);
        return true;
      } else {
        throw new Error('Failed to subscribe to push notifications');
      }
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      throw error;
    }
  };

  const unsubscribe = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
      }

      // Notify server
      await fetch('/api/notifications/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'unsubscribe',
        }),
      });

      setIsSubscribed(false);
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      throw error;
    }
  };

  const requestPermission = async () => {
    if (!isSupported) {
      throw new Error('Push notifications not supported');
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  };

  return {
    isSupported,
    isSubscribed,
    subscribe,
    unsubscribe,
    requestPermission,
  };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
