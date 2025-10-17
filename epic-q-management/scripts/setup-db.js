#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Configurando base de datos para EPIC-Q...\n');

try {
  // Generar cliente de Prisma
  console.log('📦 Generando cliente de Prisma...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  // Ejecutar migraciones
  console.log('\n🔄 Ejecutando migraciones...');
  execSync('npx prisma migrate dev --name init', { stdio: 'inherit' });

  // Poblar con datos de ejemplo
  console.log('\n🌱 Poblando base de datos con datos de ejemplo...');
  execSync('npx tsx src/lib/seed.ts', { stdio: 'inherit' });

  console.log('\n✅ ¡Base de datos configurada exitosamente!');
  console.log('\n📝 Próximos pasos:');
  console.log('1. Configura tu archivo .env.local con la URL de tu base de datos');
  console.log('2. Ejecuta "npm run dev" para iniciar el servidor');
  console.log('3. Visita http://localhost:3000 para ver la aplicación');

} catch (error) {
  console.error('\n❌ Error durante la configuración:', error.message);
  process.exit(1);
}
