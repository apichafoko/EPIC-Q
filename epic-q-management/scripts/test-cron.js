#!/usr/bin/env node

/**
 * Script para probar el cron job de generación de alertas
 */

const https = require('https');
const http = require('http');

const CRON_SECRET = process.env.CRON_SECRET || '4c96a2a810e1e2ef8434afb339f5ef692553423880a2ca5a2aa3cfcf1720ea8f';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function testCronJob() {
  const url = `${BASE_URL}/api/cron/generate-alerts`;
  
  console.log('🧪 Probando cron job de generación de alertas...');
  console.log(`📍 URL: ${url}`);
  console.log(`🔑 Secret: ${CRON_SECRET.substring(0, 8)}...`);
  console.log('');
  
  const options = {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CRON_SECRET}`,
      'Content-Type': 'application/json'
    }
  };
  
  const client = BASE_URL.startsWith('https') ? https : http;
  
  const req = client.request(url, options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`📊 Status: ${res.statusCode}`);
      console.log(`📋 Headers:`, res.headers);
      console.log('');
      
      try {
        const response = JSON.parse(data);
        console.log('📄 Response:');
        console.log(JSON.stringify(response, null, 2));
        
        if (res.statusCode === 200) {
          console.log('');
          console.log('✅ Cron job ejecutado exitosamente!');
          if (response.results) {
            console.log(`📈 Alertas generadas: ${response.results.totalGenerated}`);
            console.log(`⏭️  Alertas omitidas: ${response.results.totalSkipped}`);
            console.log(`❌ Errores: ${response.results.totalErrors}`);
          }
        } else {
          console.log('');
          console.log('❌ Error en el cron job');
        }
      } catch (error) {
        console.log('📄 Raw Response:');
        console.log(data);
        console.log('');
        console.log('❌ Error parseando respuesta JSON');
      }
    });
  });
  
  req.on('error', (error) => {
    console.error('❌ Error de conexión:', error.message);
    console.log('');
    console.log('💡 Asegúrate de que:');
    console.log('   1. El servidor esté corriendo (npm run dev)');
    console.log('   2. La URL sea correcta');
    console.log('   3. El CRON_SECRET esté configurado');
  });
  
  req.end();
}

// Ejecutar test
testCronJob().catch(console.error);
