import nodemailer from 'nodemailer';
import { EmailTemplateService, TemplateVariables } from './email-template-service';
import { prisma } from '../../lib/database';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

const getAppBaseUrl = () => {
  return (
    process.env.PWA_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    'http://localhost:3000'
  ).replace(/\/$/, '');
};

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    try {
      // Solo crear el transporter si hay configuración de email y no está deshabilitado
      if (process.env.EMAIL_DISABLED === 'true') {
        console.log('📧 Email service disabled for development mode');
        this.transporter = null;
      } else {
        this.transporter = this.createTransporter();
        if (this.transporter) {
          console.log('📧 Email service configured and ready');
        } else {
          console.warn('Email configuration not found. Email service will be disabled.');
        }
      }
    } catch (error) {
      console.error('Failed to initialize email service:', error);
      this.transporter = null;
    }
  }

  private createTransporter(): nodemailer.Transporter | null {
    const provider = process.env.EMAIL_PROVIDER || 'gmail';
    const isProduction = process.env.NODE_ENV === 'production';
    
    // En desarrollo, usar Gmail por defecto
    // En producción, usar AWS SES si está configurado, sino Gmail
    if (provider === 'aws_ses' && isProduction) {
      // Configuración AWS SES (solo en producción)
      if (process.env.AWS_SES_SMTP_USER && process.env.AWS_SES_SMTP_PASS) {
        console.log('📧 Usando AWS SES para envío de emails');
        return nodemailer.createTransport({
          host: process.env.AWS_SES_SMTP_HOST || 'email-smtp.us-east-1.amazonaws.com',
          port: parseInt(process.env.AWS_SES_SMTP_PORT || '587'),
          secure: false, // true for 465, false for other ports
          auth: {
            user: process.env.AWS_SES_SMTP_USER,
            pass: process.env.AWS_SES_SMTP_PASS,
          },
          tls: {
            ciphers: 'SSLv3',
          },
        });
      } else {
        console.warn('⚠️ AWS SES configurado pero no hay credenciales. Usando Gmail.');
      }
    }
    
    // Gmail (desarrollo y fallback en producción)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      console.log(`📧 Usando Gmail para envío de emails (${isProduction ? 'producción' : 'desarrollo'})`);
      return nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
    }
    
    return null;
  }

  async sendEmail(options: EmailOptions) {
    const timestamp = new Date().toISOString();
    
    if (!this.transporter) {
      console.warn(`[${timestamp}] Email service not configured. Email not sent to:`, options.to);
      console.log('📧 Email que se habría enviado:');
      console.log('   Para:', options.to);
      console.log('   Asunto:', options.subject);
      console.log('   Contenido:', options.html ? 'HTML' : 'Texto');
      console.log('   Timestamp:', timestamp);
      return { messageId: 'mock-message-id', accepted: [options.to] };
    }

    try {
      console.log(`[${timestamp}] 📧 Enviando email a: ${options.to}`);
      console.log(`[${timestamp}] 📧 Asunto: ${options.subject}`);
      
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@epic-q.com',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      console.log(`[${timestamp}] ✅ Email enviado exitosamente!`);
      console.log(`[${timestamp}] 📧 Message ID: ${info.messageId}`);
      console.log(`[${timestamp}] 📧 Destinatarios aceptados: ${info.accepted?.join(', ')}`);
      console.log(`[${timestamp}] 📧 Destinatarios rechazados: ${info.rejected?.join(', ') || 'Ninguno'}`);
      
      return info;
    } catch (error) {
      console.error(`[${timestamp}] ❌ Error al enviar email:`, error);
      console.error(`[${timestamp}] 📧 Destinatario: ${options.to}`);
      console.error(`[${timestamp}] 📧 Asunto: ${options.subject}`);
      throw error;
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string, userName?: string) {
    const baseUrl = getAppBaseUrl();
    const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`;
    
    // Intentar usar template si está disponible
    const template = await EmailTemplateService.getTemplateByName('password_reset');
    
    if (template) {
      const variables: TemplateVariables = {
        userName: userName || 'Usuario',
        userEmail: email,
        resetLink: resetUrl,
        systemName: process.env.EMAIL_FROM_NAME || 'EPIC-Q Management System'
      };
      
      const processed = EmailTemplateService.processTemplate(template, variables);
      
      // Incrementar contador de uso
      await EmailTemplateService.incrementUsageCount(template.id);
      
      return this.sendEmail({
        to: email,
        subject: processed.subject,
        html: processed.body,
      });
    }
    
    // Fallback al template hardcodeado si no hay template en BD
    return this.sendEmail({
      to: email,
      subject: 'Recuperación de contraseña - EPIC-Q',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">EPIC-Q</h1>
            <p style="margin: 5px 0 0 0;">Sistema de Gestión</p>
          </div>
          
          <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #1f2937; margin-top: 0;">Recuperación de contraseña</h2>
            
            <p style="color: #4b5563; line-height: 1.6;">
              Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en el sistema EPIC-Q.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
                Restablecer contraseña
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              Si no solicitaste este cambio, puedes ignorar este correo. El enlace expirará en 24 horas.
            </p>
            
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
              Este es un mensaje automático del sistema EPIC-Q. No respondas a este correo.
            </p>
          </div>
        </div>
      `,
      text: `
        Recuperación de contraseña - EPIC-Q
        
        Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.
        
        Haz clic en el siguiente enlace para restablecer tu contraseña:
        ${resetUrl}
        
        Si no solicitaste este cambio, puedes ignorar este correo.
        
        El enlace expirará en 24 horas.
      `,
    });
  }

  async sendInvitationEmail(email: string, invitationToken: string, hospitalName: string, userName?: string, userRole?: string, temporaryPassword?: string) {
    const baseUrl = getAppBaseUrl();
    const loginUrl = `${baseUrl}/es/auth/login`;
    
    // Intentar usar template específico para coordinadores si está disponible
    const template = await EmailTemplateService.getTemplateByName('coordinator_invitation');
    
    if (template) {
      const variables: TemplateVariables = {
        userName: userName || 'Usuario',
        userEmail: email,
        projectName: 'Proyecto EPIC-Q', // Valor por defecto, se puede personalizar
        hospitalName: hospitalName,
        requiredPeriods: 2, // Valor por defecto
        projectDescription: 'Estudio Perioperatorio Integral de Cuidados Quirúrgicos',
        invitationLink: loginUrl,
        temporaryPassword: temporaryPassword || 'No disponible'
      };
      
      const processed = EmailTemplateService.processTemplate(template, variables);
      
      // Incrementar contador de uso
      await EmailTemplateService.incrementUsageCount(template.id);
      
      return this.sendEmail({
        to: email,
        subject: processed.subject,
        html: processed.body,
      });
    }
    
    // Fallback al template hardcodeado si no hay template en BD
    return this.sendEmail({
      to: email,
      subject: 'Invitación al sistema EPIC-Q',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">EPIC-Q</h1>
            <p style="margin: 5px 0 0 0;">Sistema de Gestión</p>
          </div>
          
          <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #1f2937; margin-top: 0;">¡Bienvenido al sistema EPIC-Q!</h2>
            
            <p style="color: #4b5563; line-height: 1.6;">
              Has sido invitado a participar como coordinador del hospital <strong>${hospitalName}</strong> 
              en el Estudio Perioperatorio Integral de Cuidados Quirúrgicos (EPIC-Q).
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginUrl}" 
                 style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
                Configurar cuenta
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              Una vez que configures tu contraseña, podrás acceder al sistema y comenzar a trabajar 
              en la descripción de tu hospital y el seguimiento del progreso del estudio.
            </p>
            
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
              Este es un mensaje automático del sistema EPIC-Q. No respondas a este correo.
            </p>
          </div>
        </div>
      `,
    });
  }

  async sendWelcomeEmail(email: string, userName: string, userRole: string, hospitalName: string, temporaryPassword: string) {
    const baseUrl = getAppBaseUrl();
    const loginUrl = `${baseUrl}/auth/login`;

    // Usar el template bienvenida_email_completo que tiene el diseño profesional
    const template = await EmailTemplateService.getTemplateByName('bienvenida_email_completo');

    if (template) {
      const variables: TemplateVariables = {
        userName: userName,
        userEmail: email,
        userRole: userRole,
        hospitalName: hospitalName,
        temporaryPassword: temporaryPassword,
        loginUrl: loginUrl,
        systemName: 'EPIC-Q Management System'
      };

      // Procesar template según el tipo
      let processedSubject: string, processedBody: string;
      
      if ('email_subject' in template) {
        // Es un communication_template
        processedSubject = template.email_subject || 'Bienvenido a EPIC-Q';
        processedBody = template.email_body || '';
        
        // Procesar variables
        Object.entries(variables).forEach(([key, value]) => {
          const placeholder = `{{${key}}}`;
          processedSubject = processedSubject.replace(new RegExp(placeholder, 'g'), String(value));
          processedBody = processedBody.replace(new RegExp(placeholder, 'g'), String(value));
        });
      } else {
        // Es un email_template
        const processed = EmailTemplateService.processTemplate(template, variables);
        processedSubject = processed.subject;
        processedBody = processed.body;
        await EmailTemplateService.incrementUsageCount(template.id);
      }

      return this.sendEmail({
        to: email,
        subject: processedSubject,
        html: processedBody,
      });
    }

    // Fallback si no hay template
    return this.sendEmail({
      to: email,
      subject: '¡Bienvenido a EPIC-Q! - Acceso y Configuración',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1>¡Bienvenido a EPIC-Q!</h1>
          <p>Hola ${userName},</p>
          <p>Has sido registrado como ${userRole} del hospital ${hospitalName}.</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Contraseña temporal:</strong> ${temporaryPassword}</p>
          <p><a href="${loginUrl}">Acceder al sistema</a></p>
        </div>
      `
    });
  }
}

export { EmailService };
export const emailService = new EmailService();

export async function sendEmail(options: EmailOptions) {
  return emailService.sendEmail(options);
}
