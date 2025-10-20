const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateLogoInTemplates() {
  console.log('🔧 Actualizando logos en templates...');

  try {
    // Buscar templates que contengan el logo hardcodeado
    const templates = await prisma.communicationTemplate.findMany({
      where: {
        email_body: {
          contains: 'EQ'
        }
      }
    });

    console.log(`📧 Encontrados ${templates.length} templates con posible logo hardcodeado`);

    for (const template of templates) {
      console.log(`🔍 Procesando: ${template.name}`);
      
      if (template.email_body && template.email_body.includes('<div class="logo">EQ</div>')) {
        console.log('  ✅ Encontrado logo hardcodeado, reemplazando...');
        
        const updatedBody = template.email_body.replace(
          /<div class="logo">EQ<\/div>/g,
          '<img src="{{logoUrl}}" alt="EPIC-Q Logo" class="logo" />'
        );

        await prisma.communicationTemplate.update({
          where: { id: template.id },
          data: { 
            email_body: updatedBody,
            variables: [...(template.variables || []), 'logoUrl']
          }
        });

        console.log('  ✅ Template actualizado');
      } else {
        console.log('  ℹ️ No se encontró logo hardcodeado');
      }
    }

    console.log('🎉 Proceso completado!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateLogoInTemplates();
