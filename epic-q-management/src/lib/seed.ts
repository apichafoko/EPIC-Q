import { prisma } from './database';
import { mockHospitals, mockHospitalDetails, mockHospitalProgress, mockRecruitmentPeriods, mockCaseMetrics, mockCommunications, mockEmailTemplates, mockAlerts, mockUsers } from './mock-data';

// Función para poblar la base de datos con datos de ejemplo
export async function seedDatabase() {
  try {
    console.log('🌱 Iniciando seed de la base de datos...');

    // Limpiar datos existentes (en orden inverso por las foreign keys)
    console.log('🧹 Limpiando datos existentes...');
    await prisma.activity_logs.deleteMany();
    await prisma.communications.deleteMany();
    await prisma.case_metrics.deleteMany();
    await prisma.recruitment_periods.deleteMany();
    await prisma.hospital_progress.deleteMany();
    await prisma.hospital_details.deleteMany();
    await prisma.hospitals.deleteMany();
    await prisma.communication_templates.deleteMany();
    await prisma.alerts.deleteMany();
    await prisma.users.deleteMany();

    // Crear usuarios
    console.log('👥 Creando usuarios...');
    for (const user of mockUsers) {
      await prisma.users.create({
        data: {
          ...user,
          password: 'defaultPassword123'
        }
      });
    }

    // Crear hospitales
    console.log('🏥 Creando hospitales...');
    for (const hospital of mockHospitals) {
      await prisma.hospitals.create({
        data: {
          id: hospital.id,
          name: hospital.name,
          province: hospital.province,
          city: hospital.city,
          status: hospital.status,
          lasos_participation: hospital.participated_lasos,
          created_at: new Date(hospital.created_at),
          updated_at: new Date(hospital.updated_at)
        }
      });
    }

    // Crear detalles de hospitales
    console.log('📋 Creando detalles de hospitales...');
    for (const detail of mockHospitalDetails) {
      await prisma.hospital_details.create({
        data: {
          id: `detail_${detail.hospital_id}`,
          hospital_id: detail.hospital_id,
          avg_weekly_surgeries: detail.avg_weekly_surgeries,
          financing_type: detail.financing_type
        }
      });
    }


    // Crear progreso de hospitales
    console.log('📊 Creando progreso de hospitales...');
    for (const progress of mockHospitalProgress) {
      await prisma.hospital_progress.create({
        data: {
          id: `progress_${progress.hospital_id}`,
          hospital_id: progress.hospital_id,
          project_id: 'default-project-id',
          status: 'pending',
          progress_percentage: 0,
          notes: 'Progress notes',
          ethics_approved: progress.ethics_approved,
          ethics_approved_date: progress.ethics_approved ? new Date() : null,
          ethics_submitted: progress.ethics_submitted,
          ethics_submitted_date: progress.ethics_submitted ? new Date() : null
        }
      });
    }

    // Crear períodos de reclutamiento
    console.log('📅 Creando períodos de reclutamiento...');
    for (const period of mockRecruitmentPeriods) {
      await prisma.recruitment_periods.create({
        data: {
          id: period.id,
          project_hospital_id: `project_hospital_${period.hospital_id}`,
          period_number: period.period_number,
          start_date: new Date(period.start_date),
          end_date: new Date(period.end_date),
          target_cases: 100 // Valor por defecto
        }
      });
    }

    // Crear métricas de casos
    console.log('📈 Creando métricas de casos...');
    for (const metric of mockCaseMetrics) {
      await prisma.case_metrics.create({
        data: {
          id: `metric_${metric.hospital_id}_${Date.now()}`,
          hospital_id: metric.hospital_id,
          recorded_date: new Date(metric.recorded_date),
          cases_created: metric.cases_created,
          completion_percentage: metric.completion_percentage,
          last_case_date: metric.last_case_date ? new Date(metric.last_case_date) : null
        }
      });
    }

    // Crear comunicaciones
    console.log('💬 Creando comunicaciones...');
    for (const communication of mockCommunications) {
      await prisma.communications.create({
        data: {
          id: communication.id,
          hospital_id: communication.hospital_id,
          user_id: communication.user_id || 'default-user-id',
          type: communication.type || 'manual',
          subject: communication.subject || 'Sin asunto',
          body: communication.content || 'Sin contenido',
          channels: ['email'],
          sent_at: new Date(communication.sent_at)
        }
      });
    }

    // Crear templates de email
    console.log('📧 Creando templates de email...');
    for (const template of mockEmailTemplates) {
      await prisma.communication_templates.create({
        data: {
          id: template.id,
          name: template.name,
          email_subject: template.subject,
          email_body: template.body,
          variables: template.variables,
          category: template.category,
          is_active: template.is_active,
          usage_count: template.usage_count,
          created_at: new Date(template.created_at),
          updated_at: new Date(template.updated_at)
        }
      });
    }

    // Crear alertas
    console.log('🚨 Creando alertas...');
    for (const alert of mockAlerts) {
      await prisma.alerts.create({
        data: {
          id: alert.id,
          hospital_id: alert.hospital_id,
          type: alert.alert_type,
          severity: alert.severity,
          title: alert.title,
          message: alert.message,
          is_resolved: alert.is_resolved,
          created_at: new Date(alert.created_at)
        }
      });
    }

    console.log('✅ Seed completado exitosamente!');
    
    // Mostrar estadísticas
    const stats = await prisma.$transaction([
      prisma.hospitals.count(),
      prisma.communications.count(),
      prisma.communication_templates.count(),
      prisma.alerts.count(),
      prisma.users.count()
    ]);

    console.log('📊 Estadísticas de la base de datos:');
    console.log(`- Hospitales: ${stats[0]}`);
    console.log(`- Comunicaciones: ${stats[1]}`);
    console.log(`- Templates: ${stats[2]}`);
    console.log(`- Alertas: ${stats[3]}`);
    console.log(`- Usuarios: ${stats[4]}`);

  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    throw error;
  }
}

// Función para limpiar la base de datos
export async function clearDatabase() {
  try {
    console.log('🧹 Limpiando base de datos...');
    
    await prisma.activity_logs.deleteMany();
    await prisma.communications.deleteMany();
    await prisma.case_metrics.deleteMany();
    await prisma.recruitment_periods.deleteMany();
    await prisma.hospital_progress.deleteMany();
    await prisma.hospital_details.deleteMany();
    await prisma.hospitals.deleteMany();
    await prisma.communication_templates.deleteMany();
    await prisma.alerts.deleteMany();
    await prisma.users.deleteMany();

    console.log('✅ Base de datos limpiada exitosamente!');
  } catch (error) {
    console.error('❌ Error al limpiar la base de datos:', error);
    throw error;
  }
}

// Función para verificar el estado de la base de datos
export async function checkDatabaseStatus() {
  try {
    const stats = await prisma.$transaction([
      prisma.hospitals.count(),
      prisma.communications.count(),
      prisma.communication_templates.count(),
      prisma.alerts.count(),
      prisma.users.count()
    ]);

    return {
      hospitals: stats[0],
      communications: stats[1],
      templates: stats[2],
      alerts: stats[3],
      users: stats[4],
      total: stats.reduce((sum, count) => sum + count, 0)
    };
  } catch (error) {
    console.error('❌ Error al verificar el estado de la base de datos:', error);
    throw error;
  }
}
