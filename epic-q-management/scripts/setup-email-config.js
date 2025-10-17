const fs = require('fs');
const path = require('path');

console.log('🔧 Configurando variables de entorno para email...');

// Configuración de email para testing
const emailConfig = `
# ===========================================
# CONFIGURACIÓN DE EMAIL
# ===========================================

# Configuración SMTP para Gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu-app-password
EMAIL_FROM=EPIC-Q System <noreply@epicq.com>
EMAIL_FROM_NAME=EPIC-Q Management System

# Configuración de seguridad
EMAIL_SECURE=false
EMAIL_TLS=true

# Configuración de templates
EMAIL_TEMPLATES_ENABLED=true
DEFAULT_INVITATION_TEMPLATE=user_invitation
DEFAULT_PASSWORD_RESET_TEMPLATE=password_reset

# ===========================================
# CONFIGURACIÓN DE LA APLICACIÓN
# ===========================================

NEXTAUTH_URL=http://localhost:3001
`;

// Crear archivo .env.local
const envPath = path.join(__dirname, '..', '.env.local');
fs.writeFileSync(envPath, emailConfig);

console.log('✅ Archivo .env.local creado con configuración de email');
console.log('');
console.log('📝 IMPORTANTE: Necesitas configurar las siguientes variables:');
console.log('');
console.log('1. EMAIL_USER: Tu email de Gmail');
console.log('2. EMAIL_PASS: Tu contraseña de aplicación de Gmail');
console.log('');
console.log('🔐 Para obtener la contraseña de aplicación de Gmail:');
console.log('1. Ve a tu cuenta de Google');
console.log('2. Seguridad > Verificación en 2 pasos');
console.log('3. Contraseñas de aplicaciones');
console.log('4. Genera una nueva contraseña para "EPIC-Q"');
console.log('');
console.log('📧 Una vez configurado, los emails se enviarán correctamente.');
