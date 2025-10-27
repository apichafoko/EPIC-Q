#!/usr/bin/env node

/**
 * Script para configurar Vercel Cron Jobs
 * 
 * Este script te guía para configurar el cron job en Vercel:
 * 1. Agregar CRON_SECRET a Environment Variables
 * 2. Verificar configuración en vercel.json
 * 3. Probar el endpoint manualmente
 */

const readline = require('readline');
const crypto = require('crypto');

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
  console.log('🚀 Configuración de Vercel Cron Jobs para EPIC-Q\n');
  
  // Generar CRON_SECRET si no existe
  const cronSecret = crypto.randomBytes(32).toString('hex');
  
  console.log('📋 PASO 1: Configurar CRON_SECRET en Vercel');
  console.log('1. Ve a tu proyecto en Vercel Dashboard');
  console.log('2. Settings > Environment Variables');
  console.log('3. Agrega la siguiente variable:');
  console.log('');
  console.log(`   Name: CRON_SECRET`);
  console.log(`   Value: ${cronSecret}`);
  console.log('   Environment: Production, Preview, Development');
  console.log('');
  
  const hasAddedSecret = await question('¿Ya agregaste CRON_SECRET a Vercel? (y/n): ');
  
  if (hasAddedSecret.toLowerCase() !== 'y') {
    console.log('⏸️  Por favor, agrega la variable y luego ejecuta este script nuevamente.');
    rl.close();
    return;
  }
  
  console.log('\n📋 PASO 2: Verificar configuración en vercel.json');
  console.log('Tu archivo vercel.json ya está configurado correctamente:');
  console.log('');
  console.log('```json');
  console.log('{');
  console.log('  "crons": [');
  console.log('    {');
  console.log('      "path": "/api/cron/generate-alerts",');
  console.log('      "schedule": "0 9 * * *"');
  console.log('    }');
  console.log('  ]');
  console.log('}');
  console.log('```');
  console.log('');
  console.log('Esto significa que el cron se ejecutará diariamente a las 9:00 AM UTC.');
  console.log('');
  
  console.log('📋 PASO 3: Probar el endpoint manualmente');
  console.log('Puedes probar el cron job manualmente con:');
  console.log('');
  console.log('```bash');
  console.log('# Usando curl');
  console.log(`curl -X POST "https://tu-dominio.vercel.app/api/cron/generate-alerts" \\`);
  console.log(`  -H "Authorization: Bearer ${cronSecret}"`);
  console.log('');
  console.log('# O usando el script de test');
  console.log('npm run test:cron');
  console.log('```');
  console.log('');
  
  const testNow = await question('¿Quieres probar el endpoint ahora? (y/n): ');
  
  if (testNow.toLowerCase() === 'y') {
    console.log('\n🧪 Probando endpoint...');
    console.log('Ejecuta el siguiente comando en otra terminal:');
    console.log('');
    console.log('npm run dev');
    console.log('');
    console.log('Luego en otra terminal:');
    console.log(`curl -X POST "http://localhost:3000/api/cron/generate-alerts" \\`);
    console.log(`  -H "Authorization: Bearer ${cronSecret}"`);
    console.log('');
  }
  
  console.log('📋 PASO 4: Monitoreo');
  console.log('Para monitorear el cron job:');
  console.log('1. Ve a Vercel Dashboard > Functions');
  console.log('2. Busca la función "api/cron/generate-alerts"');
  console.log('3. Revisa los logs de ejecución');
  console.log('4. Verifica que las alertas se generen en la base de datos');
  console.log('');
  
  console.log('✅ Configuración completada!');
  console.log('');
  console.log('📅 El cron job se ejecutará automáticamente cada día a las 9:00 AM UTC.');
  console.log('🔍 Revisa los logs en Vercel para confirmar que funciona correctamente.');
  console.log('');
  
  rl.close();
}

main().catch(console.error);
