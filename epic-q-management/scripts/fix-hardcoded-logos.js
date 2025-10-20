const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Inicializar Prisma con configuración explícita
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

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

async function fixHardcodedLogos() {
  console.log('🔧 Corrigiendo logos hardcodeados en templates...');

  try {
    const logoUrl = getLogoBase64();
    console.log('✅ Logo base64 obtenido');

    // Buscar templates que tengan el logo hardcodeado "EQ"
    const templatesWithHardcodedLogo = await prisma.communicationTemplate.findMany({
      where: {
        OR: [
          {
            email_body: {
              contains: '<div class="logo">EQ</div>'
            }
          },
          {
            email_body: {
              contains: 'class="logo">EQ'
            }
          },
          {
            email_body: {
              contains: 'logo">EQ'
            }
          }
        ]
      }
    });

    console.log(`📧 Encontrados ${templatesWithHardcodedLogo.length} templates con logo hardcodeado`);

    for (const template of templatesWithHardcodedLogo) {
      console.log(`🔍 Procesando template: ${template.name}`);
      
      let updatedBody = template.email_body;
      
      // Reemplazar diferentes variaciones del logo hardcodeado
      const patterns = [
        /<div class="logo">EQ<\/div>/g,
        /<div class="logo">EQ<\/div>/g,
        /class="logo">EQ<\/div>/g,
        /logo">EQ<\/div>/g
      ];

      patterns.forEach(pattern => {
        if (updatedBody.match(pattern)) {
          updatedBody = updatedBody.replace(pattern, `<img src="{{logoUrl}}" alt="EPIC-Q Logo" class="logo" />`);
          console.log(`  ✅ Reemplazado patrón: ${pattern}`);
        }
      });

      // Actualizar el template en la base de datos
      await prisma.communicationTemplate.update({
        where: { id: template.id },
        data: { 
          email_body: updatedBody,
          variables: [...(template.variables || []), 'logoUrl']
        }
      });

      console.log(`  ✅ Template actualizado: ${template.name}`);
    }

    // También buscar en templates de email
    const emailTemplatesWithHardcodedLogo = await prisma.emailTemplate.findMany({
      where: {
        OR: [
          {
            body: {
              contains: '<div class="logo">EQ</div>'
            }
          },
          {
            body: {
              contains: 'class="logo">EQ'
            }
          },
          {
            body: {
              contains: 'logo">EQ'
            }
          }
        ]
      }
    });

    console.log(`📧 Encontrados ${emailTemplatesWithHardcodedLogo.length} templates de email con logo hardcodeado`);

    for (const template of emailTemplatesWithHardcodedLogo) {
      console.log(`🔍 Procesando template de email: ${template.name}`);
      
      let updatedBody = template.body;
      
      // Reemplazar diferentes variaciones del logo hardcodeado
      const patterns = [
        /<div class="logo">EQ<\/div>/g,
        /<div class="logo">EQ<\/div>/g,
        /class="logo">EQ<\/div>/g,
        /logo">EQ<\/div>/g
      ];

      patterns.forEach(pattern => {
        if (updatedBody.match(pattern)) {
          updatedBody = updatedBody.replace(pattern, `<img src="{{logoUrl}}" alt="EPIC-Q Logo" class="logo" />`);
          console.log(`  ✅ Reemplazado patrón: ${pattern}`);
        }
      });

      // Actualizar el template en la base de datos
      await prisma.emailTemplate.update({
        where: { id: template.id },
        data: { 
          body: updatedBody,
          variables: [...(template.variables || []), 'logoUrl']
        }
      });

      console.log(`  ✅ Template de email actualizado: ${template.name}`);
    }

    console.log('🎉 Todos los logos hardcodeados han sido corregidos!');

  } catch (error) {
    console.error('❌ Error al corregir logos hardcodeados:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixHardcodedLogos()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  });
