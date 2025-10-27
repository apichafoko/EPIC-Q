#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🔄 Ejecutando migraciones de base de datos...\n');

try {
  const environment = process.env.NODE_ENV || 'development';
  const provider = process.env.DB_PROVIDER || 'postgresql';
  
  console.log(`📊 Entorno: ${environment}`);
  console.log(`🗄️ Proveedor: ${provider}`);
  
  // Verificar que DATABASE_URL esté configurada
  if (!process.env.DATABASE_URL) {
    console.error('❌ Error: DATABASE_URL no está configurada');
    console.log('💡 Asegúrate de tener un archivo .env.local con la URL de tu base de datos');
    process.exit(1);
  }
  
  // Generar cliente de Prisma
  console.log('\n📦 Generando cliente de Prisma...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  // Ejecutar migraciones según el entorno
  if (environment === 'production') {
    console.log('\n🚀 Ejecutando migraciones en producción...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  } else {
    console.log('\n🛠️ Ejecutando migraciones en desarrollo...');
    execSync('npx prisma migrate dev --name update', { stdio: 'inherit' });
  }
  
  console.log('\n✅ Migraciones completadas exitosamente!');
  
  // Mostrar información de la base de datos
  console.log('\n📊 Información de la base de datos:');
  console.log(`- Proveedor: ${provider}`);
  console.log(`- URL: ${process.env.DATABASE_URL.replace(/\/\/.*@/, '//***:***@')}`);
  
} catch (error) {
  console.error('\n❌ Error durante las migraciones:', error.message);
  process.exit(1);
}
