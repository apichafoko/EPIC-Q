const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function initCommunicationTemplates() {
  console.log('🚀 Inicializando templates de comunicación...');

  const defaultTemplates = [
    {
      name: 'bienvenida_coordinador',
      description: 'Mensaje de bienvenida para nuevos coordinadores',
      type: 'both',
      internal_subject: '¡Bienvenido al sistema EPIC-Q!',
      internal_body: `¡Hola {{userName}}!

Bienvenido al sistema de gestión del Estudio Perioperatorio Integral de Cuidados Quirúrgicos (EPIC-Q).

Como coordinador del hospital {{hospitalName}}, podrás:
• Gestionar la información de tu hospital
• Seguir el progreso del estudio
• Comunicarte con el equipo de investigación
• Acceder a reportes y estadísticas

Si tienes alguna pregunta, no dudes en contactarnos.

¡Esperamos trabajar contigo!`,
      email_subject: 'Bienvenido al sistema EPIC-Q - {{hospitalName}}',
      email_body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">EPIC-Q Management System</h1>
            <p style="margin: 5px 0 0 0;">Sistema de Gestión</p>
          </div>

          <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #1f2937; margin-top: 0;">¡Bienvenido, {{userName}}!</h2>

            <p style="color: #4b5563; line-height: 1.6;">
              Has sido designado como coordinador del hospital <strong>{{hospitalName}}</strong>
              en el Estudio Perioperatorio Integral de Cuidados Quirúrgicos (EPIC-Q).
            </p>

            <p style="color: #4b5563; line-height: 1.6;">
              Como coordinador, podrás:
            </p>
            <ul style="color: #4b5563; line-height: 1.6;">
              <li>Gestionar la información de tu hospital</li>
              <li>Seguir el progreso del estudio</li>
              <li>Comunicarte con el equipo de investigación</li>
              <li>Acceder a reportes y estadísticas</li>
            </ul>

            <div style="text-align: center; margin: 30px 0;">
              <a href="{{loginUrl}}"
                 style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
                Acceder al Sistema
              </a>
            </div>

            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              Si tienes alguna pregunta, no dudes en contactarnos.
            </p>

            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">

            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
              Este es un mensaje automático de EPIC-Q Management System. No respondas a este correo.
            </p>
          </div>
        </div>
      `,
      variables: ['userName', 'hospitalName', 'loginUrl'],
      category: 'Bienvenida',
      is_active: true,
    },
    {
      name: 'recordatorio_progreso',
      description: 'Recordatorio para actualizar el progreso del estudio',
      type: 'internal',
      internal_subject: 'Recordatorio: Actualizar progreso del estudio',
      internal_body: `Hola {{userName}},

Te recordamos que es importante mantener actualizado el progreso del estudio EPIC-Q en tu hospital {{hospitalName}}.

Por favor, revisa y actualiza:
• Estado de los casos en seguimiento
• Información de contacto actualizada
• Cualquier cambio en el equipo de trabajo

Tu participación es fundamental para el éxito del estudio.

¡Gracias por tu dedicación!`,
      variables: ['userName', 'hospitalName'],
      category: 'Recordatorio',
      is_active: true,
    },
    {
      name: 'notificacion_cambio_estado',
      description: 'Notificación cuando cambia el estado de un caso',
      type: 'both',
      internal_subject: 'Cambio de estado en caso EPIC-Q',
      internal_body: `Hola {{userName}},

Se ha registrado un cambio de estado en el caso {{caseId}} del hospital {{hospitalName}}.

Nuevo estado: {{newStatus}}
Fecha: {{changeDate}}

{{additionalInfo}}

Por favor, revisa los detalles en el sistema.`,
      email_subject: 'Cambio de estado - Caso EPIC-Q {{caseId}}',
      email_body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">EPIC-Q - Notificación</h1>
            <p style="margin: 5px 0 0 0;">Cambio de Estado</p>
          </div>

          <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #1f2937; margin-top: 0;">Cambio de Estado Registrado</h2>

            <p style="color: #4b5563; line-height: 1.6;">
              Hola {{userName}},
            </p>

            <p style="color: #4b5563; line-height: 1.6;">
              Se ha registrado un cambio de estado en el caso <strong>{{caseId}}</strong> 
              del hospital <strong>{{hospitalName}}</strong>.
            </p>

            <div style="background-color: white; padding: 20px; border-radius: 6px; border-left: 4px solid #f59e0b; margin: 20px 0;">
              <p style="margin: 0; font-weight: 600; color: #1f2937;">Nuevo Estado:</p>
              <p style="margin: 5px 0 0 0; color: #4b5563;">{{newStatus}}</p>
              <p style="margin: 10px 0 0 0; font-size: 14px; color: #6b7280;">Fecha: {{changeDate}}</p>
            </div>

            <p style="color: #4b5563; line-height: 1.6;">
              {{additionalInfo}}
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="{{systemUrl}}"
                 style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
                Ver Detalles
              </a>
            </div>

            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">

            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
              Este es un mensaje automático de EPIC-Q Management System.
            </p>
          </div>
        </div>
      `,
      variables: ['userName', 'hospitalName', 'caseId', 'newStatus', 'changeDate', 'additionalInfo', 'systemUrl'],
      category: 'Notificación',
      is_active: true,
    },
    {
      name: 'invitacion_reunion',
      description: 'Invitación a reunión de coordinadores',
      type: 'email',
      email_subject: 'Invitación a reunión de coordinadores EPIC-Q',
      email_body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #7c3aed; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">EPIC-Q Management System</h1>
            <p style="margin: 5px 0 0 0;">Reunión de Coordinadores</p>
          </div>

          <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #1f2937; margin-top: 0;">Invitación a Reunión</h2>

            <p style="color: #4b5563; line-height: 1.6;">
              Hola {{userName}},
            </p>

            <p style="color: #4b5563; line-height: 1.6;">
              Te invitamos a participar en la próxima reunión de coordinadores del estudio EPIC-Q.
            </p>

            <div style="background-color: white; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #1f2937;">Detalles de la Reunión</h3>
              <p style="margin: 5px 0; color: #4b5563;"><strong>Fecha:</strong> {{meetingDate}}</p>
              <p style="margin: 5px 0; color: #4b5563;"><strong>Hora:</strong> {{meetingTime}}</p>
              <p style="margin: 5px 0; color: #4b5563;"><strong>Modalidad:</strong> {{meetingType}}</p>
              <p style="margin: 5px 0; color: #4b5563;"><strong>Duración:</strong> {{meetingDuration}}</p>
            </div>

            <p style="color: #4b5563; line-height: 1.6;">
              <strong>Agenda:</strong>
            </p>
            <ul style="color: #4b5563; line-height: 1.6;">
              <li>Revisión del progreso general del estudio</li>
              <li>Actualizaciones de protocolos</li>
              <li>Casos especiales y consultas</li>
              <li>Próximos pasos y objetivos</li>
            </ul>

            <div style="text-align: center; margin: 30px 0;">
              <a href="{{meetingLink}}"
                 style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
                Unirse a la Reunión
              </a>
            </div>

            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              Si no puedes asistir, por favor confírmanos tu ausencia respondiendo a este correo.
            </p>

            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">

            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
              Este es un mensaje automático de EPIC-Q Management System.
            </p>
          </div>
        </div>
      `,
      variables: ['userName', 'meetingDate', 'meetingTime', 'meetingType', 'meetingDuration', 'meetingLink'],
      category: 'Reunión',
      is_active: true,
    }
  ];

  for (const templateData of defaultTemplates) {
    const existingTemplate = await prisma.communicationTemplate.findUnique({
      where: { name: templateData.name },
    });

    if (!existingTemplate) {
      await prisma.communicationTemplate.create({
        data: templateData,
      });
      console.log(`✅ Template creado: ${templateData.name}`);
    } else {
      console.log(`ℹ️ Template ya existe: ${templateData.name}`);
    }
  }

  console.log('🎉 Templates de comunicación inicializados correctamente!');
}

initCommunicationTemplates()
  .catch((e) => {
    console.error('❌ Error al inicializar templates de comunicación:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('✅ Script completado exitosamente');
  });
