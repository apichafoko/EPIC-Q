import { EmailService } from './email-service';
import { EmailTemplateService } from './email-template-service';
import { prisma } from '../../lib/database';
import { getLogoBase64, getEmailLogoUrl } from './email-logo';

interface ProjectInvitationData {
  projectName: string;
  hospitalName: string;
  coordinatorName: string;
  coordinatorEmail: string;
  invitationToken: string;
  requiredPeriods: number;
  projectDescription?: string;
  adminName?: string;
  temporaryPassword?: string;
}

class ProjectInvitationService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  async sendProjectInvitation(data: ProjectInvitationData): Promise<boolean> {
    try {
      const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/es/auth/login`;
      
      // Usar el template profesional de bienvenida
      const template = await EmailTemplateService.getTemplateByName('bienvenida_email_completo');
      
      if (template) {
        const variables = {
          userName: data.coordinatorName,
          userEmail: data.coordinatorEmail,
          userRole: 'Coordinador',
          hospitalName: data.hospitalName,
          temporaryPassword: data.temporaryPassword || 'Se generará automáticamente al crear la cuenta',
          loginUrl: loginUrl,
          systemName: 'EPIC-Q Management System'
        };
        
        const processed = EmailTemplateService.processTemplate(template, variables);
        
        // Incrementar contador de uso
        await EmailTemplateService.incrementUsageCount(template.id);
        
        const emailSent = await this.emailService.sendEmail({
          to: data.coordinatorEmail,
          subject: processed.subject,
          html: processed.body,
        });

        if (emailSent) {
          await this.logInvitationSent(data);
        }

        return emailSent;
      }
      
      // Fallback al template hardcodeado si no hay template en BD
      const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/es/accept-invitation?token=${data.invitationToken}`;
      const subject = `Invitación al Proyecto ${data.projectName} - EPIC-Q`;
      const html = this.generateInvitationEmailHTML(data, invitationUrl);
      const text = this.generateInvitationEmailText(data, invitationUrl);

      const emailSent = await this.emailService.sendEmail({
        to: data.coordinatorEmail,
        subject,
        html,
        text
      });

      if (emailSent) {
        await this.logInvitationSent(data);
      }

      return emailSent;
    } catch (error) {
      console.error('Error sending project invitation:', error);
      return false;
    }
  }

  private generateInvitationEmailHTML(data: ProjectInvitationData, invitationUrl: string): string {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invitación al Proyecto ${data.projectName}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
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
        .logo {
            width: 80px;
            height: 80px;
            margin: 0 auto 15px;
            display: block;
        }
        .title {
            color: #1e40af;
            font-size: 24px;
            font-weight: 600;
            margin: 0;
        }
        .subtitle {
            color: #64748b;
            font-size: 16px;
            margin: 5px 0 0;
        }
        .content {
            margin-bottom: 30px;
        }
        .greeting {
            font-size: 18px;
            margin-bottom: 20px;
        }
        .project-info {
            background: #f1f5f9;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 8px 0;
            border-bottom: 1px solid #e2e8f0;
        }
        .info-row:last-child {
            border-bottom: none;
            margin-bottom: 0;
        }
        .info-label {
            font-weight: 600;
            color: #475569;
        }
        .info-value {
            color: #1e293b;
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
            transition: background-color 0.2s;
        }
        .cta-button:hover {
            background: #1d4ed8;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            color: #64748b;
            font-size: 14px;
        }
        .warning {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            color: #92400e;
        }
        .warning-title {
            font-weight: 600;
            margin-bottom: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="${getEmailLogoUrl()}" alt="EPIC-Q Logo" class="logo" />
            <h1 class="title">EPIC-Q</h1>
            <p class="subtitle">Sistema de Gestión de Proyectos</p>
        </div>

        <div class="content">
            <div class="greeting">
                ¡Hola ${data.coordinatorName}!
            </div>

            <p>Has sido invitado a participar como coordinador en el proyecto <strong>${data.projectName}</strong> del sistema EPIC-Q.</p>

            <div class="project-info">
                <div class="info-row">
                    <span class="info-label">Proyecto:</span>
                    <span class="info-value">${data.projectName}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Hospital:</span>
                    <span class="info-value">${data.hospitalName}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Períodos Requeridos:</span>
                    <span class="info-value">${data.requiredPeriods} período${data.requiredPeriods !== 1 ? 's' : ''}</span>
                </div>
                ${data.projectDescription ? `
                <div class="info-row">
                    <span class="info-label">Descripción:</span>
                    <span class="info-value">${data.projectDescription}</span>
                </div>
                ` : ''}
            </div>

            <p>Como coordinador, serás responsable de:</p>
            <ul>
                <li>Completar la información del hospital</li>
                <li>Gestionar el progreso del comité de ética</li>
                <li>Configurar los períodos de reclutamiento</li>
                <li>Supervisar el avance del proyecto</li>
            </ul>

            <div style="text-align: center;">
                <a href="${invitationUrl}" class="cta-button">
                    Aceptar Invitación
                </a>
            </div>

            <div class="warning">
                <div class="warning-title">⚠️ Importante</div>
                <p>Si no tienes una cuenta en el sistema, se creará automáticamente al aceptar la invitación. Asegúrate de guardar tus credenciales de acceso.</p>
            </div>

            <p>Si tienes alguna pregunta o necesitas ayuda, no dudes en contactar al administrador del proyecto.</p>
        </div>

        <div class="footer">
            <p>Este es un email automático del sistema EPIC-Q. Por favor, no respondas a este mensaje.</p>
            <p>Si no esperabas recibir esta invitación, puedes ignorar este email.</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  private generateInvitationEmailText(data: ProjectInvitationData, invitationUrl: string): string {
    return `
EPIC-Q - Sistema de Gestión de Proyectos

¡Hola ${data.coordinatorName}!

Has sido invitado a participar como coordinador en el proyecto "${data.projectName}" del sistema EPIC-Q.

DETALLES DEL PROYECTO:
- Proyecto: ${data.projectName}
- Hospital: ${data.hospitalName}
- Períodos Requeridos: ${data.requiredPeriods} período${data.requiredPeriods !== 1 ? 's' : ''}
${data.projectDescription ? `- Descripción: ${data.projectDescription}` : ''}

Como coordinador, serás responsable de:
- Completar la información del hospital
- Gestionar el progreso del comité de ética
- Configurar los períodos de reclutamiento
- Supervisar el avance del proyecto

ACEPTAR INVITACIÓN:
${invitationUrl}

⚠️ IMPORTANTE:
Si no tienes una cuenta en el sistema, se creará automáticamente al aceptar la invitación. Asegúrate de guardar tus credenciales de acceso.

Si tienes alguna pregunta o necesitas ayuda, no dudes en contactar al administrador del proyecto.

---
Este es un email automático del sistema EPIC-Q. Por favor, no respondas a este mensaje.
Si no esperabas recibir esta invitación, puedes ignorar este email.
    `;
  }

  private async logInvitationSent(data: ProjectInvitationData): Promise<void> {
    try {
      // Aquí podrías registrar el envío en una tabla de logs si es necesario
      console.log(`📧 Project invitation sent to ${data.coordinatorEmail} for project ${data.projectName}`);
    } catch (error) {
      console.error('Error logging invitation sent:', error);
    }
  }

  async sendInvitationAcceptedNotification(projectCoordinatorId: string): Promise<boolean> {
    try {
      // Obtener información del coordinador y proyecto
      const projectCoordinator = await prisma.project_coordinators.findUnique({
        where: { id: projectCoordinatorId },
        include: {
          users: true,
          projects: true,
          hospitals: true
        }
      });

      if (!projectCoordinator) {
        throw new Error('Project coordinator not found');
      }

      // Obtener información del administrador (podrías tener un campo admin_id en Project)
      // Por ahora, enviaremos a un email genérico o podrías implementar una lógica más específica
      const adminEmail = process.env.ADMIN_EMAIL || 'demo@epic-q.com';

      const subject = `Invitación Aceptada - ${projectCoordinator.projects.name}`;
      
      const html = `
        <h2>Invitación Aceptada</h2>
        <p>El coordinador <strong>${projectCoordinator.users.name}</strong> ha aceptado la invitación al proyecto <strong>${projectCoordinator.projects.name}</strong>.</p>
        <p><strong>Hospital:</strong> ${projectCoordinator.hospitals.name}</p>
        <p><strong>Email:</strong> ${projectCoordinator.users.email}</p>
        <p><strong>Fecha de aceptación:</strong> ${new Date().toLocaleString('es-ES')}</p>
      `;

      return await this.emailService.sendEmail({
        to: adminEmail,
        subject,
        html
      });
    } catch (error) {
      console.error('Error sending invitation accepted notification:', error);
      return false;
    }
  }
}

export const projectInvitationService = new ProjectInvitationService();
