import { EmailService } from '../src/lib/notifications/email-service.js';
import { EmailTemplateService } from '../src/lib/notifications/email-template-service.js';

async function testCoordinatorInvitation() {
  try {
    console.log('🧪 Probando template de invitación para coordinadores...');

    // Obtener el template
    const template = await EmailTemplateService.getTemplateByName('coordinator_invitation');
    
    if (!template) {
      console.error('❌ Template no encontrado');
      return;
    }

    console.log('✅ Template encontrado:', template.name);

    // Datos de prueba
    const testData = {
      userName: 'Dr. Juan Pérez',
      userEmail: 'test@example.com',
      projectName: 'Proyecto EPIC-Q 2024',
      hospitalName: 'Hospital de Prueba',
      requiredPeriods: 2,
      projectDescription: 'Estudio Perioperatorio Integral de Cuidados Quirúrgicos',
      invitationLink: 'http://localhost:3000/es/auth/login',
      temporaryPassword: 'TempPass123!'
    };

    // Procesar el template
    const processed = EmailTemplateService.processTemplate(template, testData);
    
    console.log('✅ Template procesado exitosamente');
    console.log('📧 Asunto:', processed.subject);
    console.log('📄 Contenido HTML (primeros 200 caracteres):', processed.body.substring(0, 200) + '...');
    
    // Verificar que contiene las credenciales
    if (processed.body.includes('TempPass123!')) {
      console.log('✅ Contraseña temporal encontrada en el template');
    } else {
      console.log('❌ Contraseña temporal NO encontrada en el template');
    }

    if (processed.body.includes('test@example.com')) {
      console.log('✅ Email encontrado en el template');
    } else {
      console.log('❌ Email NO encontrado en el template');
    }

    // Probar el servicio de email (sin enviar realmente)
    const emailService = new EmailService();
    console.log('✅ Servicio de email inicializado correctamente');

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testCoordinatorInvitation()
    .then(() => {
      console.log('🎉 Prueba completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error en la prueba:', error);
      process.exit(1);
    });
}

module.exports = { testCoordinatorInvitation };
