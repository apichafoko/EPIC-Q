const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function regenerateTemplates() {
  console.log('🚀 Regenerando templates con el nuevo logo...');

  try {
    // Ejecutar scripts de inicialización
    console.log('📧 Inicializando templates de comunicación...');
    require('./init-communication-templates.js');
    
    console.log('📧 Inicializando templates de email...');
    require('./init-email-templates.js');
    
    console.log('📧 Creando templates de bienvenida...');
    require('./create-welcome-templates.js');

    console.log('🎉 Todos los templates han sido regenerados con el nuevo logo!');

  } catch (error) {
    console.error('❌ Error al regenerar templates:', error);
    throw error;
  }
}

regenerateTemplates()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('✅ Script completado exitosamente');
  });
