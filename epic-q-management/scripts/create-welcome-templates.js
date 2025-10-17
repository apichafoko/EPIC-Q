const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createWelcomeTemplates() {
  console.log('🚀 Creando templates de bienvenida...');

  const welcomeTemplates = [
    {
      name: 'bienvenida_email_completo',
      description: 'Email de bienvenida completo con instrucciones de acceso, PWA y credenciales temporales',
      type: 'email',
      email_subject: '¡Bienvenido a EPIC-Q! - Acceso y Configuración',
      email_body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h1 style="margin: 0; font-size: 28px; font-weight: 700;">🏥 EPIC-Q Management</h1>
            <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">Sistema de Gestión del Estudio Perioperatorio</p>
          </div>

          <!-- Main Content -->
          <div style="background-color: white; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #1f2937; margin-top: 0; font-size: 24px;">¡Bienvenido, {{userName}}!</h2>
            
            <p style="color: #4b5563; line-height: 1.6; font-size: 16px; margin-bottom: 20px;">
              Has sido registrado como <strong>{{userRole}}</strong> del hospital <strong>{{hospitalName}}</strong> 
              en el Estudio Perioperatorio Integral de Cuidados Quirúrgicos (EPIC-Q).
            </p>

            <!-- Credenciales de Acceso -->
            <div style="background-color: #f0f9ff; border: 2px solid #0ea5e9; border-radius: 8px; padding: 20px; margin: 25px 0;">
              <h3 style="color: #0c4a6e; margin-top: 0; font-size: 18px; display: flex; align-items: center;">
                🔐 Credenciales de Acceso
              </h3>
              <div style="background-color: white; padding: 15px; border-radius: 6px; margin-top: 10px;">
                <p style="margin: 5px 0; font-family: 'Courier New', monospace; font-size: 14px;">
                  <strong>Email:</strong> {{userEmail}}<br>
                  <strong>Contraseña temporal:</strong> <span style="background-color: #fef3c7; padding: 2px 6px; border-radius: 4px; font-weight: bold;">{{temporaryPassword}}</span>
                </p>
              </div>
              <p style="color: #0c4a6e; font-size: 14px; margin: 10px 0 0 0;">
                ⚠️ <strong>Importante:</strong> Cambia tu contraseña en tu primer acceso por seguridad.
              </p>
            </div>

            <!-- Botón de Acceso -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{loginUrl}}" 
                 style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">
                🚀 Acceder al Sistema
              </a>
            </div>

            <!-- Instrucciones PWA -->
            <div style="background-color: #f0fdf4; border: 2px solid #22c55e; border-radius: 8px; padding: 20px; margin: 25px 0;">
              <h3 style="color: #14532d; margin-top: 0; font-size: 18px; display: flex; align-items: center;">
                📱 Instalar como Aplicación (PWA)
              </h3>
              <p style="color: #166534; margin: 10px 0; font-size: 14px;">
                Para una mejor experiencia, puedes instalar EPIC-Q como una aplicación en tu dispositivo:
              </p>
              <ul style="color: #166534; font-size: 14px; margin: 10px 0; padding-left: 20px;">
                <li><strong>En móvil:</strong> Abre el enlace y toca "Agregar a pantalla de inicio"</li>
                <li><strong>En escritorio:</strong> Busca el ícono de instalación en la barra de direcciones</li>
                <li><strong>Notificaciones:</strong> Permite las notificaciones para recibir actualizaciones</li>
              </ul>
            </div>

            <!-- Funciones del Sistema -->
            <div style="background-color: #fefce8; border: 2px solid #eab308; border-radius: 8px; padding: 20px; margin: 25px 0;">
              <h3 style="color: #a16207; margin-top: 0; font-size: 18px; display: flex; align-items: center;">
                ⚙️ Funciones Disponibles
              </h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
                <div style="background-color: white; padding: 15px; border-radius: 6px; border-left: 4px solid #3b82f6;">
                  <h4 style="margin: 0 0 8px 0; color: #1e40af; font-size: 14px;">📊 Dashboard</h4>
                  <p style="margin: 0; color: #1e40af; font-size: 12px;">Seguimiento del progreso del estudio</p>
                </div>
                <div style="background-color: white; padding: 15px; border-radius: 6px; border-left: 4px solid #10b981;">
                  <h4 style="margin: 0 0 8px 0; color: #059669; font-size: 14px;">📝 Casos</h4>
                  <p style="margin: 0; color: #059669; font-size: 12px;">Gestión de casos quirúrgicos</p>
                </div>
                <div style="background-color: white; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b;">
                  <h4 style="margin: 0 0 8px 0; color: #d97706; font-size: 14px;">📈 Reportes</h4>
                  <p style="margin: 0; color: #d97706; font-size: 12px;">Generación de reportes</p>
                </div>
                <div style="background-color: white; padding: 15px; border-radius: 6px; border-left: 4px solid #8b5cf6;">
                  <h4 style="margin: 0 0 8px 0; color: #7c3aed; font-size: 14px;">🔔 Notificaciones</h4>
                  <p style="margin: 0; color: #7c3aed; font-size: 12px;">Mensajes y alertas</p>
                </div>
              </div>
            </div>

            <!-- Soporte -->
            <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
              <h3 style="color: #374151; margin-top: 0; font-size: 16px;">¿Necesitas Ayuda?</h3>
              <p style="color: #6b7280; font-size: 14px; margin: 10px 0;">
                Si tienes alguna pregunta o necesitas asistencia, no dudes en contactarnos:
              </p>
              <p style="color: #4b5563; font-size: 14px; margin: 5px 0;">
                📧 Email: soporte@epic-q.com<br>
                📞 Teléfono: +1 (555) 123-4567
              </p>
            </div>

            <!-- Footer -->
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
              Este es un mensaje automático de EPIC-Q Management System.<br>
              No respondas a este correo. Para soporte, usa los contactos indicados arriba.
            </p>
          </div>
        </div>
      `,
      variables: ['userName', 'userEmail', 'userRole', 'hospitalName', 'temporaryPassword', 'loginUrl'],
      category: 'Bienvenida',
      is_active: true,
    },
    {
      name: 'bienvenida_coordinador_interna',
      description: 'Mensaje interno de bienvenida para coordinadores con funciones de la aplicación',
      type: 'internal',
      internal_subject: '¡Bienvenido al sistema EPIC-Q! - Guía de Funciones',
      internal_body: `¡Hola {{userName}}! 👋

Bienvenido al sistema de gestión del Estudio Perioperatorio Integral de Cuidados Quirúrgicos (EPIC-Q).

Como coordinador del hospital {{hospitalName}}, tienes acceso a las siguientes funciones:

📊 **DASHBOARD PRINCIPAL**
• Visualizar el progreso general del estudio en tu hospital
• Monitorear estadísticas en tiempo real
• Acceder a métricas de rendimiento

📝 **GESTIÓN DE CASOS**
• Registrar nuevos casos quirúrgicos
• Actualizar el estado de casos existentes
• Seguir el progreso de cada paciente
• Documentar observaciones y notas

📈 **REPORTES Y ANÁLISIS**
• Generar reportes de progreso
• Exportar datos para análisis
• Visualizar tendencias y patrones
• Crear informes personalizados

🔔 **SISTEMA DE NOTIFICACIONES**
• Recibir alertas importantes
• Notificaciones de cambios de estado
• Recordatorios de tareas pendientes
• Comunicación con el equipo de investigación

⚙️ **CONFIGURACIÓN**
• Actualizar información del hospital
• Gestionar preferencias de usuario
• Configurar notificaciones
• Cambiar contraseña

📱 **APLICACIÓN MÓVIL (PWA)**
• Acceso desde cualquier dispositivo
• Funcionalidad offline
• Notificaciones push
• Sincronización automática

🎯 **PRÓXIMOS PASOS RECOMENDADOS:**
1. Completa el perfil de tu hospital
2. Revisa los casos asignados
3. Configura tus preferencias de notificación
4. Explora el dashboard para familiarizarte

Si tienes alguna pregunta o necesitas ayuda, no dudes en contactar al equipo de soporte.

¡Esperamos que tengas una excelente experiencia usando EPIC-Q! 🚀

---
Sistema EPIC-Q Management
Equipo de Investigación`,
      variables: ['userName', 'hospitalName'],
      category: 'Bienvenida',
      is_active: true,
    }
  ];

  for (const templateData of welcomeTemplates) {
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

  console.log('🎉 Templates de bienvenida creados correctamente!');
}

createWelcomeTemplates()
  .catch((e) => {
    console.error('❌ Error al crear templates de bienvenida:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('✅ Script completado exitosamente');
  });
