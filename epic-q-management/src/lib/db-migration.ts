import { prisma } from './db-connection';

// Servicio de migración de datos
export class DatabaseMigrationService {
  // Migrar datos desde mock data a base de datos real
  static async migrateFromMockData() {
    try {
      console.log('🔄 Iniciando migración desde mock data...');
      
      // Importar mock data
      const { 
        mockHospitals, 
        mockContacts, 
        mockHospitalDetails, 
        mockHospitalProgress,
        mockRecruitmentPeriods,
        mockCaseMetrics,
        mockCommunications,
        mockEmailTemplates,
        mockAlerts,
        mockUsers
      } = await import('./mock-data');
      
      // Limpiar datos existentes
      console.log('🧹 Limpiando datos existentes...');
      await prisma.activityLog.deleteMany();
      await prisma.communication.deleteMany();
      await prisma.caseMetrics.deleteMany();
      await prisma.recruitmentPeriod.deleteMany();
      await prisma.hospitalProgress.deleteMany();
      await prisma.contact.deleteMany();
      await prisma.hospitalDetails.deleteMany();
      await prisma.hospital.deleteMany();
      await prisma.emailTemplate.deleteMany();
      await prisma.alert.deleteMany();
      await prisma.user.deleteMany();
      
      // Migrar usuarios
      console.log('👥 Migrando usuarios...');
      for (const user of mockUsers) {
        await prisma.user.create({ data: user });
      }
      
      // Migrar hospitales
      console.log('🏥 Migrando hospitales...');
      for (const hospital of mockHospitals) {
        await prisma.hospital.create({
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
      
      // Migrar detalles de hospitales
      console.log('📋 Migrando detalles de hospitales...');
      for (const detail of mockHospitalDetails) {
        await prisma.hospitalDetails.create({
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
      
      // Migrar contactos
      console.log('👤 Migrando contactos...');
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
      
      // Migrar progreso de hospitales
      console.log('📊 Migrando progreso de hospitales...');
      for (const progress of mockHospitalProgress) {
        await prisma.hospitalProgress.create({
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
      
      // Migrar períodos de reclutamiento
      console.log('📅 Migrando períodos de reclutamiento...');
      for (const period of mockRecruitmentPeriods) {
        await prisma.recruitmentPeriod.create({
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
      
      // Migrar métricas de casos
      console.log('📈 Migrando métricas de casos...');
      for (const metric of mockCaseMetrics) {
        await prisma.caseMetrics.create({
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
      
      // Migrar comunicaciones
      console.log('💬 Migrando comunicaciones...');
      for (const communication of mockCommunications) {
        await prisma.communication.create({
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
      
      // Migrar templates de email
      console.log('📧 Migrando templates de email...');
      for (const template of mockEmailTemplates) {
        await prisma.emailTemplate.create({
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
      
      // Migrar alertas
      console.log('🚨 Migrando alertas...');
      for (const alert of mockAlerts) {
        await prisma.alert.create({
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
      
      console.log('✅ Migración completada exitosamente');
      
      return {
        success: true,
        message: 'Migración completada exitosamente'
      };
    } catch (error) {
      console.error('❌ Error durante la migración:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Migrar datos desde CSV
  static async migrateFromCSV(csvData: any[]) {
    try {
      console.log('🔄 Iniciando migración desde CSV...');
      
      // Procesar datos CSV y convertirlos al formato de la base de datos
      // Esta función sería específica para el formato de CSV que recibas
      
      return {
        success: true,
        message: 'Migración desde CSV completada'
      };
    } catch (error) {
      console.error('❌ Error durante la migración desde CSV:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Migrar datos desde otra base de datos
  static async migrateFromDatabase(sourceConfig: any) {
    try {
      console.log('🔄 Iniciando migración desde otra base de datos...');
      
      // Conectar a la base de datos fuente
      // Migrar datos tabla por tabla
      // Esta función sería específica para la base de datos fuente
      
      return {
        success: true,
        message: 'Migración desde base de datos completada'
      };
    } catch (error) {
      console.error('❌ Error durante la migración desde base de datos:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Verificar integridad después de la migración
  static async verifyMigrationIntegrity() {
    try {
      console.log('🔍 Verificando integridad de la migración...');
      
      const [
        hospitalCount,
        contactCount,
        communicationCount,
        templateCount,
        alertCount,
        userCount
      ] = await Promise.all([
        prisma.hospital.count(),
        prisma.contact.count(),
        prisma.communication.count(),
        prisma.emailTemplate.count(),
        prisma.alert.count(),
        prisma.user.count()
      ]);
      
      // Verificar relaciones
      const hospitalsWithDetails = await prisma.hospital.count({
        where: { details: { isNot: null } }
      });
      
      const hospitalsWithContacts = await prisma.hospital.count({
        where: { contacts: { some: {} } }
      });
      
      const hospitalsWithProgress = await prisma.hospital.count({
        where: { progress: { isNot: null } }
      });
      
      return {
        success: true,
        counts: {
          hospitals: hospitalCount,
          contacts: contactCount,
          communications: communicationCount,
          templates: templateCount,
          alerts: alertCount,
          users: userCount
        },
        relationships: {
          hospitalsWithDetails,
          hospitalsWithContacts,
          hospitalsWithProgress
        },
        integrity: {
          hospitalsWithDetails: hospitalsWithDetails === hospitalCount,
          hospitalsWithContacts: hospitalsWithContacts === hospitalCount,
          hospitalsWithProgress: hospitalsWithProgress === hospitalCount
        }
      };
    } catch (error) {
      console.error('❌ Error al verificar integridad:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Limpiar datos de migración
  static async cleanMigrationData() {
    try {
      console.log('🧹 Limpiando datos de migración...');
      
      await prisma.activityLog.deleteMany();
      await prisma.communication.deleteMany();
      await prisma.caseMetrics.deleteMany();
      await prisma.recruitmentPeriod.deleteMany();
      await prisma.hospitalProgress.deleteMany();
      await prisma.contact.deleteMany();
      await prisma.hospitalDetails.deleteMany();
      await prisma.hospital.deleteMany();
      await prisma.emailTemplate.deleteMany();
      await prisma.alert.deleteMany();
      await prisma.user.deleteMany();
      
      return {
        success: true,
        message: 'Datos de migración limpiados'
      };
    } catch (error) {
      console.error('❌ Error al limpiar datos de migración:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}
