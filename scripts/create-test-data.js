const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestData() {
  try {
    console.log('🧪 Creando datos de prueba para el sistema de comunicaciones y alertas...');
    
    // 1. Crear un proyecto de prueba
    const testProject = await prisma.projects.create({
      data: {
        id: 'test-project-' + Date.now(),
        name: 'Proyecto de Prueba EPIC-Q',
        description: 'Proyecto de prueba para el sistema de comunicaciones y alertas',
        status: 'active',
        start_date: new Date('2025-01-01'),
        end_date: new Date('2025-12-31'),
        required_periods: 3,
        created_at: new Date(),
        updated_at: new Date()
      }
    });
    console.log('✅ Proyecto de prueba creado:', testProject.name);

    // 2. Crear un hospital de prueba
    const testHospital = await prisma.hospitals.create({
      data: {
        id: 'test-hospital-' + Date.now(),
        name: 'Hospital de Prueba',
        province: 'Buenos Aires',
        city: 'La Plata',
        address: 'Calle de Prueba 123',
        phone: '+54 221 123-4567',
        email: 'prueba@hospital.com',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      }
    });
    console.log('✅ Hospital de prueba creado:', testHospital.name);

    // 3. Crear un coordinador de prueba
    const testCoordinator = await prisma.users.upsert({
      where: { email: 'coordinator@test.com' },
      update: {},
      create: {
        id: 'test-coordinator-' + Date.now(),
        name: 'Coordinador de Prueba',
        email: 'coordinator@test.com',
        password: '$2a$10$test.hash.for.testing',
        role: 'coordinator',
        hospitalId: testHospital.id,
        isActive: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    });
    console.log('✅ Coordinador de prueba creado:', testCoordinator.name);

    // 4. Vincular hospital al proyecto
    const projectHospital = await prisma.project_hospitals.create({
      data: {
        id: 'test-ph-' + Date.now(),
        project_id: testProject.id,
        hospital_id: testHospital.id,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      }
    });
    console.log('✅ Hospital vinculado al proyecto');

    // 5. Crear coordinador del proyecto
    const projectCoordinator = await prisma.project_coordinators.create({
      data: {
        id: 'test-pc-' + Date.now(),
        project_id: testProject.id,
        hospital_id: testHospital.id,
        user_id: testCoordinator.id,
        is_active: true,
        role: 'coordinator',
        created_at: new Date(),
        updated_at: new Date()
      }
    });
    console.log('✅ Coordinador asignado al proyecto');

    // 6. Crear algunas alertas de prueba
    const alerts = [
      {
        id: 'test-alert-1-' + Date.now(),
        hospital_id: testHospital.id,
        project_id: testProject.id,
        type: 'missing_documentation',
        title: 'Documentación Pendiente',
        message: 'El hospital tiene documentación pendiente que requiere atención',
        severity: 'high',
        metadata: {
          missingDocuments: ['Formulario de hospital', 'Aprobación de ética'],
          deadline: '2025-11-01'
        },
        is_resolved: false,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'test-alert-2-' + Date.now(),
        hospital_id: testHospital.id,
        project_id: testProject.id,
        type: 'upcoming_recruitment_period',
        title: 'Período de Reclutamiento Próximo',
        message: 'Se acerca un período de reclutamiento que requiere preparación',
        severity: 'medium',
        metadata: {
          periodName: 'Período Q1 2025',
          startDate: '2025-02-01',
          endDate: '2025-04-30',
          daysUntilStart: 15
        },
        is_resolved: false,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    for (const alert of alerts) {
      await prisma.alerts.create({ data: alert });
    }
    console.log('✅ Alertas de prueba creadas:', alerts.length);

    // 7. Crear algunas comunicaciones de prueba
    const communications = [
      {
        id: 'test-comm-1-' + Date.now(),
        hospital_id: testHospital.id,
        project_id: testProject.id,
        user_id: testCoordinator.id,
        sender_id: 'admin-1760849513476-gbkryi01o', // ID del admin actual
        type: 'manual',
        subject: 'Bienvenido al Proyecto de Prueba',
        body: 'Te damos la bienvenida al proyecto de prueba. Por favor, revisa la documentación requerida.',
        channels: ['email', 'in_app'],
        email_status: 'sent',
        sent_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'test-comm-2-' + Date.now(),
        hospital_id: testHospital.id,
        project_id: testProject.id,
        user_id: testCoordinator.id,
        alert_id: alerts[0].id,
        type: 'auto_alert',
        subject: 'Alerta: Documentación Pendiente',
        body: 'Se ha detectado documentación pendiente en tu hospital. Por favor, revisa y completa los documentos faltantes.',
        channels: ['in_app'],
        email_status: null,
        sent_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    for (const comm of communications) {
      await prisma.communications.create({ data: comm });
    }
    console.log('✅ Comunicaciones de prueba creadas:', communications.length);

    // 8. Crear algunas notificaciones in-app
    const notifications = [
      {
        id: 'test-notif-1-' + Date.now(),
        userId: testCoordinator.id,
        title: 'Nueva Comunicación',
        message: 'Has recibido una nueva comunicación del administrador',
        type: 'communication',
        isRead: false,
        created_at: new Date()
      },
      {
        id: 'test-notif-2-' + Date.now(),
        userId: testCoordinator.id,
        title: 'Alerta de Documentación',
        message: 'Documentación pendiente en tu hospital',
        type: 'alert',
        isRead: false,
        created_at: new Date()
      }
    ];

    for (const notif of notifications) {
      await prisma.notifications.create({ data: notif });
    }
    console.log('✅ Notificaciones de prueba creadas:', notifications.length);

    // 9. Crear configuraciones de alertas
    const alertConfigs = [
      {
        id: 'test-config-1-' + Date.now(),
        alert_type: 'missing_documentation',
        enabled: true,
        notify_admin: true,
        notify_coordinator: true,
        auto_send_email: true,
        threshold_value: 7,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'test-config-2-' + Date.now(),
        alert_type: 'upcoming_recruitment_period',
        enabled: true,
        notify_admin: true,
        notify_coordinator: true,
        auto_send_email: false,
        threshold_value: 14,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    for (const config of alertConfigs) {
      await prisma.alert_configurations.upsert({
        where: { alert_type: config.alert_type },
        update: {},
        create: config
      });
    }
    console.log('✅ Configuraciones de alertas creadas:', alertConfigs.length);

    console.log('\n🎉 Datos de prueba creados exitosamente!');
    console.log('\n📊 Resumen:');
    console.log(`   - Proyecto: ${testProject.name}`);
    console.log(`   - Hospital: ${testHospital.name}`);
    console.log(`   - Coordinador: ${testCoordinator.name}`);
    console.log(`   - Alertas: ${alerts.length}`);
    console.log(`   - Comunicaciones: ${communications.length}`);
    console.log(`   - Notificaciones: ${notifications.length}`);
    console.log(`   - Configuraciones: ${alertConfigs.length}`);

  } catch (error) {
    console.error('❌ Error creando datos de prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestData();
