#!/usr/bin/env node

const https = require('https');
const http = require('http');

async function testEmailAPI() {
  console.log('🧪 Probando API de email en modo desarrollo...\n');
  
  const testData = {
    email: 'test@example.com',
    name: 'Usuario Test',
    role: 'coordinator',
    hospitalId: '1'
  };
  
  const postData = JSON.stringify(testData);
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/admin/users',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'Cookie': 'auth-token=test-token' // Token de prueba
    }
  };
  
  const req = http.request(options, (res) => {
    console.log(`📡 Status: ${res.statusCode}`);
    console.log(`📋 Headers:`, res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('📧 Respuesta:', data);
      
      if (res.statusCode === 200) {
        console.log('\n✅ API funcionando correctamente');
        console.log('📝 En modo desarrollo, los emails se simulan en consola');
      } else {
        console.log('\n⚠️  API respondió con error (esperado sin autenticación)');
        console.log('📝 Esto es normal - la API requiere autenticación real');
      }
    });
  });
  
  req.on('error', (error) => {
    console.error('❌ Error:', error.message);
  });
  
  req.write(postData);
  req.end();
}

testEmailAPI();
