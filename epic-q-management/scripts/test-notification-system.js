#!/usr/bin/env node

/**
 * Script para probar el sistema completo de notificaciones
 * 
 * Este script prueba:
 * 1. Generación de alertas (cron job)
 * 2. Envío de emails
 * 3. Envío de push notifications
 * 4. Integración completa
 */

const https = require('https');
const http = require('http');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const CRON_SECRET = process.env.CRON_SECRET || '4c96a2a810e1e2ef8434afb339f5ef692553423880a2ca5a2aa3cfcf1720ea8f';

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({ status: res.statusCode, data: response });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function testCronJob() {
  console.log('🧪 Probando generación de alertas (Cron Job)...');
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/cron/generate-alerts`, {
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`
      }
    });
    
    if (response.status === 200) {
      console.log('✅ Cron job ejecutado exitosamente');
      console.log(`   Alertas generadas: ${response.data.results?.totalGenerated || 0}`);
      console.log(`   Alertas omitidas: ${response.data.results?.totalSkipped || 0}`);
      console.log(`   Errores: ${response.data.results?.totalErrors || 0}`);
      return true;
    } else {
      console.log('❌ Error en cron job:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Error de conexión:', error.message);
    return false;
  }
}

async function testEmailService() {
  console.log('\n📧 Probando servicio de email...');
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/notifications/send`, {
      body: {
        userId: 'test-user',
        title: 'Test Email',
        message: 'Esta es una prueba del sistema de email',
        type: 'info',
        sendEmail: true
      }
    });
    
    if (response.status === 200) {
      console.log('✅ Email enviado exitosamente');
      return true;
    } else {
      console.log('❌ Error enviando email:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Error de conexión:', error.message);
    return false;
  }
}

async function testPushNotifications() {
  console.log('\n📱 Probando push notifications...');
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/notifications/send-push`, {
      body: {
        title: 'Test Push',
        message: 'Esta es una prueba de push notification',
        data: { test: true }
      }
    });
    
    if (response.status === 200) {
      console.log('✅ Push notification enviada');
      console.log(`   Enviadas: ${response.data.sent || 0}`);
      console.log(`   Fallidas: ${response.data.failed || 0}`);
      return true;
    } else {
      console.log('❌ Error enviando push:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Error de conexión:', error.message);
    return false;
  }
}

async function testNotificationSystem() {
  console.log('🚀 Probando sistema completo de notificaciones...');
  console.log(`📍 URL base: ${BASE_URL}`);
  console.log('');
  
  const results = {
    cron: false,
    email: false,
    push: false
  };
  
  // Probar cron job
  results.cron = await testCronJob();
  
  // Probar email
  results.email = await testEmailService();
  
  // Probar push notifications
  results.push = await testPushNotifications();
  
  // Resumen
  console.log('\n📊 Resumen de pruebas:');
  console.log(`   Cron Job: ${results.cron ? '✅' : '❌'}`);
  console.log(`   Email: ${results.email ? '✅' : '❌'}`);
  console.log(`   Push: ${results.push ? '✅' : '❌'}`);
  
  const allPassed = Object.values(results).every(r => r);
  
  if (allPassed) {
    console.log('\n🎉 ¡Todas las pruebas pasaron! El sistema de notificaciones está funcionando correctamente.');
  } else {
    console.log('\n⚠️  Algunas pruebas fallaron. Revisa la configuración:');
    if (!results.cron) console.log('   - Verifica que el servidor esté corriendo y CRON_SECRET esté configurado');
    if (!results.email) console.log('   - Verifica la configuración de email (AWS SES o Gmail)');
    if (!results.push) console.log('   - Verifica las VAPID keys y la migración de base de datos');
  }
  
  console.log('\n💡 Para probar manualmente:');
  console.log('   1. npm run dev');
  console.log('   2. Ve a la sección de notificaciones en la UI');
  console.log('   3. Envía una notificación de prueba');
  console.log('   4. Verifica que llegue por email y push');
}

// Ejecutar pruebas
testNotificationSystem().catch(console.error);
