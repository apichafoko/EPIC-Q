import { prisma } from '@/lib/db-connection';

// Función para validar que los períodos no se superpongan
export function validatePeriodOverlap(
  newStartDate: Date, 
  newEndDate: Date, 
  existingPeriods: Array<{ startDate: Date; endDate: Date; id?: string }>,
  excludeId?: string
): { isValid: boolean; message?: string } {
  // Verificar que la fecha de inicio sea anterior a la fecha de fin
  if (newStartDate >= newEndDate) {
    return {
      isValid: false,
      message: 'La fecha de inicio debe ser anterior a la fecha de fin'
    };
  }

  // Verificar superposición con períodos existentes
  for (const period of existingPeriods) {
    // Excluir el período que se está editando
    if (excludeId && period.id === excludeId) {
      continue;
    }

    const existingStart = new Date(period.startDate);
    const existingEnd = new Date(period.endDate);

    // Verificar si hay superposición
    const hasOverlap = (
      (newStartDate >= existingStart && newStartDate <= existingEnd) ||
      (newEndDate >= existingStart && newEndDate <= existingEnd) ||
      (newStartDate <= existingStart && newEndDate >= existingEnd)
    );

    if (hasOverlap) {
      return {
        isValid: false,
        message: `El período se superpone con el Período ${existingPeriods.indexOf(period) + 1} (${existingStart.toLocaleDateString('es-ES')} - ${existingEnd.toLocaleDateString('es-ES')})`
      };
    }
  }

  return { isValid: true };
}

export interface CoordinatorStats {
  formCompletion: number;
  upcomingPeriods: number;
  notifications: number;
  hospitalFormStatus: {
    isComplete: boolean;
    isUrgent: boolean;
    missingFields: string[];
    completedSteps: number;
    totalSteps: number;
    lastUpdated?: Date;
  };
  recentNotifications: Array<{
    id: string;
    title: string;
    message: string;
    type: string;
    createdAt: Date;
  }>;
  hospital?: any; // Hospital con progress incluido
  recruitmentPeriods: Array<{
    id: string;
    periodNumber: number;
    startDate: string;
    endDate: string;
    targetCases?: number;
  }>;
}

export class CoordinatorService {
  static async getCoordinatorStats(userId: string, projectId?: string): Promise<CoordinatorStats> {
    try {
      // Obtener el usuario y verificar que esté en el proyecto
      const user = await prisma.users.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Si no se proporciona projectId, obtener el primer proyecto activo del coordinador
      let projectCoordinator;
      
      if (projectId) {
        projectCoordinator = await prisma.project_coordinators.findFirst({
          where: {
            user_id: userId,
            project_id: projectId,
            is_active: true
          },
          include: {
            hospitals: true,
            projects: true
          }
        });
      } else {
        // Obtener el primer proyecto activo del coordinador
        projectCoordinator = await prisma.project_coordinators.findFirst({
          where: {
            user_id: userId,
            is_active: true
          },
          include: {
            hospitals: true,
            projects: true
          }
        });
      }

      if (!projectCoordinator) {
        // Si no hay relación, devolver estadísticas vacías
        return {
          formCompletion: 0,
          upcomingPeriods: 0,
          notifications: 0,
          hospitalFormStatus: {
            isComplete: false,
            isUrgent: false,
            missingFields: ['Usuario no asignado a ningún proyecto'],
            completedSteps: 0,
            totalSteps: 1,
            lastUpdated: undefined
          },
          recentNotifications: [],
          hospital: null,
          recruitmentPeriods: []
        };
      }

      if (!projectCoordinator.hospitals) {
        throw new Error('Hospital no encontrado para este coordinador');
      }

      const hospitalId = projectCoordinator.hospitals.id;

      // Obtener ProjectHospital con toda la información relacionada
      const projectHospital = await prisma.project_hospitals.findFirst({
        where: {
          project_id: projectId,
          hospital_id: hospitalId
        },
        include: {
          hospitals: {
            include: {
              hospital_details: true,
              hospital_contacts: true
            }
          },
          hospital_progress: true,
          recruitment_periods: {
            orderBy: { period_number: 'asc' }
          }
        }
      });

      if (!projectHospital) {
        throw new Error('Hospital no está asignado a este proyecto');
      }

      const hospital = projectHospital.hospitals;
      const progress = projectHospital.hospital_progress;
      const recruitmentPeriods = projectHospital.recruitment_periods;

      // Verificar si los datos de details y contacts existen
      const hasDetails = hospital.hospital_details !== null;
      const hasContacts = hospital.hospital_contacts && hospital.hospital_contacts.length > 0;
      const primaryContact = hasContacts ? hospital.hospital_contacts.find(c => c.is_primary) : null;

      // NOTA: Los períodos de reclutamiento se manejan en la etapa de "Progreso", 
      // no en el formulario del hospital

      // Función auxiliar para obtener valores de details de forma segura
      const getDetailValue = (fieldName: string) => {
        if (!hasDetails || !hospital.hospital_details) return null;
        const details = hospital.hospital_details as any;
        return details[fieldName] !== null && details[fieldName] !== undefined                                      
          ? details[fieldName] 
          : null;
      };

      // Definir campos críticos del formulario del hospital
      const criticalFields = [
        // Información básica del hospital
        { key: 'name', label: 'Nombre del Hospital', value: hospital?.name, required: true },
        { key: 'province', label: 'Provincia', value: hospital?.province, required: true },
        { key: 'city', label: 'Ciudad', value: hospital?.city, required: true },
        { key: 'participated_lasos', label: 'Participación en LASOS', value: hospital?.lasos_participation, required: true },
        
        // Datos estructurales del hospital
        { key: 'num_beds', label: 'Número de Camas', value: getDetailValue('num_beds'), required: true },
        { key: 'num_operating_rooms', label: 'Quirófanos', value: getDetailValue('num_operating_rooms'), required: true },
        { key: 'num_icu_beds', label: 'Camas UCI', value: getDetailValue('num_icu_beds'), required: true },
        { key: 'avg_weekly_surgeries', label: 'Cirugías Semanales Promedio', value: getDetailValue('avg_weekly_surgeries'), required: true },
        { key: 'financing_type', label: 'Tipo de Financiamiento', value: getDetailValue('financing_type'), required: true },
        { key: 'has_preop_clinic', label: 'Clínica Preoperatoria', value: getDetailValue('has_preop_clinic'), required: true },
        
        // Coordinador principal
        { key: 'coordinator_name', label: 'Nombre del Coordinador', value: primaryContact?.name, required: true },
        { key: 'coordinator_email', label: 'Email del Coordinador', value: primaryContact?.email, required: true },
        { key: 'coordinator_phone', label: 'Teléfono del Coordinador', value: primaryContact?.phone, required: true },
        { key: 'coordinator_position', label: 'Cargo del Coordinador', value: primaryContact?.specialty, required: true }
        
        // NOTA: Los períodos de reclutamiento (dates_assigned_period1, dates_assigned_period2) 
        // pertenecen a la etapa de "Progreso", no al formulario del hospital
      ];


      // Calcular campos completados
      const requiredFields = criticalFields.filter(field => field.required);
      const completedFields = requiredFields.filter(field => {
        if (typeof field.value === 'boolean') {
          // Para campos booleanos, solo se considera completado si tiene un valor explícito (true o false)
          // null o undefined se consideran pendientes
          return field.value !== null && field.value !== undefined;
        }
        // Para otros campos, verificar que no estén vacíos
        return field.value !== null && field.value !== undefined && field.value !== '';
      });
      
      const missingFields = requiredFields
        .filter(field => {
          if (typeof field.value === 'boolean') {
            // Para campos booleanos, null o undefined se consideran faltantes
            return field.value === null || field.value === undefined;
          }
          return field.value === null || field.value === undefined || field.value === '';
        })
        .map(field => field.label);


      const formCompletion = Math.round((completedFields.length / requiredFields.length) * 100);
      const isComplete = completedFields.length === requiredFields.length;
      const isUrgent = !isComplete && (hospital?.created_at && 
        (new Date().getTime() - hospital.created_at.getTime()) > 7 * 24 * 60 * 60 * 1000);

      // Obtener períodos de reclutamiento totales
      const upcomingPeriods = await prisma.recruitment_periods.count({
        where: {
          project_hospital_id: projectHospital.id
        }
      });

      // Obtener notificaciones
      const notifications = await prisma.notifications.count({
        where: {
          userId: userId,
          isRead: false
        }
      });

      const recentNotifications = await prisma.notifications.findMany({
        where: {
          userId: userId
        },
        orderBy: {
          created_at: 'desc'
        },
        take: 3,
        select: {
          id: true,
          title: true,
          message: true,
          type: true,
          created_at: true
        }
      });

      return {
        formCompletion,
        upcomingPeriods,
        notifications,
        hospitalFormStatus: {
          isComplete,
          isUrgent,
          missingFields,
          completedSteps: completedFields.length,
          totalSteps: requiredFields.length,
          lastUpdated: hospital?.updated_at
        },
        recentNotifications: recentNotifications.map(notification => ({
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          createdAt: notification.created_at
        })),
        hospital: {
          ...hospital,
          progress: progress,
          projectHospital: projectHospital,
          requiredPeriods: 4 // Valor por defecto
        },
        recruitmentPeriods: recruitmentPeriods.map(period => ({
          id: period.id,
          periodNumber: period.period_number,
          startDate: period.start_date.toISOString(),
          endDate: period.end_date.toISOString(),
          targetCases: period.target_cases || undefined
        }))
      };
    } catch (error) {
      console.error('Error fetching coordinator stats:', error);
      throw error;
    }
  }
}
