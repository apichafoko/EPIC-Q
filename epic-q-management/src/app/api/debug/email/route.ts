import { NextRequest, NextResponse } from 'next/server';
import { SimpleAuthService } from '../../../../lib/auth/simple-auth-service';
import { EmailService } from '../../../../lib/notifications/email-service';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = await SimpleAuthService.verifyToken(token);
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Verificar configuración de email
    const emailConfig = {
      host: process.env.EMAIL_HOST || 'NO CONFIGURADO',
      port: process.env.EMAIL_PORT || 'NO CONFIGURADO',
      user: process.env.EMAIL_USER || 'NO CONFIGURADO',
      pass: process.env.EMAIL_PASS ? '***CONFIGURADO***' : 'NO CONFIGURADO',
      from: process.env.EMAIL_FROM || 'NO CONFIGURADO',
      secure: process.env.EMAIL_SECURE === 'true',
      tls: process.env.EMAIL_TLS === 'true'
    };

    // Verificar si el servicio está configurado
    const emailService = new EmailService();
    const isConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);

    return NextResponse.json({
      configured: isConfigured,
      config: emailConfig,
      status: isConfigured ? 'ready' : 'not_configured'
    });

  } catch (error) {
    console.error('Error checking email configuration:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = await SimpleAuthService.verifyToken(token);
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { to, subject, message } = body;

    if (!to || !subject || !message) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos: to, subject, message' },
        { status: 400 }
      );
    }

    const emailService = new EmailService();
    
    const result = await emailService.sendEmail({
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">${subject}</h2>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
            ${message.replace(/\n/g, '<br>')}
          </div>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            Email enviado desde EPIC-Q Management System<br>
            Fecha: ${new Date().toLocaleString('es-ES')}
          </p>
        </div>
      `,
      text: `${subject}\n\n${message}\n\n---\nEmail enviado desde EPIC-Q Management System\nFecha: ${new Date().toLocaleString('es-ES')}`
    });

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      accepted: result.accepted,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
