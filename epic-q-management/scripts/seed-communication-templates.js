const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const templates = [
  // Template 1: Bienvenida email completo (ya existe)
  {
    id: 'cmgx49ief0001bpkcq3zvbqm1',
    name: 'bienvenida_email_completo',
    description: 'Template profesional de bienvenida para coordinadores',
    type: 'email',
    category: 'welcome',
    is_active: true,
    usage_count: 0,
    internal_subject: '',
    internal_body: '',
    email_subject: 'Bienvenido a EPIC-Q - {{hospitalName}}',
    email_body: `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenido a EPIC-Q - {{hospitalName}}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 12px 12px 0 0;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .content {
            background-color: white;
            padding: 40px;
            border-radius: 0 0 12px 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .credentials-box {
            background-color: #f0f9ff;
            border: 2px solid #0ea5e9;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
        }
        .cta-button {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            display: inline-block;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0; font-size: 28px; font-weight: 700;">🏥 EPIC-Q Management</h1>
            <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">Sistema de Gestión del Estudio Perioperatorio</p>
        </div>

        <div class="content">
            <h2 style="color: #1f2937; margin-top: 0; font-size: 24px;">¡Bienvenido, {{userName}}!</h2>
            
            <p style="color: #4b5563; line-height: 1.6; font-size: 16px; margin-bottom: 20px;">
              Has sido registrado como <strong>{{userRole}}</strong> del hospital <strong>{{hospitalName}}</strong> 
              en el Estudio Perioperatorio Integral de Cuidados Quirúrgicos (EPIC-Q).
            </p>

            <div class="credentials-box">
                <h3 style="color: #0c4a6e; margin-top: 0; font-size: 18px;">🔐 Credenciales de Acceso</h3>
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

            <div style="text-align: center; margin: 30px 0;">
                <a href="{{loginUrl}}" class="cta-button">🚀 Acceder al Sistema</a>
            </div>

            <div style="background-color: #f0fdf4; border: 2px solid #22c55e; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h3 style="color: #14532d; margin-top: 0; font-size: 18px;">📱 Instalar como Aplicación (PWA)</h3>
                <p style="color: #166534; margin: 10px 0; font-size: 14px;">
                    Para una mejor experiencia, puedes instalar EPIC-Q como una aplicación en tu dispositivo:
                </p>
                <ul style="color: #166534; font-size: 14px; margin: 10px 0; padding-left: 20px;">
                    <li><strong>En móvil:</strong> Abre el enlace y toca "Agregar a pantalla de inicio"</li>
                    <li><strong>En escritorio:</strong> Busca el ícono de instalación en la barra de direcciones</li>
                    <li><strong>Notificaciones:</strong> Permite las notificaciones para recibir actualizaciones</li>
                </ul>
            </div>

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

            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                Este es un mensaje automático de EPIC-Q Management System.<br>
                No respondas a este correo. Para soporte, usa los contactos indicados arriba.
            </p>
        </div>
    </div>
</body>
</html>`,
    variables: ['userName', 'userEmail', 'userRole', 'hospitalName', 'temporaryPassword', 'loginUrl', 'systemName'],
    created_at: new Date('2025-10-19T02:57:53.511Z'),
    updated_at: new Date('2025-10-19T03:09:49.414Z')
  },

  // Template 2: Invitación coordinador (ya existe)
  {
    id: 'cmgx49ine0002bpkcguf6rpsb',
    name: 'coordinator_invitation',
    description: 'Template de invitación para coordinadores de proyecto',
    type: 'email',
    category: 'invitation',
    is_active: true,
    usage_count: 7,
    internal_subject: '',
    internal_body: '',
    email_subject: 'Invitación al Proyecto {{projectName}} - EPIC-Q',
    email_body: `<!DOCTYPE html>
<html lang="es">
   <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invitación al Proyecto {{projectName}} - EPIC-Q</title>
      <style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;background-color:#f8fafc}.container{background:white;border-radius:8px;padding:30px;box-shadow:0 2px 10px rgba(0,0,0,0.1)}.header{text-align:center;margin-bottom:30px;padding-bottom:20px;border-bottom:2px solid #e2e8f0}.logo{background:#2563eb;color:white;width:60px;height:60px;border-radius:12px;display:flex;align-items:center;justify-content:center;margin:0 auto 15px;font-size:24px;font-weight:bold}.title{color:#1e40af;font-size:24px;font-weight:600;margin:0}.subtitle{color:#64748b;font-size:16px;margin:5px 0 0}.content{margin-bottom:30px}.greeting{font-size:18px;margin-bottom:20px}.project-info{background:#f1f5f9;border-radius:6px;padding:20px;margin:20px 0}.info-row{display:flex;justify-content:space-between;margin-bottom:10px;padding:8px 0;border-bottom:1px solid #e2e8f0}.info-row:last-child{border-bottom:none;margin-bottom:0}.info-label{font-weight:600;color:#475569}.info-value{color:#1e293b}.credentials-box{background:#fef3c7;border:2px solid #f59e0b;border-radius:8px;padding:20px;margin:20px 0}.credentials-title{font-weight:700;color:#92400e;margin-bottom:15px;font-size:16px}.credential-item{display:flex;justify-content:space-between;margin-bottom:10px;padding:8px 0}.credential-label{font-weight:600;color:#92400e}.credential-value{font-family:'Courier New',monospace;background:#fbbf24;padding:4px 8px;border-radius:4px;font-weight:600;color:#92400e}.cta-button{display:inline-block;background:#2563eb;color:white;padding:15px 30px;text-decoration:none;border-radius:6px;font-weight:600;font-size:16px;text-align:center;margin:20px 0}.footer{margin-top:30px;padding-top:20px;border-top:1px solid #e2e8f0;text-align:center;color:#64748b;font-size:14px}.warning{background:#fef2f2;border:1px solid #fca5a5;border-radius:6px;padding:15px;margin:20px 0;color:#dc2626}.warning-title{font-weight:600;margin-bottom:5px}.steps{background:#f0f9ff;border:1px solid #0ea5e9;border-radius:6px;padding:20px;margin:20px 0}.steps-title{font-weight:600;color:#0369a1;margin-bottom:15px}.step{display:flex;align-items:flex-start;margin-bottom:12px;padding:8px 0}.step-number{background:#0ea5e9;color:white;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;margin-right:12px;flex-shrink:0}.step-text{flex:1;line-height:1.4}.responsibilities{background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:20px;margin:20px 0}.responsibilities-title{font-weight:600;color:#374151;margin-bottom:15px;font-size:16px}.responsibilities ul{margin:0;padding-left:20px}.responsibilities li{margin-bottom:8px;color:#4b5563}</style>
   </head>
   <body>
      <div class="container">
         <div class="header">
          <img src="https://i.imgur.com/Xv2pga8.png" alt="EPIC-Q Logo" width="100" height="auto" style="display:block; margin:0 auto; max-width:100%; height:auto;">
            <h1 class="title">EPIC-Q</h1>
            <p class="subtitle">Sistema de Gestión de Proyectos</p>
         </div>
         <div class="content">
            <div class="greeting">¡Hola {{userName}}!</div>
            <p>Has sido invitado a participar como coordinador en el proyecto <strong>{{projectName}}</strong> del sistema EPIC-Q.</p>
            <div class="project-info">
               <div class="info-row"><span class="info-label">Proyecto:</span><span class="info-value"> {{projectName}}</span></div>
               <div class="info-row"><span class="info-label">Hospital:</span><span class="info-value"> {{hospitalName}}</span></div>
               <div class="info-row"><span class="info-label"> Períodos Requeridos:</span><span class="info-value">{{requiredPeriods}} </span></div>
               <div class="info-row"><span class="info-label">Descripción:</span><span class="info-value">{{projectDescription}}</span></div>
            </div>
            <div class="credentials-box">
               <div class="credentials-title">🔑 Tus Credenciales de Acceso</div>
               <div class="credential-item"><span class="credential-label">Email:</span><span class="credential-value"> {{userEmail}}</span></div>
               <div class="credential-item"><span class="credential-label">Contraseña Temporal:</span><span class="credential-value"> {{temporaryPassword}}</span></div>
            </div>
            <div class="steps">
               <div class="steps-title">📋 Pasos para Comenzar</div>
               <div class="step">
                  <div class="step-text">1 - Haz clic en el botón "Iniciar Sesión" a continuación</div>
               </div>
               <div class="step">
                  <div class="step-text">2 - Ingresa tus credenciales temporales</div>
               </div>
               <div class="step">
                  <div class="step-text">3 - Cambia tu contraseña por una segura</div>
               </div>
               <div class="step">
                  <div class="step-text">4 - Completa la información de tu hospital</div>
               </div>
               <div class="step">
                  <div class="step-text">5 - Configura los períodos de reclutamiento</div>
               </div>
            </div>
            <div style="text-align:center"><a href="{{invitationLink}}" class="cta-button">Iniciar Sesión</a></div>
            <div class="warning">
               <div class="warning-title">⚠️ Importante</div>
               <p>Por seguridad, debes cambiar tu contraseña temporal en el primer acceso. Guarda estas credenciales hasta que completes el proceso de configuración.</p>
            </div>
            <div class="responsibilities">
               <div class="responsibilities-title">Como coordinador, serás responsable de:</div>
               <ul>
                  <li>Completar la información del hospital</li>
                  <li>Gestionar el progreso del comité de ética</li>
                  <li>Configurar los períodos de reclutamiento</li>
                  <li>Supervisar el avance del proyecto</li>
               </ul>
            </div>
            <p>Si tienes alguna pregunta o necesitas ayuda, no dudes en contactar al administrador del proyecto.</p>
         </div>
         <div class="footer">
            <p>Este es un email automático del sistema EPIC-Q. Por favor, no respondas a este mensaje.</p>
            <p>Si no esperabas recibir esta invitación, puedes ignorar este email.</p>
         </div>
      </div>
   </body>
</html>`,
    variables: ['userName', 'userEmail', 'projectName', 'hospitalName', 'requiredPeriods', 'projectDescription', 'invitationLink', 'temporaryPassword'],
    created_at: new Date('2025-10-19T02:57:53.834Z'),
    updated_at: new Date('2025-10-20T12:23:25.912Z')
  },

  // Template 3: Reset de contraseña (ya existe)
  {
    id: 'cmgx49irw0003bpkc1otw2etb',
    name: 'password_reset',
    description: 'Template para reset de contraseña',
    type: 'email',
    category: 'auth',
    is_active: true,
    usage_count: 0,
    internal_subject: null,
    internal_body: null,
    email_subject: 'Restablecer contraseña - EPIC-Q',
    email_body: `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Restablecer contraseña - EPIC-Q</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e2e8f0;
        }
        .cta-button {
            display: inline-block;
            background: #2563eb;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="color: #1e40af; font-size: 24px; font-weight: 600; margin: 0;">EPIC-Q</h1>
            <p style="color: #64748b; font-size: 16px; margin: 5px 0 0;">Sistema de Gestión del Estudio Perioperatorio</p>
        </div>

        <div>
            <h2 style="color: #1f2937; margin-top: 0;">Restablecer contraseña</h2>
            
            <p>Hola {{userName}},</p>
            
            <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en EPIC-Q.</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{resetLink}}" class="cta-button">Restablecer contraseña</a>
            </div>
            
            <p>Si no solicitaste este cambio, puedes ignorar este email. Tu contraseña no se modificará.</p>
            
            <p>Este enlace expirará en 24 horas por seguridad.</p>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 14px;">
            <p style="margin: 0;">Este es un email automático del sistema EPIC-Q.</p>
        </div>
    </div>
</body>
</html>`,
    variables: ['userName', 'resetLink'],
    created_at: new Date('2025-10-19T02:57:53.997Z'),
    updated_at: new Date('2025-10-19T02:57:53.997Z')
  },

  // Template 4: Invitación usuario (ya existe)
  {
    id: 'cmgx49iwb0004bpkcelghvuxy',
    name: 'user_invitation',
    description: 'Template de invitación para nuevos usuarios',
    type: 'email',
    category: 'invitation',
    is_active: true,
    usage_count: 0,
    internal_subject: null,
    internal_body: null,
    email_subject: 'Invitación a EPIC-Q - {{hospitalName}}',
    email_body: `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invitación a EPIC-Q - {{hospitalName}}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e2e8f0;
        }
        .cta-button {
            display: inline-block;
            background: #2563eb;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="color: #1e40af; font-size: 24px; font-weight: 600; margin: 0;">EPIC-Q</h1>
            <p style="color: #64748b; font-size: 16px; margin: 5px 0 0;">Sistema de Gestión del Estudio Perioperatorio</p>
        </div>

        <div>
            <h2 style="color: #1f2937; margin-top: 0;">¡Bienvenido a EPIC-Q!</h2>
            
            <p>Hola {{userName}},</p>
            
            <p>Has sido invitado a formar parte del equipo de <strong>{{hospitalName}}</strong> en el sistema EPIC-Q.</p>
            
            <p>Tu rol será: <strong>{{userRole}}</strong></p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{invitationLink}}" class="cta-button">Aceptar invitación</a>
            </div>
            
            <p>Si no esperabas esta invitación, puedes ignorar este email.</p>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 14px;">
            <p style="margin: 0;">Este es un email automático del sistema EPIC-Q.</p>
        </div>
    </div>
</body>
</html>`,
    variables: ['userName', 'hospitalName', 'userRole', 'invitationLink'],
    created_at: new Date('2025-10-19T02:57:54.155Z'),
    updated_at: new Date('2025-10-19T02:57:54.155Z')
  },

  // Template 5: Alerta de documentación pendiente
  {
    id: 'template-alert-documentation-pending',
    name: 'alert_documentation_pending',
    description: 'Alerta cuando falta documentación en un hospital',
    type: 'email',
    category: 'alert',
    is_active: true,
    usage_count: 0,
    internal_subject: 'Documentación pendiente - {{hospitalName}}',
    internal_body: 'El hospital {{hospitalName}} tiene documentación pendiente: {{missingDocuments}}',
    email_subject: '⚠️ Documentación Pendiente - {{hospitalName}}',
    email_body: `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Documentación Pendiente - {{hospitalName}}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .alert-box {
            background: #fef3c7;
            border: 2px solid #f59e0b;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .cta-button {
            display: inline-block;
            background: #f59e0b;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0; font-size: 24px;">⚠️ Alerta de Documentación</h1>
            <p style="margin: 5px 0 0; opacity: 0.9;">EPIC-Q Management System</p>
        </div>

        <div>
            <h2 style="color: #1f2937; margin-top: 0;">Documentación Pendiente</h2>
            
            <p>Hola {{userName}},</p>
            
            <p>El hospital <strong>{{hospitalName}}</strong> en el proyecto <strong>{{projectName}}</strong> tiene documentación pendiente que requiere tu atención.</p>
            
            <div class="alert-box">
                <h3 style="color: #92400e; margin-top: 0;">📋 Documentos Faltantes:</h3>
                <ul style="color: #92400e; margin: 10px 0;">
                    {{#each missingDocuments}}
                    <li>{{this}}</li>
                    {{/each}}
                </ul>
            </div>
            
            <p><strong>Fecha límite:</strong> {{deadline}}</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{hospitalUrl}}" class="cta-button">Revisar Hospital</a>
            </div>
            
            <p>Por favor, completa la documentación faltante lo antes posible para mantener el proyecto en curso.</p>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 14px;">
            <p style="margin: 0;">Este es un mensaje automático del sistema EPIC-Q.</p>
        </div>
    </div>
</body>
</html>`,
    variables: ['userName', 'hospitalName', 'projectName', 'missingDocuments', 'deadline', 'hospitalUrl'],
    created_at: new Date(),
    updated_at: new Date()
  },

  // Template 6: Alerta de período de reclutamiento próximo
  {
    id: 'template-alert-recruitment-upcoming',
    name: 'alert_recruitment_upcoming',
    description: 'Alerta cuando se acerca un período de reclutamiento',
    type: 'email',
    category: 'alert',
    is_active: true,
    usage_count: 0,
    internal_subject: 'Período de reclutamiento próximo - {{hospitalName}}',
    internal_body: 'El período de reclutamiento {{periodName}} del hospital {{hospitalName}} comienza en {{daysUntilStart}} días',
    email_subject: '📅 Período de Reclutamiento Próximo - {{hospitalName}}',
    email_body: `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Período de Reclutamiento Próximo - {{hospitalName}}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .info-box {
            background: #f0fdf4;
            border: 2px solid #10b981;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .cta-button {
            display: inline-block;
            background: #10b981;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0; font-size: 24px;">📅 Período de Reclutamiento Próximo</h1>
            <p style="margin: 5px 0 0; opacity: 0.9;">EPIC-Q Management System</p>
        </div>

        <div>
            <h2 style="color: #1f2937; margin-top: 0;">¡Se acerca un período de reclutamiento!</h2>
            
            <p>Hola {{userName}},</p>
            
            <p>Te informamos que el período de reclutamiento <strong>{{periodName}}</strong> del hospital <strong>{{hospitalName}}</strong> comenzará pronto.</p>
            
            <div class="info-box">
                <h3 style="color: #14532d; margin-top: 0;">📋 Detalles del Período:</h3>
                <p><strong>Hospital:</strong> {{hospitalName}}</p>
                <p><strong>Período:</strong> {{periodName}}</p>
                <p><strong>Fecha de inicio:</strong> {{startDate}}</p>
                <p><strong>Fecha de fin:</strong> {{endDate}}</p>
                <p><strong>Días restantes:</strong> {{daysUntilStart}} días</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{hospitalUrl}}" class="cta-button">Ver Detalles</a>
            </div>
            
            <p>Por favor, asegúrate de tener todo preparado para el inicio del período de reclutamiento.</p>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 14px;">
            <p style="margin: 0;">Este es un mensaje automático del sistema EPIC-Q.</p>
        </div>
    </div>
</body>
</html>`,
    variables: ['userName', 'hospitalName', 'periodName', 'startDate', 'endDate', 'daysUntilStart', 'hospitalUrl'],
    created_at: new Date(),
    updated_at: new Date()
  },

  // Template 7: Notificación de proyecto completado
  {
    id: 'template-project-completed',
    name: 'project_completed',
    description: 'Notificación cuando un proyecto se marca como completado',
    type: 'email',
    category: 'notification',
    is_active: true,
    usage_count: 0,
    internal_subject: 'Proyecto completado - {{projectName}}',
    internal_body: 'El proyecto {{projectName}} ha sido marcado como completado exitosamente',
    email_subject: '🎉 Proyecto Completado - {{projectName}}',
    email_body: `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Proyecto Completado - {{projectName}}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .success-box {
            background: #f0fdf4;
            border: 2px solid #10b981;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
        }
        .stats-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0; font-size: 24px;">🎉 ¡Proyecto Completado!</h1>
            <p style="margin: 5px 0 0; opacity: 0.9;">EPIC-Q Management System</p>
        </div>

        <div>
            <h2 style="color: #1f2937; margin-top: 0;">¡Felicitaciones!</h2>
            
            <p>Hola {{userName}},</p>
            
            <p>Nos complace informarte que el proyecto <strong>{{projectName}}</strong> ha sido completado exitosamente.</p>
            
            <div class="success-box">
                <h3 style="color: #14532d; margin-top: 0;">✅ Proyecto Finalizado</h3>
                <p style="color: #166534; margin: 10px 0;">El proyecto ha alcanzado todos sus objetivos y ha sido marcado como completado.</p>
            </div>
            
            <div class="stats-box">
                <h3 style="color: #374151; margin-top: 0;">📊 Estadísticas del Proyecto:</h3>
                <p><strong>Hospitales participantes:</strong> {{totalHospitals}}</p>
                <p><strong>Coordinadores activos:</strong> {{totalCoordinators}}</p>
                <p><strong>Períodos de reclutamiento:</strong> {{totalPeriods}}</p>
                <p><strong>Fecha de finalización:</strong> {{completionDate}}</p>
            </div>
            
            <p>Gracias por tu dedicación y esfuerzo en este proyecto. ¡El trabajo en equipo ha dado sus frutos!</p>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 14px;">
            <p style="margin: 0;">Este es un mensaje automático del sistema EPIC-Q.</p>
        </div>
    </div>
</body>
</html>`,
    variables: ['userName', 'projectName', 'totalHospitals', 'totalCoordinators', 'totalPeriods', 'completionDate'],
    created_at: new Date(),
    updated_at: new Date()
  },

  // Template 8: Recordatorio de actividad
  {
    id: 'template-activity-reminder',
    name: 'activity_reminder',
    description: 'Recordatorio cuando no hay actividad reciente en un proyecto',
    type: 'email',
    category: 'reminder',
    is_active: true,
    usage_count: 0,
    internal_subject: 'Recordatorio de actividad - {{projectName}}',
    internal_body: 'No ha habido actividad reciente en el proyecto {{projectName}} desde {{lastActivityDate}}',
    email_subject: '⏰ Recordatorio de Actividad - {{projectName}}',
    email_body: `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recordatorio de Actividad - {{projectName}}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .reminder-box {
            background: #fef3c7;
            border: 2px solid #f59e0b;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .cta-button {
            display: inline-block;
            background: #f59e0b;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0; font-size: 24px;">⏰ Recordatorio de Actividad</h1>
            <p style="margin: 5px 0 0; opacity: 0.9;">EPIC-Q Management System</p>
        </div>

        <div>
            <h2 style="color: #1f2937; margin-top: 0;">Mantén el proyecto activo</h2>
            
            <p>Hola {{userName}},</p>
            
            <p>Hemos notado que no ha habido actividad reciente en el proyecto <strong>{{projectName}}</strong>.</p>
            
            <div class="reminder-box">
                <h3 style="color: #92400e; margin-top: 0;">📅 Última Actividad</h3>
                <p style="color: #92400e; margin: 10px 0;">La última actividad registrada fue el {{lastActivityDate}} (hace {{daysSinceActivity}} días).</p>
            </div>
            
            <p>Para mantener el proyecto en curso, te sugerimos:</p>
            <ul>
                <li>Revisar el progreso de los hospitales participantes</li>
                <li>Actualizar la documentación pendiente</li>
                <li>Comunicarte con los coordinadores</li>
                <li>Configurar nuevos períodos de reclutamiento si es necesario</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{projectUrl}}" class="cta-button">Revisar Proyecto</a>
            </div>
            
            <p>Si necesitas ayuda o tienes alguna pregunta, no dudes en contactarnos.</p>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 14px;">
            <p style="margin: 0;">Este es un mensaje automático del sistema EPIC-Q.</p>
        </div>
    </div>
</body>
</html>`,
    variables: ['userName', 'projectName', 'lastActivityDate', 'daysSinceActivity', 'projectUrl'],
    created_at: new Date(),
    updated_at: new Date()
  }
];

async function seedTemplates() {
  try {
    console.log('🌱 Iniciando seed de templates de comunicación...');
    
    for (const template of templates) {
      try {
        await prisma.communication_templates.upsert({
          where: { id: template.id },
          update: {
            name: template.name,
            description: template.description,
            type: template.type,
            category: template.category,
            is_active: template.is_active,
            usage_count: template.usage_count,
            internal_subject: template.internal_subject,
            internal_body: template.internal_body,
            email_subject: template.email_subject,
            email_body: template.email_body,
            variables: template.variables,
            updated_at: template.updated_at
          },
          create: template
        });
        
        console.log(`✅ Template "${template.name}" creado/actualizado`);
      } catch (error) {
        console.error(`❌ Error con template "${template.name}":`, error.message);
      }
    }
    
    console.log('🎉 Seed de templates completado exitosamente');
    
    // Mostrar resumen
    const totalTemplates = await prisma.communication_templates.count();
    const activeTemplates = await prisma.communication_templates.count({
      where: { is_active: true }
    });
    
    console.log(`📊 Resumen:`);
    console.log(`   - Total de templates: ${totalTemplates}`);
    console.log(`   - Templates activos: ${activeTemplates}`);
    
  } catch (error) {
    console.error('❌ Error durante el seed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedTemplates();
