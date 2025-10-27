#!/usr/bin/env node

/**
 * Script para configurar Push Notifications
 * 
 * Este script te guía paso a paso para configurar push notifications:
 * 1. Verificar VAPID keys
 * 2. Configurar variables de entorno
 * 3. Migrar base de datos
 * 4. Probar la funcionalidad
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('🚀 Configuración de Push Notifications para EPIC-Q\n');
  
  console.log('📋 PASO 1: Verificar VAPID Keys');
  console.log('Las VAPID keys ya están generadas:');
  console.log('');
  console.log('Public Key: BOTJvNXdGDoFNRjk5CO6XvhFPpmtwpedkBL2IBZsKSxZbuRFmMz5XYJg6POUQg7cOkxV9tS6HNoopCSQQ-1pfAI');
  console.log('Private Key: 3YM7EhQsSllGBC64GVYNcogc4xdknmhFiqoMvmBYPUw');
  console.log('');
  console.log('✅ Estas keys ya están configuradas en el código');
  console.log('');
  
  console.log('📋 PASO 2: Configurar variables de entorno');
  console.log('Agrega estas variables a tu archivo .env.local o .env:');
  console.log('');
  console.log('# Push Notifications');
  console.log('VAPID_PUBLIC_KEY=BOTJvNXdGDoFNRjk5CO6XvhFPpmtwpedkBL2IBZsKSxZbuRFmMz5XYJg6POUQg7cOkxV9tS6HNoopCSQQ-1pfAI');
  console.log('VAPID_PRIVATE_KEY=3YM7EhQsSllGBC64GVYNcogc4xdknmhFiqoMvmBYPUw');
  console.log('VAPID_SUBJECT=mailto:admin@epicq.com');
  console.log('NEXT_PUBLIC_VAPID_PUBLIC_KEY=BOTJvNXdGDoFNRjk5CO6XvhFPpmtwpedkBL2IBZsKSxZbuRFmMz5XYJg6POUQg7cOkxV9tS6HNoopCSQQ-1pfAI');
  console.log('');
  
  const hasEnvVars = await question('¿Ya agregaste las variables de entorno? (y/n): ');
  
  if (hasEnvVars.toLowerCase() !== 'y') {
    console.log('⏸️  Por favor, agrega las variables y luego ejecuta este script nuevamente.');
    rl.close();
    return;
  }
  
  console.log('\n📋 PASO 3: Migrar base de datos');
  console.log('Ejecuta el siguiente comando para crear la tabla de push subscriptions:');
  console.log('');
  console.log('npm run db:migrate');
  console.log('');
  
  const hasMigrated = await question('¿Ya ejecutaste la migración? (y/n): ');
  
  if (hasMigrated.toLowerCase() !== 'y') {
    console.log('⏸️  Por favor, ejecuta la migración y luego ejecuta este script nuevamente.');
    rl.close();
    return;
  }
  
  console.log('\n📋 PASO 4: Configurar en Vercel (para producción)');
  console.log('1. Ve a tu proyecto en Vercel Dashboard');
  console.log('2. Settings > Environment Variables');
  console.log('3. Agrega las mismas variables para Production, Preview y Development');
  console.log('');
  
  console.log('📋 PASO 5: Probar la funcionalidad');
  console.log('1. npm run dev');
  console.log('2. Ve a cualquier página de tu aplicación');
  console.log('3. Abre la consola del navegador');
  console.log('4. Ejecuta el siguiente código para suscribirte:');
  console.log('');
  console.log('```javascript');
  console.log('// Suscribirse a push notifications');
  console.log('if ("serviceWorker" in navigator && "PushManager" in window) {');
  console.log('  navigator.serviceWorker.ready.then(registration => {');
  console.log('    return registration.pushManager.subscribe({');
  console.log('      userVisibleOnly: true,');
  console.log('      applicationServerKey: "BOTJvNXdGDoFNRjk5CO6XvhFPpmtwpedkBL2IBZsKSxZbuRFmMz5XYJg6POUQg7cOkxV9tS6HNoopCSQQ-1pfAI"');
  console.log('    });');
  console.log('  }).then(subscription => {');
  console.log('    return fetch("/api/notifications/subscribe", {');
  console.log('      method: "POST",');
  console.log('      headers: { "Content-Type": "application/json" },');
  console.log('      body: JSON.stringify({ subscription })');
  console.log('    });');
  console.log('  }).then(response => {');
  console.log('    if (response.ok) {');
  console.log('      console.log("✅ Suscrito a push notifications");');
  console.log('    }');
  console.log('  });');
  console.log('}');
  console.log('```');
  console.log('');
  
  console.log('📋 PASO 6: Probar envío de notificaciones');
  console.log('Para probar el envío de notificaciones:');
  console.log('');
  console.log('```bash');
  console.log('curl -X POST "http://localhost:3000/api/notifications/send-push" \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -d \'{"title": "Test", "message": "Esta es una notificación de prueba"}\'');
  console.log('```');
  console.log('');
  
  console.log('✅ Configuración completada!');
  console.log('');
  console.log('📱 Funcionalidades de Push Notifications:');
  console.log('- 🔔 Notificaciones en tiempo real sin necesidad de refrescar');
  console.log('- 📱 Funciona incluso cuando la pestaña no está activa');
  console.log('- 🎯 Integración automática con el sistema de alertas');
  console.log('- 💾 Suscripciones guardadas en base de datos');
  console.log('- 🔄 Gestión automática de suscripciones');
  console.log('');
  console.log('💡 Tips:');
  console.log('- Las notificaciones solo funcionan en HTTPS en producción');
  console.log('- Los usuarios deben permitir notificaciones en su navegador');
  console.log('- Las suscripciones se guardan por endpoint (único por navegador)');
  console.log('');
  
  rl.close();
}

main().catch(console.error);
