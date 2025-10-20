const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

function getLogoBase64() {
  try {
    const logoPath = path.join(__dirname, '..', 'public', 'logo-email.svg');
    const logoBuffer = fs.readFileSync(logoPath);
    const base64Logo = logoBuffer.toString('base64');
    return `data:image/svg+xml;base64,${base64Logo}`;
  } catch (error) {
    console.error('Error loading logo:', error);
    return '';
  }
}

async function updateTemplatesWithLogo() {
  console.log('🚀 Actualizando templates con el nuevo logo...');

  try {
    // Obtener el logo en base64
    const logoUrl = getLogoBase64();
    console.log('✅ Logo base64 obtenido');

    // Actualizar templates de comunicación
    const communicationTemplates = await prisma.communicationTemplate.findMany({
      where: {
        type: {
          in: ['email', 'both']
        }
      }
    });

    console.log(`📧 Encontrados ${communicationTemplates.length} templates de comunicación`);

    for (const template of communicationTemplates) {
      if (template.email_body && template.email_body.includes('{{logoUrl}}')) {
        // Reemplazar {{logoUrl}} con el logo real
        const updatedBody = template.email_body.replace(/\{\{logoUrl\}\}/g, logoUrl);
        
        await prisma.communicationTemplate.update({
          where: { id: template.id },
          data: { email_body: updatedBody }
        });
        
        console.log(`✅ Template actualizado: ${template.name}`);
      }
    }

    // Actualizar templates de email
    const emailTemplates = await prisma.emailTemplate.findMany();

    console.log(`📧 Encontrados ${emailTemplates.length} templates de email`);

    for (const template of emailTemplates) {
      if (template.body && template.body.includes('{{logoUrl}}')) {
        // Reemplazar {{logoUrl}} con el logo real
        const updatedBody = template.body.replace(/\{\{logoUrl\}\}/g, logoUrl);
        
        await prisma.emailTemplate.update({
          where: { id: template.id },
          data: { body: updatedBody }
        });
        
        console.log(`✅ Template de email actualizado: ${template.name}`);
      }
    }

    console.log('🎉 Todos los templates han sido actualizados con el nuevo logo!');

  } catch (error) {
    console.error('❌ Error al actualizar templates:', error);
    throw error;
  }
}

updateTemplatesWithLogo()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('✅ Script completado exitosamente');
  });
