// Service Worker para notificaciones push
const CACHE_NAME = 'epic-q-push-v1';
const NOTIFICATION_ICON = '/icons/icon-192x192.png';

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalado');
  self.skipWaiting();
});

// Activar Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activado');
  event.waitUntil(self.clients.claim());
});

// Manejar notificaciones push
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push recibido');
  
  const options = {
    body: event.data ? event.data.text() : 'Nueva notificación',
    icon: NOTIFICATION_ICON,
    badge: NOTIFICATION_ICON,
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver detalles',
        icon: '/icons/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Cerrar',
        icon: '/icons/icon-192x192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('EPIC-Q', options)
  );
});

// Manejar clics en notificaciones
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Click en notificación');
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/es/admin/notifications')
    );
  }
});

// Manejar mensajes del cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
