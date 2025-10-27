const nodemailer = require('nodemailer');

async function testEmailConfiguration() {
  console.log('🧪 Probando configuración de email...\n');
  
  // Verificar variables de entorno
  console.log('📋 Variables de entorno:');
  console.log('EMAIL_HOST:', process.env.EMAIL_HOST || 'NO CONFIGURADO');
  console.log('EMAIL_PORT:', process.env.EMAIL_PORT || 'NO CONFIGURADO');
  console.log('EMAIL_USER:', process.env.EMAIL_USER || 'NO CONFIGURADO');
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '***CONFIGURADO***' : 'NO CONFIGURADO');
  console.log('EMAIL_FROM:', process.env.EMAIL_FROM || 'NO CONFIGURADO');
  console.log('');

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('❌ ERROR: Configuración de email incompleta');
    console.log('');
    console.log('🔧 Para configurar el email:');
    console.log('1. Ejecuta: node scripts/configure-email.js');
    console.log('2. O edita manualmente el archivo .env.local');
    console.log('');
    return;
  }

  try {
    // Crear transporter
    const transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    
    console.log('📧 Enviando email de prueba...');
    
    const result = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@epic-q.com',
      to: process.env.EMAIL_USER, // Enviar a ti mismo para prueba
      subject: '🧪 Prueba de Email - EPIC-Q System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">✅ Email de Prueba Exitoso</h2>
          <p>Este es un email de prueba del sistema EPIC-Q.</p>
          <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-ES')}</p>
          <p><strong>Servidor:</strong> ${process.env.EMAIL_HOST}:${process.env.EMAIL_PORT}</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            Si recibes este email, la configuración está funcionando correctamente.
          </p>
        </div>
      `,
      text: `
        Email de Prueba - EPIC-Q System
        
        Este es un email de prueba del sistema EPIC-Q.
        Fecha: ${new Date().toLocaleString('es-ES')}
        Servidor: ${process.env.EMAIL_HOST}:${process.env.EMAIL_PORT}
        
        Si recibes este email, la configuración está funcionando correctamente.
      `
    });

    console.log('✅ Email enviado exitosamente!');
    console.log('📧 Message ID:', result.messageId);
    console.log('📬 Destinatario:', result.accepted);
    console.log('');
    console.log('🎉 ¡La configuración de email está funcionando correctamente!');
    
  } catch (error) {
    console.log('❌ ERROR al enviar email:');
    console.log(error.message);
    console.log('');
    console.log('🔧 Posibles soluciones:');
    console.log('1. Verifica que EMAIL_USER y EMAIL_PASS sean correctos');
    console.log('2. Asegúrate de usar una contraseña de aplicación de Gmail');
    console.log('3. Verifica que la verificación en 2 pasos esté activada');
    console.log('4. Revisa que no haya restricciones de firewall');
  }
}

// Cargar variables de entorno
require('dotenv').config({ path: '.env.local' });

testEmailConfiguration();
