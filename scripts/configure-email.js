const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('📧 Configuración de Email para EPIC-Q');
console.log('=====================================\n');

console.log('Para que los emails funcionen, necesitas configurar Gmail:');
console.log('');
console.log('1. Ve a tu cuenta de Google (https://myaccount.google.com/)');
console.log('2. Seguridad > Verificación en 2 pasos (debe estar activada)');
console.log('3. Contraseñas de aplicaciones');
console.log('4. Genera una nueva contraseña para "EPIC-Q"');
console.log('');

rl.question('¿Tu email de Gmail: ', (email) => {
  rl.question('¿Contraseña de aplicación de Gmail: ', (password) => {
    rl.question('¿Nombre del remitente (opcional, presiona Enter para usar "EPIC-Q Management"): ', (fromName) => {
      
      const emailConfig = `# ===========================================
# CONFIGURACIÓN DE EMAIL
# ===========================================

# Configuración SMTP para Gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=${email}
EMAIL_PASS=${password}
EMAIL_FROM=EPIC-Q System <noreply@epicq.com>
EMAIL_FROM_NAME=${fromName || 'EPIC-Q Management System'}

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

      console.log('\n✅ Archivo .env.local actualizado con tu configuración');
      console.log('🔄 Reinicia el servidor para que los cambios tomen efecto');
      console.log('');
      console.log('📧 Ahora los emails se enviarán correctamente!');
      
      rl.close();
    });
  });
});
