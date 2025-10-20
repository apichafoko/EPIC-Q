const fs = require('fs');
const path = require('path');

// Función para obtener el logo en base64
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

// Función para actualizar un template específico
async function updateTemplateLogo(templateName, logoUrl) {
  try {
    const response = await fetch(`http://localhost:3000/api/admin/communication-templates`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const templates = await response.json();
    console.log(`📧 Encontrados ${templates.length} templates`);

    // Buscar el template específico
    const template = templates.find(t => t.name === templateName);
    
    if (!template) {
      console.log(`❌ Template '${templateName}' no encontrado`);
      return;
    }

    console.log(`🔍 Procesando template: ${template.name}`);

    if (template.email_body && template.email_body.includes('<div class="logo">EQ</div>')) {
      console.log('  ✅ Encontrado logo hardcodeado, reemplazando...');
      
      const updatedBody = template.email_body.replace(
        /<div class="logo">EQ<\/div>/g,
        `<img src="{{logoUrl}}" alt="EPIC-Q Logo" class="logo" />`
      );

      // Actualizar el template
      const updateResponse = await fetch(`http://localhost:3000/api/admin/communication-templates/${template.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...template,
          email_body: updatedBody,
          variables: [...(template.variables || []), 'logoUrl']
        })
      });

      if (updateResponse.ok) {
        console.log('  ✅ Template actualizado exitosamente');
      } else {
        console.log('  ❌ Error al actualizar template:', updateResponse.status);
      }
    } else {
      console.log('  ℹ️ No se encontró logo hardcodeado en este template');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Función principal
async function fixTemplateLogos() {
  console.log('🔧 Corrigiendo logos en templates...');

  const logoUrl = getLogoBase64();
  console.log('✅ Logo base64 obtenido');

  // Lista de templates que podrían tener el logo hardcodeado
  const templateNames = [
    'coordinator_invitation',
    'bienvenida_coordinador',
    'invitacion_reunion',
    'notificacion_cambio_estado'
  ];

  for (const templateName of templateNames) {
    await updateTemplateLogo(templateName, logoUrl);
  }

  console.log('🎉 Proceso completado!');
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  fixTemplateLogos().catch(console.error);
}

module.exports = { fixTemplateLogos, updateTemplateLogo };
