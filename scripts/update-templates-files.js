const fs = require('fs');
const path = require('path');

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

async function updateTemplateFiles() {
  console.log('🚀 Actualizando archivos de templates con el nuevo logo...');

  try {
    // Obtener el logo en base64
    const logoUrl = getLogoBase64();
    console.log('✅ Logo base64 obtenido');

    // Lista de archivos de templates a actualizar
    const templateFiles = [
      'scripts/init-communication-templates.js',
      'scripts/create-welcome-templates.js',
      'scripts/init-email-templates.js'
    ];

    for (const filePath of templateFiles) {
      const fullPath = path.join(__dirname, '..', filePath);
      
      if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        
        // Reemplazar {{logoUrl}} con el logo real
        if (content.includes('{{logoUrl}}')) {
          content = content.replace(/\{\{logoUrl\}\}/g, logoUrl);
          
          fs.writeFileSync(fullPath, content, 'utf8');
          console.log(`✅ Archivo actualizado: ${filePath}`);
        } else {
          console.log(`ℹ️ No se encontró {{logoUrl}} en: ${filePath}`);
        }
      } else {
        console.log(`⚠️ Archivo no encontrado: ${filePath}`);
      }
    }

    console.log('🎉 Todos los archivos de templates han sido actualizados!');

  } catch (error) {
    console.error('❌ Error al actualizar archivos:', error);
    throw error;
  }
}

updateTemplateFiles()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(() => {
    console.log('✅ Script completado exitosamente');
  });
