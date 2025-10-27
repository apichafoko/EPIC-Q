export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export class PushService {
  private static instance: PushService;
  private registration: ServiceWorkerRegistration | null = null;

  static getInstance(): PushService {
    if (!PushService.instance) {
      PushService.instance = new PushService();
    }
    return PushService.instance;
  }

  async initialize(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push messaging no soportado');
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw-push.js');
      console.log('Service Worker registrado:', this.registration);
      return true;
    } catch (error) {
      console.error('Error registrando Service Worker:', error);
      return false;
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!this.registration) {
      throw new Error('Service Worker no inicializado');
    }

    const permission = await Notification.requestPermission();
    console.log('Permiso de notificación:', permission);
    return permission;
  }

  async subscribe(): Promise<PushSubscription | null> {
    if (!this.registration) {
      throw new Error('Service Worker no inicializado');
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BOTJvNXdGDoFNRjk5CO6XvhFPpmtwpedkBL2IBZsKSxZbuRFmMz5XYJg6POUQg7cOkxV9tS6HNoopCSQQ-1pfAI'
        ) as any
      });

      console.log('Suscripción push creada:', subscription);
      return subscription;
    } catch (error) {
      console.error('Error creando suscripción push:', error);
      return null;
    }
  }

  async getSubscription(): Promise<PushSubscription | null> {
    if (!this.registration) {
      return null;
    }

    return await this.registration.pushManager.getSubscription();
  }

  async unsubscribe(): Promise<boolean> {
    const subscription = await this.getSubscription();
    if (subscription) {
      return await subscription.unsubscribe();
    }
    return false;
  }

  async sendNotification(title: string, options: NotificationOptions = {}): Promise<void> {
    if (!this.registration) {
      throw new Error('Service Worker no inicializado');
    }

    await this.registration.showNotification(title, {
      icon: '/icons/icon-192x192.svg',
      badge: '/icons/icon-192x192.svg',
      ...options
    });
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async saveSubscriptionToServer(subscription: PushSubscription): Promise<boolean> {
    try {
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          subscription: {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
              auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
            }
          }
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Error guardando suscripción:', error);
      return false;
    }
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}