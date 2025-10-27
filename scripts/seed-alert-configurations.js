const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedAlertConfigurations() {
  console.log('🌱 Iniciando seed de configuraciones de alertas...');

  const configurations = [
    {
      alert_type: 'ethics_approval_pending',
      enabled: true,
      notify_admin: true,
      notify_coordinator: true,
      auto_send_email: false,
      threshold_value: 30, // 30 días
      email_template_id: null
    },
    {
      alert_type: 'missing_documentation',
      enabled: true,
      notify_admin: true,
      notify_coordinator: true,
      auto_send_email: false,
      threshold_value: null,
      email_template_id: null
    },
    {
      alert_type: 'upcoming_recruitment_period',
      enabled: true,
      notify_admin: true,
      notify_coordinator: true,
      auto_send_email: true,
      threshold_value: 60, // 60 días
      email_template_id: null
    },
    {
      alert_type: 'no_activity_30_days',
      enabled: true,
      notify_admin: true,
      notify_coordinator: false, // Solo admin para evitar spam
      auto_send_email: false,
      threshold_value: 30, // 30 días
      email_template_id: null
    },
    {
      alert_type: 'low_completion_rate',
      enabled: true,
      notify_admin: true,
      notify_coordinator: true,
      auto_send_email: false,
      threshold_value: 65, // 65%
      email_template_id: null
    }
  ];

  try {
    // Limpiar configuraciones existentes
    await prisma.alert_configurations.deleteMany({});
    console.log('✅ Configuraciones existentes eliminadas');

    // Crear nuevas configuraciones
    for (const config of configurations) {
      await prisma.alert_configurations.create({
        data: config
      });
      console.log(`✅ Configuración creada: ${config.alert_type}`);
    }

    console.log('🎉 Seed de configuraciones de alertas completado exitosamente');
  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  seedAlertConfigurations()
    .then(() => {
      console.log('✅ Script completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

module.exports = { seedAlertConfigurations };
