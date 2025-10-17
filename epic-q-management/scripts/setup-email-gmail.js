#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
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

async function setupEmailConfig() {
  console.log('🔧 Configuración de Email para Gmail');
  console.log('=====================================\n');
  
  console.log('📋 Pasos previos necesarios:');
  console.log('1. Habilitar autenticación de 2 factores en tu cuenta de Gmail');
  console.log('2. Generar una contraseña de aplicación:');
  console.log('   - Ve a: https://myaccount.google.com/security');
  console.log('   - Busca "Contraseñas de aplicaciones"');
  console.log('   - Genera una nueva contraseña para "EPIC-Q Management"');
  console.log('   - Copia la contraseña generada (16 caracteres)\n');
  
  const email = await question('📧 Ingresa tu email de Gmail: ');
  const appPassword = await question('🔑 Ingresa la contraseña de aplicación (16 caracteres): ');
  
  if (!email || !appPassword) {
    console.log('❌ Error: Email y contraseña son requeridos');
    process.exit(1);
  }
  
  if (appPassword.length !== 16) {
    console.log('⚠️  Advertencia: La contraseña de aplicación debe tener 16 caracteres');
  }
  
  // Leer el archivo .env.local actual
  const envPath = path.join(__dirname, '..', '.env.local');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  // Actualizar las variables de email
  const emailConfig = `# ===========================================
# CONFIGURACIÓN DE LA APLICACIÓN
# ===========================================

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=tu-secret-key-aqui

# ===========================================
# CONFIGURACIÓN DE EMAIL (GMAIL)
# ===========================================

# Configuración SMTP para Gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=${email}
EMAIL_PASS=${appPassword}
EMAIL_FROM=EPIC-Q System <${email}>
EMAIL_FROM_NAME=EPIC-Q Management System

# Configuración de seguridad
EMAIL_SECURE=false
EMAIL_TLS=true

# Configuración de templates
EMAIL_TEMPLATES_ENABLED=true
DEFAULT_INVITATION_TEMPLATE=user_invitation
DEFAULT_PASSWORD_RESET_TEMPLATE=password_reset

# ===========================================
# CONFIGURACIÓN DE BASE DE DATOS
# ===========================================

# Usar la configuración existente si existe
DATABASE_URL=postgresql://postgres:password@localhost:5432/epicq_db?schema=public
`;

  // Escribir el archivo .env.local
  fs.writeFileSync(envPath, emailConfig);
  
  console.log('\n✅ Configuración de email actualizada');
  console.log(`📧 Email: ${email}`);
  console.log('🔑 Contraseña de aplicación: [CONFIGURADA]');
  console.log('\n📝 Archivo actualizado: .env.local');
  console.log('\n🔄 Reinicia el servidor para aplicar los cambios:');
  console.log('   npm run dev');
  
  rl.close();
}

setupEmailConfig().catch(console.error);
