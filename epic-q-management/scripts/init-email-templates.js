const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function initEmailTemplates() {
  try {
    console.log('🚀 Inicializando templates de email...');

    // Verificar si ya existen templates
    const existingTemplates = await prisma.emailTemplate.findMany();
    
    if (existingTemplates.length > 0) {
      console.log('✅ Los templates de email ya existen en la base de datos.');
      return;
    }

    // Crear templates por defecto
    const defaultTemplates = [
      {
        name: 'user_invitation',
        subject: 'Invitación para unirse a EPIC-Q - {{systemName}}',
        body: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Invitación a EPIC-Q</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>¡Bienvenido a {{systemName}}!</h1>
        </div>
        <div class="content">
            <h2>Hola {{userName}},</h2>
            <p>Has sido invitado a unirte al sistema de gestión de EPIC-Q como <strong>{{userRole}}</strong>.</p>
            
            {{#if hospitalName}}
            <p><strong>Hospital asignado:</strong> {{hospitalName}}</p>
            {{/if}}
            
            <p>Para completar tu registro y establecer tu contraseña, haz clic en el siguiente enlace:</p>
            
            <div style="text-align: center;">
                <a href="{{invitationLink}}" class="button">Completar Registro</a>
            </div>
            
            <p><strong>Importante:</strong> Este enlace expirará en 7 días por motivos de seguridad.</p>
            
            <p>Si no solicitaste esta invitación, puedes ignorar este email.</p>
            
            <p>Saludos cordiales,<br>
            El equipo de {{systemName}}</p>
        </div>
        <div class="footer">
            <p>Este es un email automático, por favor no respondas a este mensaje.</p>
        </div>
    </div>
</body>
</html>`,
        variables: {
          userName: 'string',
          userEmail: 'string',
          userRole: 'string',
          hospitalName: 'string',
          invitationLink: 'string',
          systemName: 'string'
        },
        category: 'invitation',
        is_active: true,
        usage_count: 0
      },
      {
        name: 'password_reset',
        subject: 'Restablecer contraseña - {{systemName}}',
        body: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Restablecer Contraseña</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Restablecer Contraseña</h1>
        </div>
        <div class="content">
            <h2>Hola {{userName}},</h2>
            <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en {{systemName}}.</p>
            
            <p>Si solicitaste este cambio, haz clic en el siguiente enlace para crear una nueva contraseña:</p>
            
            <div style="text-align: center;">
                <a href="{{resetLink}}" class="button">Restablecer Contraseña</a>
            </div>
            
            <p><strong>Importante:</strong> Este enlace expirará en 1 hora por motivos de seguridad.</p>
            
            <p>Si no solicitaste este cambio, puedes ignorar este email. Tu contraseña actual seguirá siendo válida.</p>
            
            <p>Saludos cordiales,<br>
            El equipo de {{systemName}}</p>
        </div>
        <div class="footer">
            <p>Este es un email automático, por favor no respondas a este mensaje.</p>
        </div>
    </div>
</body>
</html>`,
        variables: {
          userName: 'string',
          userEmail: 'string',
          resetLink: 'string',
          systemName: 'string'
        },
        category: 'password_reset',
        is_active: true,
        usage_count: 0
      }
    ];

    // Crear cada template
    for (const templateData of defaultTemplates) {
      const template = await prisma.emailTemplate.create({
        data: templateData
      });
      console.log(`✅ Template creado: ${template.name}`);
    }

    console.log('🎉 Templates de email inicializados correctamente!');

  } catch (error) {
    console.error('❌ Error inicializando templates de email:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  initEmailTemplates()
    .then(() => {
      console.log('✅ Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en el script:', error);
      process.exit(1);
    });
}

module.exports = { initEmailTemplates };
