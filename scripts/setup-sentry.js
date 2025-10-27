#!/usr/bin/env node

/**
 * Script para configurar Sentry
 * 
 * Este script te guía paso a paso para configurar Sentry:
 * 1. Crear cuenta y proyecto en Sentry
 * 2. Obtener DSN y tokens
 * 3. Configurar variables de entorno
 * 4. Probar la integración
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
  console.log('🚀 Configuración de Sentry para EPIC-Q\n');
  
  console.log('📋 PASO 1: Crear cuenta y proyecto en Sentry');
  console.log('1. Ve a https://sentry.io y crea una cuenta gratuita');
  console.log('2. Crea una nueva organización (o usa la existente)');
  console.log('3. Crea un nuevo proyecto:');
  console.log('   - Platform: Next.js');
  console.log('   - Project Name: epic-q-management');
  console.log('   - Team: (selecciona o crea uno)');
  console.log('');
  
  const hasProject = await question('¿Ya tienes el proyecto creado en Sentry? (y/n): ');
  
  if (hasProject.toLowerCase() !== 'y') {
    console.log('⏸️  Por favor, crea el proyecto primero y luego ejecuta este script nuevamente.');
    rl.close();
    return;
  }
  
  console.log('\n📋 PASO 2: Obtener credenciales de Sentry');
  console.log('1. Ve a tu proyecto en Sentry Dashboard');
  console.log('2. Settings > Client Keys (DSN)');
  console.log('3. Copia el DSN (Data Source Name)');
  console.log('4. Ve a Settings > Auth Tokens');
  console.log('5. Crea un nuevo token con permisos:');
  console.log('   - project:read');
  console.log('   - project:releases');
  console.log('   - org:read');
  console.log('');
  
  const dsn = await question('Ingresa tu DSN de Sentry: ');
  const org = await question('Ingresa el nombre de tu organización: ');
  const project = await question('Ingresa el nombre del proyecto (epic-q-management): ') || 'epic-q-management';
  const authToken = await question('Ingresa tu Auth Token: ');
  
  console.log('\n📋 PASO 3: Configurar variables de entorno');
  console.log('Agrega estas variables a tu archivo .env.local o .env:');
  console.log('');
  console.log('# Sentry Configuration');
  console.log(`SENTRY_DSN=${dsn}`);
  console.log(`NEXT_PUBLIC_SENTRY_DSN=${dsn}`);
  console.log(`SENTRY_ORG=${org}`);
  console.log(`SENTRY_PROJECT=${project}`);
  console.log(`SENTRY_AUTH_TOKEN=${authToken}`);
  console.log('');
  
  console.log('📋 PASO 4: Configurar en Vercel (para producción)');
  console.log('1. Ve a tu proyecto en Vercel Dashboard');
  console.log('2. Settings > Environment Variables');
  console.log('3. Agrega las mismas variables para Production, Preview y Development');
  console.log('');
  
  console.log('📋 PASO 5: Probar la integración');
  console.log('1. npm run dev');
  console.log('2. Ve a cualquier página de tu aplicación');
  console.log('3. Abre la consola del navegador');
  console.log('4. Ejecuta: Sentry.captureException(new Error("Test error"))');
  console.log('5. Ve a Sentry Dashboard > Issues para ver el error');
  console.log('');
  
  console.log('✅ Configuración completada!');
  console.log('');
  console.log('📊 Beneficios de Sentry:');
  console.log('- 🐛 Tracking automático de errores en producción');
  console.log('- 📈 Métricas de performance (100k transactions/mes gratis)');
  console.log('- 🔔 Alertas por email/Slack cuando hay errores críticos');
  console.log('- 📱 Session Replay para debugging');
  console.log('- 📊 Dashboard con métricas de estabilidad');
  console.log('');
  console.log('💡 Tips:');
  console.log('- Revisa Sentry Dashboard regularmente');
  console.log('- Configura alertas para errores críticos');
  console.log('- Usa el Session Replay para debugging complejo');
  console.log('');
  
  rl.close();
}

main().catch(console.error);
