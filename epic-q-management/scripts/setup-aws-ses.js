#!/usr/bin/env node

/**
 * Script para configurar AWS SES
 * 
 * Este script te guía paso a paso para configurar AWS SES:
 * 1. Verificar dominio o email
 * 2. Solicitar salir de sandbox mode
 * 3. Generar SMTP credentials
 * 4. Actualizar variables de entorno
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
  console.log('🚀 Configuración de AWS SES para EPIC-Q (OPCIONAL)\n');
  
  console.log('⚠️  IMPORTANTE: Este script es OPCIONAL');
  console.log('   - Para desarrollo: Usa Gmail (ya configurado)');
  console.log('   - Para producción: Solo si tienes dominio propio');
  console.log('   - Si no tienes dominio: Continúa con Gmail\n');
  
  const wantsAwsSes = await question('¿Quieres configurar AWS SES para producción? (y/n): ');
  
  if (wantsAwsSes.toLowerCase() !== 'y') {
    console.log('✅ Perfecto! El sistema usará Gmail tanto en desarrollo como en producción.');
    console.log('   - Gmail: 500 emails/día (suficiente para la mayoría de casos)');
    console.log('   - Sin configuración adicional necesaria');
    console.log('   - Funciona inmediatamente');
    rl.close();
    return;
  }
  
  console.log('\n📋 PASO 1: Verificar dominio o email en AWS SES');
  console.log('1. Ve a AWS Console > SES > Verified identities');
  console.log('2. Crea una nueva identidad:');
  console.log('   - Si tienes dominio: verifica el dominio completo');
  console.log('   - Si no tienes dominio: verifica tu email personal');
  console.log('3. Sigue las instrucciones de verificación\n');
  
  const hasVerified = await question('¿Ya tienes una identidad verificada? (y/n): ');
  
  if (hasVerified.toLowerCase() !== 'y') {
    console.log('⏸️  Por favor, verifica tu identidad primero y luego ejecuta este script nuevamente.');
    rl.close();
    return;
  }
  
  console.log('\n📋 PASO 2: Solicitar salir de Sandbox Mode');
  console.log('1. Ve a AWS Console > SES > Account dashboard');
  console.log('2. Si ves "Sandbox" en el estado, haz clic en "Request production access"');
  console.log('3. Completa el formulario explicando tu caso de uso');
  console.log('4. Mientras tanto, puedes usar emails verificados para testing\n');
  
  const inSandbox = await question('¿Estás en sandbox mode? (y/n): ');
  
  if (inSandbox.toLowerCase() === 'y') {
    console.log('⚠️  En sandbox mode solo puedes enviar a emails verificados.');
    console.log('   Para testing, agrega emails de prueba en "Verified identities".\n');
  }
  
  console.log('📋 PASO 3: Generar SMTP Credentials');
  console.log('1. Ve a AWS Console > SES > SMTP settings');
  console.log('2. Haz clic en "Create SMTP credentials"');
  console.log('3. Descarga el archivo CSV con las credenciales\n');
  
  const smtpUser = await question('Ingresa tu SMTP Username: ');
  const smtpPass = await question('Ingresa tu SMTP Password: ');
  const region = await question('Ingresa tu región AWS (ej: us-east-1): ');
  
  console.log('\n📋 PASO 4: Actualizar variables de entorno');
  console.log('Agrega estas variables a tu archivo .env.local o .env:');
  console.log('');
  console.log('# AWS SES Configuration');
  console.log(`EMAIL_PROVIDER=aws_ses`);
  console.log(`AWS_SES_SMTP_HOST=email-smtp.${region}.amazonaws.com`);
  console.log(`AWS_SES_SMTP_PORT=587`);
  console.log(`AWS_SES_SMTP_USER=${smtpUser}`);
  console.log(`AWS_SES_SMTP_PASS=${smtpPass}`);
  console.log(`AWS_SES_REGION=${region}`);
  console.log('');
  
  console.log('📋 PASO 5: Configurar en Vercel (para producción)');
  console.log('1. Ve a tu proyecto en Vercel Dashboard');
  console.log('2. Settings > Environment Variables');
  console.log('3. Agrega las mismas variables para Production, Preview y Development');
  console.log('');
  
  console.log('✅ Configuración completada!');
  console.log('');
  console.log('🧪 Para probar:');
  console.log('1. npm run dev');
  console.log('2. Ve a la sección de notificaciones');
  console.log('3. Envía una notificación de prueba');
  console.log('');
  
  console.log('📊 Monitoreo:');
  console.log('- Ve a AWS Console > SES > Sending statistics');
  console.log('- Revisa bounces, complaints y delivery rate');
  console.log('');
  
  rl.close();
}

main().catch(console.error);
