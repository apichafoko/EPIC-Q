const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUsers() {
  try {
    console.log('🚀 Creando usuarios de prueba...');

    // 1. Crear usuario administrador de prueba
    const adminPassword = await bcrypt.hash('demo123', 12);
    const admin = await prisma.user.upsert({
      where: { email: 'demo@epic-q.com' },
      update: {},
      create: {
        email: 'demo@epic-q.com',
        name: 'Administrador EPIC-Q',
        password: adminPassword,
        role: 'admin',
        isActive: true,
        preferredLanguage: 'es',
        emailVerified: new Date(),
      },
    });
    console.log('✅ Admin creado:', admin.email);

    // 2. Crear hospital de prueba
    const hospital = await prisma.hospital.upsert({
      where: { redcap_id: 'TEST001' },
      update: {},
      create: {
        name: 'Hospital de Prueba EPIC-Q',
        province: 'Buenos Aires',
        city: 'La Plata',
        redcap_id: 'TEST001',
        status: 'active',
        participated_lasos: true,
      },
    });
    console.log('✅ Hospital creado:', hospital.name);

    // 2.1 Crear detalles del hospital
    await prisma.hospitalDetails.upsert({
      where: { hospital_id: hospital.id },
      update: {},
      create: {
        hospital_id: hospital.id,
        num_beds: 200,
        num_icu_beds: 20,
        num_operating_rooms: 8,
        avg_weekly_surgeries: 30,
        has_residency_program: true,
        has_preop_clinic: 'yes',
        has_rapid_response_team: true,
        financing_type: 'public',
        has_ethics_committee: true,
        university_affiliated: true,
      },
    });
    console.log('✅ Detalles del hospital creados');

    // 2.2 Crear progreso del hospital
    await prisma.hospitalProgress.upsert({
      where: { hospital_id: hospital.id },
      update: {},
      create: {
        hospital_id: hospital.id,
        descriptive_form_status: 'completed',
        ethics_submitted: true,
        ethics_approved: true,
        redcap_unit_created: true,
        coordinator_user_created: true,
        collaborator_users_created: 'completed',
        num_collaborators: 3,
        ready_for_recruitment: true,
        dates_assigned_period1: true,
        dates_assigned_period2: false,
      },
    });
    console.log('✅ Progreso del hospital creado');

    // 2.3 Crear contacto del hospital
    await prisma.contact.create({
      data: {
        hospital_id: hospital.id,
        name: 'Dr. Juan Pérez',
        email: 'coordinator@epic-q.com',
        phone: '+54 221 123-4567',
        role: 'coordinator',
        specialty: 'Cirugía General',
        is_primary: true,
      },
    });
    console.log('✅ Contacto del hospital creado');

    // 3. Crear coordinador de prueba
    const coordinatorPassword = await bcrypt.hash('Coord123!', 12);
    const coordinator = await prisma.user.upsert({
      where: { email: 'coordinator@epic-q.com' },
      update: {},
      create: {
        email: 'coordinator@epic-q.com',
        name: 'Dr. Juan Pérez',
        password: coordinatorPassword,
        role: 'coordinator',
        hospital_id: hospital.id,
        isActive: true,
        preferredLanguage: 'es',
        emailVerified: new Date(),
      },
    });
    console.log('✅ Coordinador creado:', coordinator.email);

    // 4. Crear algunos hospitales adicionales para testing
    const additionalHospitals = [
      {
        name: 'Hospital San Martín',
        province: 'Córdoba',
        city: 'Córdoba',
        redcap_id: 'TEST002',
        status: 'pending',
        participated_lasos: false,
      },
      {
        name: 'Clínica del Valle',
        province: 'Mendoza',
        city: 'Mendoza',
        redcap_id: 'TEST003',
        status: 'active',
        participated_lasos: true,
      },
    ];

    for (const hospitalData of additionalHospitals) {
      const newHospital = await prisma.hospital.upsert({
        where: { redcap_id: hospitalData.redcap_id },
        update: {},
        create: hospitalData,
      });
      console.log('✅ Hospital adicional creado:', newHospital.name);
    }

    // 5. Crear notificaciones de prueba
    const notifications = [
      {
        userId: coordinator.id,
        title: 'Bienvenido al sistema EPIC-Q',
        message: 'Tu cuenta ha sido configurada correctamente. Puedes comenzar a completar el formulario del hospital.',
        type: 'info',
        read: false,
      },
      {
        userId: coordinator.id,
        title: 'Recordatorio: Comité de Ética',
        message: 'Recuerda enviar la documentación del comité de ética antes del 15 de marzo.',
        type: 'warning',
        read: false,
      },
      {
        userId: admin.id,
        title: 'Nuevo hospital registrado',
        message: 'El Hospital de Prueba EPIC-Q ha completado el registro inicial.',
        type: 'success',
        read: true,
      },
    ];

    for (const notificationData of notifications) {
      await prisma.notification.create({
        data: notificationData,
      });
    }
    console.log('✅ Notificaciones de prueba creadas');

    console.log('\n🎉 ¡Usuarios de prueba creados exitosamente!');
    console.log('\n📋 Credenciales de acceso:');
    console.log('👨‍💼 Admin: demo@epic-q.com / demo123');
    console.log('👩‍⚕️ Coordinador: coordinator@epic-q.com / Coord123!');
    console.log('\n🌐 URLs de acceso:');
    console.log('🔗 Admin: http://localhost:3000/es/admin');
    console.log('🔗 Coordinador: http://localhost:3000/es/coordinator');
    console.log('🔗 Login: http://localhost:3000/es/auth/login');

  } catch (error) {
    console.error('❌ Error creando usuarios de prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers();
