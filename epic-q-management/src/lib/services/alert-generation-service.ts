import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AlertGenerationResult {
  alertType: string;
  generated: number;
  skipped: number;
  errors: string[];
}

export interface AlertGenerationSummary {
  totalGenerated: number;
  totalSkipped: number;
  totalErrors: number;
  results: AlertGenerationResult[];
}

/**
 * Genera alertas para aprobaciones de ética pendientes
 */
export async function generateEthicsApprovalAlerts(): Promise<AlertGenerationResult> {
  const result: AlertGenerationResult = {
    alertType: 'ethics_approval_pending',
    generated: 0,
    skipped: 0,
    errors: []
  };

  try {
    // Obtener configuración
    const config = await prisma.alert_configurations.findUnique({
      where: { alert_type: 'ethics_approval_pending' }
    });

    if (!config?.enabled) {
      console.log('⚠️ Alertas de ética deshabilitadas');
      return result;
    }

    const thresholdDays = config.threshold_value || 30;
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - thresholdDays);

    // Buscar hospitales con ética pendiente por más de X días
    const hospitalsWithPendingEthics = await prisma.hospitals.findMany({
      where: {
        hospital_details: {
          ethics_approval_status: 'pending'
        },
        hospital_details: {
          ethics_submission_date: {
            lte: thresholdDate
          }
        }
      },
      include: {
        hospital_details: true,
        projects: {
          include: {
            projects: true
          }
        }
      }
    });

    for (const hospital of hospitalsWithPendingEthics) {
      try {
        // Verificar si ya existe una alerta activa para este hospital
        const existingAlert = await prisma.alerts.findFirst({
          where: {
            hospital_id: hospital.id,
            type: 'ethics_approval_pending',
            is_resolved: false
          }
        });

        if (existingAlert) {
          result.skipped++;
          continue;
        }

        // Crear nueva alerta
        const alert = await prisma.alerts.create({
          data: {
            id: `alert_${Date.now()}_${hospital.id}`,
            hospital_id: hospital.id,
            project_id: hospital.projects[0]?.project_id || null,
            type: 'ethics_approval_pending',
            title: 'Aprobación de Ética Pendiente',
            message: `El hospital ${hospital.name} tiene la aprobación de ética pendiente desde hace más de ${thresholdDays} días.`,
            severity: 'high',
            metadata: {
              hospital_name: hospital.name,
              ethics_submission_date: hospital.hospital_details?.ethics_submission_date,
              days_pending: Math.floor((Date.now() - (hospital.hospital_details?.ethics_submission_date?.getTime() || 0)) / (1000 * 60 * 60 * 24)),
              threshold_days: thresholdDays
            }
          }
        });

        result.generated++;

        // Si está configurado para envío automático de email
        if (config.auto_send_email) {
          await triggerAutomaticCommunication(alert, config);
        }

      } catch (error) {
        result.errors.push(`Hospital ${hospital.id}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    }

  } catch (error) {
    result.errors.push(`Error general: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }

  return result;
}

/**
 * Genera alertas para documentación faltante
 */
export async function generateMissingDocumentationAlerts(): Promise<AlertGenerationResult> {
  const result: AlertGenerationResult = {
    alertType: 'missing_documentation',
    generated: 0,
    skipped: 0,
    errors: []
  };

  try {
    const config = await prisma.alert_configurations.findUnique({
      where: { alert_type: 'missing_documentation' }
    });

    if (!config?.enabled) {
      console.log('⚠️ Alertas de documentación faltante deshabilitadas');
      return result;
    }

    // Buscar hospitales con documentación incompleta
    const hospitalsWithMissingDocs = await prisma.hospitals.findMany({
      where: {
        OR: [
          { hospital_details: { hospital_form_status: 'pending' } },
          { hospital_details: { ethics_approval_status: 'pending' } }
        ]
      },
      include: {
        hospital_details: true,
        projects: {
          include: {
            projects: true
          }
        }
      }
    });

    for (const hospital of hospitalsWithMissingDocs) {
      try {
        const existingAlert = await prisma.alerts.findFirst({
          where: {
            hospital_id: hospital.id,
            type: 'missing_documentation',
            is_resolved: false
          }
        });

        if (existingAlert) {
          result.skipped++;
          continue;
        }

        const missingDocs = [];
        if (hospital.hospital_details?.hospital_form_status === 'pending') {
          missingDocs.push('Formulario del Hospital');
        }
        if (hospital.hospital_details?.ethics_approval_status === 'pending') {
          missingDocs.push('Aprobación de Ética');
        }

        const alert = await prisma.alerts.create({
          data: {
            id: `alert_${Date.now()}_${hospital.id}`,
            hospital_id: hospital.id,
            project_id: hospital.projects[0]?.project_id || null,
            type: 'missing_documentation',
            title: 'Documentación Faltante',
            message: `El hospital ${hospital.name} tiene documentación faltante: ${missingDocs.join(', ')}.`,
            severity: 'medium',
            metadata: {
              hospital_name: hospital.name,
              missing_documents: missingDocs,
              hospital_form_status: hospital.hospital_details?.hospital_form_status,
              ethics_approval_status: hospital.hospital_details?.ethics_approval_status
            }
          }
        });

        result.generated++;

        if (config.auto_send_email) {
          await triggerAutomaticCommunication(alert, config);
        }

      } catch (error) {
        result.errors.push(`Hospital ${hospital.id}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    }

  } catch (error) {
    result.errors.push(`Error general: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }

  return result;
}

/**
 * Genera alertas para períodos de reclutamiento próximos
 */
export async function generateUpcomingRecruitmentAlerts(): Promise<AlertGenerationResult> {
  const result: AlertGenerationResult = {
    alertType: 'upcoming_recruitment_period',
    generated: 0,
    skipped: 0,
    errors: []
  };

  try {
    const config = await prisma.alert_configurations.findUnique({
      where: { alert_type: 'upcoming_recruitment_period' }
    });

    if (!config?.enabled) {
      console.log('⚠️ Alertas de períodos próximos deshabilitadas');
      return result;
    }

    const thresholdDays = config.threshold_value || 60;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + thresholdDays);

    // Buscar períodos de reclutamiento próximos
    const upcomingPeriods = await prisma.recruitment_periods.findMany({
      where: {
        start_date: {
          lte: futureDate,
          gte: new Date() // Solo futuros
        }
      },
      include: {
        project_hospitals: {
          include: {
            hospitals: true,
            projects: true
          }
        }
      }
    });

    for (const period of upcomingPeriods) {
      try {
        const hospital = period.project_hospitals.hospitals;
        const project = period.project_hospitals.projects;

        const existingAlert = await prisma.alerts.findFirst({
          where: {
            hospital_id: hospital.id,
            type: 'upcoming_recruitment_period',
            is_resolved: false,
            metadata: {
              path: ['period_id'],
              equals: period.id
            }
          }
        });

        if (existingAlert) {
          result.skipped++;
          continue;
        }

        const daysUntilStart = Math.ceil((period.start_date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

        const alert = await prisma.alerts.create({
          data: {
            id: `alert_${Date.now()}_${hospital.id}_${period.id}`,
            hospital_id: hospital.id,
            project_id: project.id,
            type: 'upcoming_recruitment_period',
            title: 'Período de Reclutamiento Próximo',
            message: `El período de reclutamiento para ${hospital.name} en el proyecto ${project.name} comienza en ${daysUntilStart} días.`,
            severity: 'medium',
            metadata: {
              hospital_name: hospital.name,
              project_name: project.name,
              period_id: period.id,
              start_date: period.start_date,
              days_until_start: daysUntilStart,
              threshold_days: thresholdDays
            }
          }
        });

        result.generated++;

        if (config.auto_send_email) {
          await triggerAutomaticCommunication(alert, config);
        }

      } catch (error) {
        result.errors.push(`Período ${period.id}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    }

  } catch (error) {
    result.errors.push(`Error general: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }

  return result;
}

/**
 * Genera alertas para hospitales sin actividad
 */
export async function generateNoActivityAlerts(): Promise<AlertGenerationResult> {
  const result: AlertGenerationResult = {
    alertType: 'no_activity_30_days',
    generated: 0,
    skipped: 0,
    errors: []
  };

  try {
    const config = await prisma.alert_configurations.findUnique({
      where: { alert_type: 'no_activity_30_days' }
    });

    if (!config?.enabled) {
      console.log('⚠️ Alertas de inactividad deshabilitadas');
      return result;
    }

    const thresholdDays = config.threshold_value || 30;
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - thresholdDays);

    // Buscar hospitales sin actividad reciente
    const inactiveHospitals = await prisma.hospitals.findMany({
      where: {
        updated_at: {
          lte: thresholdDate
        }
      },
      include: {
        projects: {
          include: {
            projects: true
          }
        }
      }
    });

    for (const hospital of inactiveHospitals) {
      try {
        const existingAlert = await prisma.alerts.findFirst({
          where: {
            hospital_id: hospital.id,
            type: 'no_activity_30_days',
            is_resolved: false
          }
        });

        if (existingAlert) {
          result.skipped++;
          continue;
        }

        const daysSinceActivity = Math.floor((Date.now() - hospital.updated_at.getTime()) / (1000 * 60 * 60 * 24));

        const alert = await prisma.alerts.create({
          data: {
            id: `alert_${Date.now()}_${hospital.id}`,
            hospital_id: hospital.id,
            project_id: hospital.projects[0]?.project_id || null,
            type: 'no_activity_30_days',
            title: 'Hospital Sin Actividad',
            message: `El hospital ${hospital.name} no ha tenido actividad en los últimos ${daysSinceActivity} días.`,
            severity: 'low',
            metadata: {
              hospital_name: hospital.name,
              last_activity: hospital.updated_at,
              days_since_activity: daysSinceActivity,
              threshold_days: thresholdDays
            }
          }
        });

        result.generated++;

        if (config.auto_send_email) {
          await triggerAutomaticCommunication(alert, config);
        }

      } catch (error) {
        result.errors.push(`Hospital ${hospital.id}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    }

  } catch (error) {
    result.errors.push(`Error general: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }

  return result;
}

/**
 * Genera alertas para tasas de completitud bajas
 */
export async function generateLowCompletionRateAlerts(): Promise<AlertGenerationResult> {
  const result: AlertGenerationResult = {
    alertType: 'low_completion_rate',
    generated: 0,
    skipped: 0,
    errors: []
  };

  try {
    const config = await prisma.alert_configurations.findUnique({
      where: { alert_type: 'low_completion_rate' }
    });

    if (!config?.enabled) {
      console.log('⚠️ Alertas de tasa de completitud deshabilitadas');
      return result;
    }

    const thresholdPercentage = config.threshold_value || 65;

    // Buscar hospitales con tasas de completitud bajas
    const hospitalsWithLowCompletion = await prisma.hospitals.findMany({
      include: {
        hospital_progress: {
          include: {
            project_hospitals: {
              include: {
                projects: true
              }
            }
          }
        },
        projects: {
          include: {
            projects: true
          }
        }
      }
    });

    for (const hospital of hospitalsWithLowCompletion) {
      try {
        // Calcular tasa de completitud (lógica simplificada)
        const totalPeriods = hospital.hospital_progress.length;
        const completedPeriods = hospital.hospital_progress.filter(p => p.status === 'completed').length;
        const completionRate = totalPeriods > 0 ? (completedPeriods / totalPeriods) * 100 : 0;

        if (completionRate >= thresholdPercentage) {
          continue; // No generar alerta si la tasa es aceptable
        }

        const existingAlert = await prisma.alerts.findFirst({
          where: {
            hospital_id: hospital.id,
            type: 'low_completion_rate',
            is_resolved: false
          }
        });

        if (existingAlert) {
          result.skipped++;
          continue;
        }

        const alert = await prisma.alerts.create({
          data: {
            id: `alert_${Date.now()}_${hospital.id}`,
            hospital_id: hospital.id,
            project_id: hospital.projects[0]?.project_id || null,
            type: 'low_completion_rate',
            title: 'Tasa de Completitud Baja',
            message: `El hospital ${hospital.name} tiene una tasa de completitud del ${completionRate.toFixed(1)}%, por debajo del umbral del ${thresholdPercentage}%.`,
            severity: 'medium',
            metadata: {
              hospital_name: hospital.name,
              completion_rate: completionRate,
              threshold_percentage: thresholdPercentage,
              total_periods: totalPeriods,
              completed_periods: completedPeriods
            }
          }
        });

        result.generated++;

        if (config.auto_send_email) {
          await triggerAutomaticCommunication(alert, config);
        }

      } catch (error) {
        result.errors.push(`Hospital ${hospital.id}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    }

  } catch (error) {
    result.errors.push(`Error general: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }

  return result;
}

/**
 * Ejecuta todas las verificaciones de alertas
 */
export async function runAllAlertChecks(): Promise<AlertGenerationSummary> {
  console.log('🚀 Iniciando generación de alertas...');
  
  const summary: AlertGenerationSummary = {
    totalGenerated: 0,
    totalSkipped: 0,
    totalErrors: 0,
    results: []
  };

  try {
    // Ejecutar todas las verificaciones en paralelo
    const results = await Promise.all([
      generateEthicsApprovalAlerts(),
      generateMissingDocumentationAlerts(),
      generateUpcomingRecruitmentAlerts(),
      generateNoActivityAlerts(),
      generateLowCompletionRateAlerts()
    ]);

    // Procesar resultados
    for (const result of results) {
      summary.results.push(result);
      summary.totalGenerated += result.generated;
      summary.totalSkipped += result.skipped;
      summary.totalErrors += result.errors.length;
    }

    console.log(`✅ Generación de alertas completada: ${summary.totalGenerated} generadas, ${summary.totalSkipped} omitidas, ${summary.totalErrors} errores`);

  } catch (error) {
    console.error('❌ Error durante la generación de alertas:', error);
    summary.totalErrors++;
  }

  return summary;
}

/**
 * Dispara comunicación automática para una alerta
 */
async function triggerAutomaticCommunication(alert: any, config: any): Promise<void> {
  try {
    // Obtener coordinadores del hospital
    const coordinators = await prisma.project_coordinators.findMany({
      where: {
        hospital_id: alert.hospital_id,
        project_id: alert.project_id
      },
      include: {
        users: true
      }
    });

    if (coordinators.length === 0) {
      console.log(`⚠️ No hay coordinadores para el hospital ${alert.hospital_id}`);
      return;
    }

    // Crear comunicación automática
    for (const coordinator of coordinators) {
      await prisma.communications.create({
        data: {
          id: `comm_${Date.now()}_${coordinator.user_id}`,
          hospital_id: alert.hospital_id,
          project_id: alert.project_id,
          user_id: coordinator.user_id,
          alert_id: alert.id,
          type: 'auto_alert',
          subject: alert.title,
          body: alert.message,
          channels: ['email', 'in_app'],
          email_status: 'pending'
        }
      });
    }

    console.log(`📧 Comunicación automática creada para alerta ${alert.id}`);

  } catch (error) {
    console.error(`❌ Error creando comunicación automática para alerta ${alert.id}:`, error);
  }
}
