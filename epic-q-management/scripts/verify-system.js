const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifySystem() {
  try {
    console.log('🔍 Verificando sistema EPIC-Q...\n');

    // 1. Verificar conexión a la base de datos
    console.log('1️⃣ Verificando conexión a la base de datos...');
    await prisma.$connect();
    console.log('✅ Conexión exitosa');

    // 2. Verificar usuarios
    console.log('\n2️⃣ Verificando usuarios...');
    const users = await prisma.user.findMany({
      include: {
        hospital: true,
      },
    });
    console.log(`✅ ${users.length} usuarios encontrados:`);
    users.forEach(user => {
      console.log(`   - ${user.name} (${user.email}) - ${user.role} - ${user.isActive ? 'Activo' : 'Inactivo'}`);
      if (user.hospital) {
        console.log(`     Hospital: ${user.hospital.name}`);
      }
    });

    // 3. Verificar hospitales
    console.log('\n3️⃣ Verificando hospitales...');
    const hospitals = await prisma.hospital.findMany();
    console.log(`✅ ${hospitals.length} hospitales encontrados:`);
    hospitals.forEach(hospital => {
      console.log(`   - ${hospital.name} (${hospital.province}, ${hospital.city}) - ${hospital.status}`);
    });

    // 4. Verificar notificaciones
    console.log('\n4️⃣ Verificando notificaciones...');
    const notifications = await prisma.notification.findMany();
    console.log(`✅ ${notifications.length} notificaciones encontradas`);

    // 5. Verificar roles y permisos
    console.log('\n5️⃣ Verificando roles...');
    const admins = await prisma.user.findMany({ where: { role: 'admin' } });
    const coordinators = await prisma.user.findMany({ where: { role: 'coordinator' } });
    console.log(`✅ ${admins.length} administradores`);
    console.log(`✅ ${coordinators.length} coordinadores`);

    // 6. Verificar datos de prueba
    console.log('\n6️⃣ Verificando datos de prueba...');
    const testAdmin = await prisma.user.findUnique({ where: { email: 'admin@epic-q.com' } });
    const testCoordinator = await prisma.user.findUnique({ where: { email: 'coordinator@epic-q.com' } });
    
    if (testAdmin) {
      console.log('✅ Usuario admin de prueba encontrado');
    } else {
      console.log('⚠️ Usuario admin de prueba no encontrado');
    }

    if (testCoordinator) {
      console.log('✅ Usuario coordinador de prueba encontrado');
    } else {
      console.log('⚠️ Usuario coordinador de prueba no encontrado');
    }

    // 7. Verificar configuración de la aplicación
    console.log('\n7️⃣ Verificando configuración...');
    const requiredEnvVars = [
      'DATABASE_URL',
      'NEXTAUTH_URL',
      'NEXTAUTH_SECRET',
      'EMAIL_SERVER_HOST',
      'EMAIL_SERVER_PORT',
      'EMAIL_SERVER_USER',
      'EMAIL_SERVER_PASSWORD',
      'EMAIL_FROM',
    ];

    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missingEnvVars.length === 0) {
      console.log('✅ Todas las variables de entorno requeridas están configuradas');
    } else {
      console.log('⚠️ Variables de entorno faltantes:');
      missingEnvVars.forEach(envVar => {
        console.log(`   - ${envVar}`);
      });
    }

    console.log('\n🎉 ¡Verificación completada!');
    console.log('\n📋 Resumen:');
    console.log(`   - Usuarios: ${users.length}`);
    console.log(`   - Hospitales: ${hospitals.length}`);
    console.log(`   - Notificaciones: ${notifications.length}`);
    console.log(`   - Administradores: ${admins.length}`);
    console.log(`   - Coordinadores: ${coordinators.length}`);

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifySystem();
