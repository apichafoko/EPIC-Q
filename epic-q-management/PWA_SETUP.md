# 📱 Configuración PWA - EPIC-Q Management System

## 📋 Resumen

Este documento describe la configuración de Progressive Web App (PWA) para el sistema de gestión EPIC-Q, permitiendo instalación en dispositivos móviles y funcionamiento offline.

## 🏗️ Arquitectura PWA

### Componentes Principales

1. **Web App Manifest** (`/public/manifest.json`)
   - Metadatos de la aplicación
   - Iconos y colores
   - Configuración de pantalla

2. **Service Worker** (`/public/sw.js`)
   - Caché de recursos
   - Funcionamiento offline
   - Sincronización de datos

3. **Iconos** (`/public/icons/`)
   - Múltiples tamaños para diferentes dispositivos
   - Formato PNG optimizado
   - Máscaras para iOS

## ⚙️ Configuración

### 1. Web App Manifest

El archivo `manifest.json` define cómo se comporta la aplicación cuando se instala:

```json
{
  "name": "EPIC-Q Management System",
  "short_name": "EPIC-Q",
  "description": "Sistema de gestión para el Estudio Perioperatorio Integral de Cuidados Quirúrgicos",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ]
}
```

### 2. Service Worker

El service worker maneja el caché y la funcionalidad offline:

```javascript
// Estrategia de caché
const CACHE_NAME = 'epic-q-v1';
const urlsToCache = [
  '/',
  '/static/css/main.css',
  '/static/js/bundle.js',
  '/icons/icon-192x192.png'
];

// Instalación
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Estrategia de red
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});
```

### 3. Iconos PWA

Generar iconos en múltiples tamaños:

```bash
# Usar el script incluido
node scripts/generate-icons.js

# O generar manualmente con herramientas como:
# - PWA Builder (https://www.pwabuilder.com/)
# - RealFaviconGenerator (https://realfavicongenerator.net/)
```

## 🚀 Instalación

### 1. Desde el Navegador

1. Abrir la aplicación en Chrome/Edge
2. Buscar el ícono de instalación en la barra de direcciones
3. Hacer clic en "Instalar"
4. Confirmar la instalación

### 2. Desde el Código

```javascript
// Detectar si la app es instalable
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  showInstallButton();
});

// Mostrar botón de instalación
function showInstallButton() {
  const installButton = document.getElementById('install-button');
  installButton.style.display = 'block';
  installButton.addEventListener('click', installApp);
}

// Instalar aplicación
async function installApp() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    deferredPrompt = null;
  }
}
```

## 🔄 Funcionalidad Offline

### 1. Caché de Recursos

- **Estrategia Cache First**: Para recursos estáticos (CSS, JS, imágenes)
- **Estrategia Network First**: Para datos dinámicos (API calls)
- **Estrategia Stale While Revalidate**: Para contenido que puede actualizarse

### 2. Sincronización de Datos

```javascript
// Sincronizar cuando vuelve la conexión
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Sincronizar datos pendientes
  await syncPendingData();
}
```

### 3. Notificaciones Push

```javascript
// Suscribirse a notificaciones push
async function subscribeToPush() {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: VAPID_PUBLIC_KEY
  });
  
  // Enviar subscription al servidor
  await fetch('/api/notifications/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription)
  });
}
```

## 📱 Compatibilidad

### 1. Navegadores Soportados

- **Chrome/Edge**: Soporte completo
- **Firefox**: Soporte básico
- **Safari**: Soporte limitado (iOS 11.3+)
- **Samsung Internet**: Soporte completo

### 2. Dispositivos

- **Android**: Instalación nativa
- **iOS**: Agregar a pantalla de inicio
- **Desktop**: Instalación como app

## 🧪 Testing PWA

### 1. Lighthouse Audit

```bash
# Ejecutar auditoría PWA
npx lighthouse http://localhost:3000 --view

# Verificar métricas PWA
# - Installable
# - PWA Optimized
# - Fast and Reliable
```

### 2. Chrome DevTools

1. Abrir DevTools (F12)
2. Ir a la pestaña "Application"
3. Verificar "Manifest" y "Service Workers"
4. Probar funcionalidad offline

### 3. Testing Manual

```bash
# 1. Verificar manifest
curl http://localhost:3000/manifest.json

# 2. Verificar service worker
# Abrir DevTools > Application > Service Workers

# 3. Probar instalación
# Buscar ícono de instalación en la barra de direcciones
```

## 🔧 Solución de Problemas

### 1. App No Se Instala

**Causas comunes:**
- Manifest no válido
- Service worker no registrado
- HTTPS requerido (excepto localhost)

**Soluciones:**
```bash
# Verificar manifest
npx jsonlint public/manifest.json

# Verificar service worker
# DevTools > Application > Service Workers
```

### 2. Funcionalidad Offline No Funciona

**Causas comunes:**
- Service worker no registrado
- Recursos no cacheados
- Estrategia de caché incorrecta

**Soluciones:**
```javascript
// Verificar registro del service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(registration => console.log('SW registered'))
    .catch(error => console.log('SW registration failed'));
}
```

### 3. Notificaciones Push No Funcionan

**Causas comunes:**
- VAPID keys no configuradas
- Permisos no concedidos
- Service worker no activo

**Soluciones:**
```bash
# Generar VAPID keys
npx web-push generate-vapid-keys

# Verificar permisos
# Settings > Site Settings > Notifications
```

## 📊 Métricas PWA

### 1. Core Web Vitals

- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

### 2. PWA Checklist

- ✅ Web App Manifest
- ✅ Service Worker
- ✅ HTTPS (excepto localhost)
- ✅ Responsive Design
- ✅ Fast Loading
- ✅ Offline Functionality

## 🚀 Despliegue

### 1. Configuración de Producción

```bash
# Variables de entorno para producción
NEXTAUTH_URL="https://tu-dominio.com"
NEXT_PUBLIC_VAPID_PUBLIC_KEY="tu-vapid-public-key"
VAPID_PRIVATE_KEY="tu-vapid-private-key"
```

### 2. Verificación Post-Despliegue

```bash
# 1. Verificar manifest
curl https://tu-dominio.com/manifest.json

# 2. Verificar service worker
# Abrir DevTools > Application > Service Workers

# 3. Ejecutar Lighthouse
npx lighthouse https://tu-dominio.com --view
```

## 📚 Referencias

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Lighthouse PWA Audit](https://developers.google.com/web/tools/lighthouse)

## 🤝 Soporte

Para problemas técnicos o preguntas sobre PWA, contactar al equipo de desarrollo.

---

**Última actualización**: Diciembre 2024
**Versión**: 1.0.0
