import { prisma } from './database';
import { mockHospitals, mockContacts, mockHospitalDetails, mockHospitalProgress, mockRecruitmentPeriods, mockCaseMetrics, mockCommunications, mockEmailTemplates, mockAlerts, mockUsers } from './mock-data';

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
    await prisma.contact.deleteMany();
    await prisma.hospital_details.deleteMany();
    await prisma.hospitals.deleteMany();
    await prisma.communication_templates.deleteMany();
    await prisma.alerts.deleteMany();
    await prisma.users.deleteMany();

    // Crear usuarios
    console.log('👥 Creando usuarios...');
    for (const user of mockUsers) {
      await prisma.users.create({
        data: user
      });
    }

    // Crear hospitales
    console.log('🏥 Creando hospitales...');
    for (const hospital of mockHospitals) {
      await prisma.hospitals.create({
        data: {
          id: hospital.id,
          redcap_id: hospital.redcap_id,
          name: hospital.name,
          province: hospital.province,
          city: hospital.city,
          status: hospital.status,
          participated_lasos: hospital.participated_lasos,
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
          hospital_id: detail.hospital_id,
          num_beds: detail.num_beds,
          num_operating_rooms: detail.num_operating_rooms,
          num_icu_beds: detail.num_icu_beds,
          avg_weekly_surgeries: detail.avg_weekly_surgeries,
          has_residency_program: detail.has_residency_program,
          has_preop_clinic: detail.has_preop_clinic,
          has_rapid_response_team: detail.has_rapid_response_team,
          financing_type: detail.financing_type,
          has_ethics_committee: detail.has_ethics_committee,
          university_affiliated: detail.university_affiliated,
          notes: detail.notes
        }
      });
    }

    // Crear contactos
    console.log('👤 Creando contactos...');
    for (const contact of mockContacts) {
      await prisma.contact.create({
        data: {
          id: contact.id,
          hospital_id: contact.hospital_id,
          role: contact.role,
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          specialty: contact.specialty,
          is_primary: contact.is_primary
        }
      });
    }

    // Crear progreso de hospitales
    console.log('📊 Creando progreso de hospitales...');
    for (const progress of mockHospitalProgress) {
      await prisma.hospital_progress.create({
        data: {
          hospital_id: progress.hospital_id,
          descriptive_form_status: progress.descriptive_form_status,
          ethics_submitted: progress.ethics_submitted,
          ethics_approved: progress.ethics_approved,
          redcap_unit_created: progress.redcap_unit_created,
          coordinator_user_created: progress.coordinator_user_created,
          collaborator_users_created: progress.collaborator_users_created,
          num_collaborators: progress.num_collaborators,
          ready_for_recruitment: progress.ready_for_recruitment,
          dates_assigned_period1: progress.dates_assigned_period1,
          dates_assigned_period2: progress.dates_assigned_period2,
          updated_at: new Date(progress.updated_at)
        }
      });
    }

    // Crear períodos de reclutamiento
    console.log('📅 Creando períodos de reclutamiento...');
    for (const period of mockRecruitmentPeriods) {
      await prisma.recruitment_periods.create({
        data: {
          id: period.id,
          hospital_id: period.hospital_id,
          period_number: period.period_number,
          start_date: new Date(period.start_date),
          end_date: new Date(period.end_date),
          status: period.status
        }
      });
    }

    // Crear métricas de casos
    console.log('📈 Creando métricas de casos...');
    for (const metric of mockCaseMetrics) {
      await prisma.case_metrics.create({
        data: {
          id: metric.id,
          hospital_id: metric.hospital_id,
          recorded_date: new Date(metric.recorded_date),
          cases_created: metric.cases_created,
          cases_completed: metric.cases_completed,
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
          type: communication.type,
          subject: communication.subject,
          content: communication.content,
          sent_by: communication.sent_by,
          sent_to: communication.sent_to,
          template_used: communication.template_used,
          status: communication.status,
          created_at: new Date(communication.created_at)
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
          subject: template.subject,
          body: template.body,
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
          alert_type: alert.alert_type,
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
      prisma.contact.count(),
      prisma.communications.count(),
      prisma.communication_templates.count(),
      prisma.alerts.count(),
      prisma.users.count()
    ]);

    console.log('📊 Estadísticas de la base de datos:');
    console.log(`- Hospitales: ${stats[0]}`);
    console.log(`- Contactos: ${stats[1]}`);
    console.log(`- Comunicaciones: ${stats[2]}`);
    console.log(`- Templates: ${stats[3]}`);
    console.log(`- Alertas: ${stats[4]}`);
    console.log(`- Usuarios: ${stats[5]}`);

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
    await prisma.contact.deleteMany();
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
      prisma.contact.count(),
      prisma.communications.count(),
      prisma.communication_templates.count(),
      prisma.alerts.count(),
      prisma.users.count()
    ]);

    return {
      hospitals: stats[0],
      contacts: stats[1],
      communications: stats[2],
      templates: stats[3],
      alerts: stats[4],
      users: stats[5],
      total: stats.reduce((sum, count) => sum + count, 0)
    };
  } catch (error) {
    console.error('❌ Error al verificar el estado de la base de datos:', error);
    throw error;
  }
}
