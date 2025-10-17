import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    try {
      // Solo crear el transporter si hay configuración de email
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        this.transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.EMAIL_PORT || '587'),
          secure: false, // true for 465, false for other ports
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });
      } else {
        console.warn('Email configuration not found. Email service will be disabled.');
      }
    } catch (error) {
      console.error('Failed to initialize email service:', error);
      this.transporter = null;
    }
  }

  async sendEmail(options: EmailOptions) {
    if (!this.transporter) {
      console.warn('Email service not configured. Email not sent to:', options.to);
      return { messageId: 'mock-message-id', accepted: [options.to] };
    }

    try {
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@epic-q.com',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      console.log('Email sent:', info.messageId);
      return info;
    } catch (error) {
      console.error('Email sending failed:', error);
      throw error;
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string) {
    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`;
    
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

  async sendInvitationEmail(email: string, invitationToken: string, hospitalName: string) {
    const setupUrl = `${process.env.NEXTAUTH_URL}/auth/set-password?token=${invitationToken}`;
    
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
              <a href="${setupUrl}" 
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
      text: `
        Invitación al sistema EPIC-Q
        
        ¡Bienvenido! Has sido invitado a participar como coordinador del hospital ${hospitalName} 
        en el Estudio Perioperatorio Integral de Cuidados Quirúrgicos (EPIC-Q).
        
        Configura tu cuenta haciendo clic en el siguiente enlace:
        ${setupUrl}
        
        Una vez que configures tu contraseña, podrás acceder al sistema.
      `,
    });
  }
}

export const emailService = new EmailService();

export async function sendEmail(options: EmailOptions) {
  return emailService.sendEmail(options);
}
