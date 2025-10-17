#!/usr/bin/env node

const { EmailService } = require('../src/lib/notifications/email-service');

async function testEmailDev() {
  console.log('🧪 Probando envío de email en modo desarrollo...\n');
  
  try {
    // Simular envío de email de invitación
    const result = await EmailService.sendInvitationEmail(
      'test@example.com',
      'test-token-123',
      'Hospital Test',
      'Usuario Test',
      'Coordinador',
      'TempPass123'
    );
    
    console.log('✅ Email simulado enviado correctamente');
    console.log('📧 Resultado:', result);
    console.log('\n📝 En modo desarrollo, los emails se muestran en consola pero no se envían realmente');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testEmailDev();
