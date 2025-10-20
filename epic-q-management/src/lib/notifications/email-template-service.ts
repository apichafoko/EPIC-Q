import { prisma } from '@/lib/database';
import { getLogoBase64, getEmailLogoUrl } from './email-logo';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: Record<string, any>;
  category: string;
  is_active: boolean;
  usage_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface TemplateVariables {
  userName?: string;
  userEmail?: string;
  hospitalName?: string;
  invitationLink?: string;
  resetLink?: string;
  adminName?: string;
  systemName?: string;
  [key: string]: any;
}

export class EmailTemplateService {
  /**
   * Obtener template por nombre (busca en la tabla unificada communication_templates)
   */
  static async getTemplateByName(name: string): Promise<any | null> {
    try {
      const template = await prisma.communication_templates.findFirst({
        where: {
          name,
          is_active: true
        }
      });

      return template;
    } catch (error) {
      console.error('Error getting template by name:', error);
      return null;
    }
  }

  /**
   * Obtener template por ID
   */
  static async getTemplateById(id: string): Promise<EmailTemplate | null> {
    try {
      const template = await prisma.communication_templates.findUnique({
        where: { id }
      });

      return template as EmailTemplate | null;
    } catch (error) {
      console.error('Error getting template by ID:', error);
      return null;
    }
  }

  /**
   * Obtener todos los templates
   */
  static async getAllTemplates(): Promise<EmailTemplate[]> {
    try {
      const templates = await prisma.communication_templates.findMany({
        orderBy: [
          { category: 'asc' },
          { name: 'asc' }
        ]
      });

      return templates as EmailTemplate[];
    } catch (error) {
      console.error('Error getting all templates:', error);
      return [];
    }
  }

  /**
   * Crear nuevo template
   */
  static async createTemplate(templateData: {
    name: string;
    subject: string;
    body: string;
    variables?: Record<string, any>;
    category: string;
  }): Promise<EmailTemplate | null> {
    try {
      const template = await prisma.communication_templates.create({
        data: {
          name: templateData.name,
          subject: templateData.subject,
          body: templateData.body,
          variables: templateData.variables || {},
          category: templateData.category,
          is_active: true,
          usage_count: 0
        }
      });

      return template as EmailTemplate;
    } catch (error) {
      console.error('Error creating template:', error);
      return null;
    }
  }

  /**
   * Actualizar template
   */
  static async updateTemplate(id: string, templateData: {
    name?: string;
    subject?: string;
    body?: string;
    variables?: Record<string, any>;
    category?: string;
    is_active?: boolean;
  }): Promise<EmailTemplate | null> {
    try {
      const template = await prisma.communication_templates.update({
        where: { id },
        data: {
          ...templateData,
          updated_at: new Date()
        }
      });

      return template as EmailTemplate;
    } catch (error) {
      console.error('Error updating template:', error);
      return null;
    }
  }

  /**
   * Eliminar template
   */
  static async deleteTemplate(id: string): Promise<boolean> {
    try {
      await prisma.communication_templates.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      console.error('Error deleting template:', error);
      return false;
    }
  }

  /**
   * Incrementar contador de uso
   */
  static async incrementUsageCount(id: string): Promise<void> {
    try {
      await prisma.communication_templates.update({
        where: { id },
        data: {
          usage_count: {
            increment: 1
          }
        }
      });
    } catch (error) {
      console.error('Error incrementing usage count:', error);
    }
  }

  /**
   * Procesar template con variables
   */
  static processTemplate(template: EmailTemplate, variables: TemplateVariables): {
    subject: string;
    body: string;
  } {
    // Agregar logo al inicio
    const enhancedVariables = {
      ...variables,
      logoUrl: getEmailLogoUrl() || getLogoBase64()
    };
    
    let processedSubject = template.email_subject || template.subject || 'Invitación al sistema EPIC-Q';
    let processedBody = template.email_body || template.body || '';

    // Reemplazar variables en el subject
    Object.keys(enhancedVariables).forEach(key => {
      const placeholder = `{{${key}}}`;
      const value = enhancedVariables[key] || '';
      processedSubject = processedSubject.replace(new RegExp(placeholder, 'g'), String(value));
    });

    // Procesar el body con lógica condicional
    processedBody = this.processConditionalBlocks(processedBody, enhancedVariables);

    // Reemplazar variables en el body
    Object.keys(enhancedVariables).forEach(key => {
      const placeholder = `{{${key}}}`;
      const value = enhancedVariables[key] || '';
      processedBody = processedBody.replace(new RegExp(placeholder, 'g'), String(value));
    });

    return {
      subject: processedSubject,
      body: processedBody
    };
  }

  /**
   * Procesar bloques condicionales como {{#if variable}}
   */
  private static processConditionalBlocks(content: string, variables: TemplateVariables): string {
    // Procesar bloques {{#if variable}}...{{/if}}
    const ifBlockRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
    
    return content.replace(ifBlockRegex, (match, variableName, blockContent) => {
      const variableValue = variables[variableName];
      
      // Si la variable existe y no es vacía, incluir el contenido
      if (variableValue && variableValue !== '' && variableValue !== null && variableValue !== undefined) {
        return blockContent;
      } else {
        return ''; // Si no existe o es vacía, remover el bloque
      }
    });
  }

  /**
   * Crear templates por defecto
   */
  static async createDefaultTemplates(): Promise<void> {
    const defaultTemplates = [
      {
        name: 'user_invitation',
        subject: 'Invitación para unirse a EPIC-Q - {{systemName}}',
        body: `
<!DOCTYPE html>
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
        .highlight { background: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b; margin: 20px 0; }
        .pwa-info { background: #e0f2fe; padding: 15px; border-radius: 6px; border-left: 4px solid #0284c7; margin: 20px 0; }
        .credentials { background: #f3f4f6; padding: 15px; border-radius: 6px; font-family: monospace; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="{{logoUrl}}" alt="EPIC-Q Logo" style="width: 120px; height: 120px; margin: 0 auto 20px; display: block;" />
            <h1>¡Bienvenido a {{systemName}}!</h1>
        </div>
        <div class="content">
            <h2>Hola {{userName}},</h2>
            <p>Has sido invitado a unirte al sistema de gestión de EPIC-Q como <strong>{{userRole}}</strong>.</p>
            
            {{#if hospitalName}}
            <p><strong>Hospital asignado:</strong> {{hospitalName}}</p>
            {{/if}}
            
            <div class="highlight">
                <h3>🔑 Credenciales de Acceso</h3>
                <p><strong>Email:</strong> {{userEmail}}</p>
                <p><strong>Contraseña temporal:</strong> <span class="credentials">{{temporaryPassword}}</span></p>
                <p><em>⚠️ Debes cambiar esta contraseña en tu primer acceso por motivos de seguridad.</em></p>
            </div>
            
            <p>Para acceder al sistema y cambiar tu contraseña temporal, haz clic en el siguiente enlace:</p>
            
            <div style="text-align: center;">
                <a href="{{invitationLink}}" class="button">Iniciar Sesión</a>
            </div>
            
            <div class="pwa-info">
                <h3>📱 Aplicación Móvil (PWA)</h3>
                <p>EPIC-Q es una <strong>Progressive Web App (PWA)</strong> que puedes instalar en tu dispositivo móvil:</p>
                <ul>
                    <li><strong>En móvil:</strong> Abre el enlace en Chrome/Safari y selecciona "Agregar a pantalla de inicio"</li>
                    <li><strong>En escritorio:</strong> Busca el ícono de instalación en la barra de direcciones</li>
                    <li><strong>Funciona offline:</strong> Puedes acceder sin conexión a internet</li>
                    <li><strong>Notificaciones:</strong> Recibirás alertas importantes en tiempo real</li>
                </ul>
            </div>
            
            <p><strong>Importante:</strong> Este enlace expirará en 7 días por motivos de seguridad.</p>
            
            <p>Si no solicitaste esta invitación, puedes ignorar este email.</p>
            
            <p>Saludos cordiales,<br>
            El equipo de {{systemName}}</p>
        </div>
        <div class="footer">
            <p>Este es un email automático, por favor no respondas a este mensaje.</p>
            <p>Para soporte técnico, contacta al administrador del sistema.</p>
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
          systemName: 'string',
          temporaryPassword: 'string',
          logoUrl: 'string'
        },
        category: 'invitation'
      },
      {
        name: 'password_reset',
        subject: 'Restablecer contraseña - {{systemName}}',
        body: `
<!DOCTYPE html>
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
            <img src="{{logoUrl}}" alt="EPIC-Q Logo" style="width: 120px; height: 120px; margin: 0 auto 20px; display: block;" />
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
          systemName: 'string',
          logoUrl: 'string'
        },
        category: 'password_reset'
      }
    ];

    for (const templateData of defaultTemplates) {
      const existingTemplate = await this.getTemplateByName(templateData.name);
      if (!existingTemplate) {
        await this.createTemplate(templateData);
        console.log(`Created default template: ${templateData.name}`);
      }
    }
  }
}
