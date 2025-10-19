const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function createCoordinatorInvitationTemplate() {
  try {
    console.log('🚀 Creando template de invitación para coordinadores...');

    // Leer los archivos de template
    const htmlTemplate = fs.readFileSync(
      path.join(__dirname, '../src/lib/notifications/templates/coordinator-invitation-template.html'),
      'utf8'
    );
    
    const textTemplate = fs.readFileSync(
      path.join(__dirname, '../src/lib/notifications/templates/coordinator-invitation-template.txt'),
      'utf8'
    );

    // Buscar si ya existe un template con este nombre
    const existingTemplate = await prisma.emailTemplate.findFirst({
      where: { name: 'coordinator_invitation' }
    });

    let template;
    if (existingTemplate) {
      // Actualizar template existente
      template = await prisma.emailTemplate.update({
        where: { id: existingTemplate.id },
        data: {
          subject: 'Invitación al Proyecto {{projectName}} - EPIC-Q',
          body: htmlTemplate,
          variables: [
            'userName',
            'userEmail', 
            'projectName',
            'hospitalName',
            'requiredPeriods',
            'projectDescription',
            'invitationLink',
            'temporaryPassword'
          ],
          updated_at: new Date()
        }
      });
    } else {
      // Crear nuevo template
      template = await prisma.emailTemplate.create({
        data: {
          name: 'coordinator_invitation',
          subject: 'Invitación al Proyecto {{projectName}} - EPIC-Q',
          body: htmlTemplate,
          variables: [
            'userName',
            'userEmail',
            'projectName', 
            'hospitalName',
            'requiredPeriods',
            'projectDescription',
            'invitationLink',
            'temporaryPassword'
          ],
          is_active: true,
          usage_count: 0
        }
      });
    }

    console.log('✅ Template de invitación para coordinadores creado exitosamente:');
    console.log(`   - ID: ${template.id}`);
    console.log(`   - Nombre: ${template.name}`);
    console.log(`   - Asunto: ${template.subject}`);
    console.log(`   - Variables: ${template.variables.join(', ')}`);
    console.log(`   - Activo: ${template.is_active}`);

  } catch (error) {
    console.error('❌ Error creando template de invitación para coordinadores:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createCoordinatorInvitationTemplate()
    .then(() => {
      console.log('🎉 Proceso completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error en el proceso:', error);
      process.exit(1);
    });
}

module.exports = { createCoordinatorInvitationTemplate };
