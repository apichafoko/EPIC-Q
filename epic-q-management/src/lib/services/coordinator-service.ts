import { prisma } from '@/lib/database';

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
}

export class CoordinatorService {
  static async getCoordinatorStats(userId: string, projectId: string): Promise<CoordinatorStats> {
    try {
      // Obtener el usuario y verificar que esté en el proyecto
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Obtener la relación ProjectCoordinator para el proyecto actual
      const projectCoordinator = await prisma.projectCoordinator.findFirst({
        where: {
          user_id: userId,
          project_id: projectId,
          is_active: true
        },
        include: {
          hospital: true,
          project: true
        }
      });

      if (!projectCoordinator || !projectCoordinator.hospital) {
        throw new Error('Usuario no está asignado a este proyecto o hospital no encontrado');
      }

      const hospitalId = projectCoordinator.hospital.id;

      // Obtener ProjectHospital con toda la información relacionada
      const projectHospital = await prisma.projectHospital.findFirst({
        where: {
          project_id: projectId,
          hospital_id: hospitalId
        },
        include: {
          hospital: {
            include: {
              details: true,
              contacts: true
            }
          },
          progress: true,
          recruitment_periods: {
            orderBy: { period_number: 'asc' }
          }
        }
      });

      if (!projectHospital) {
        throw new Error('Hospital no está asignado a este proyecto');
      }

      const hospital = projectHospital.hospital;
      const progress = projectHospital.progress;
      const recruitmentPeriods = projectHospital.recruitment_periods;

      // Verificar si existen períodos asignados
      const hasPeriod1 = recruitmentPeriods.some(period => period.period_number === 1);
      const hasPeriod2 = recruitmentPeriods.some(period => period.period_number === 2);

      // Definir campos críticos del formulario del hospital
      const criticalFields = [
        // === INFORMACIÓN BÁSICA DEL HOSPITAL ===
        { key: 'name', label: 'Nombre del Hospital', value: hospital?.name },
        { key: 'province', label: 'Provincia', value: hospital?.province },
        { key: 'city', label: 'Ciudad', value: hospital?.city },
        { key: 'status', label: 'Estado del Hospital', value: hospital?.status },
        { key: 'participated_lasos', label: 'Participación en LASOS', value: hospital?.participated_lasos },
        { key: 'redcap_id', label: 'ID RedCap', value: hospital?.redcap_id },
        
        // === DATOS ESTRUCTURALES ===
        { key: 'num_beds', label: 'Número de Camas', value: hospital?.details?.num_beds },
        { key: 'num_operating_rooms', label: 'Quirófanos', value: hospital?.details?.num_operating_rooms },
        { key: 'num_icu_beds', label: 'Camas UCI', value: hospital?.details?.num_icu_beds },
        { key: 'avg_weekly_surgeries', label: 'Cirugías Semanales Promedio', value: hospital?.details?.avg_weekly_surgeries },
        { key: 'financing_type', label: 'Tipo de Financiamiento', value: hospital?.details?.financing_type },
        { key: 'has_preop_clinic', label: 'Clínica Preoperatoria', value: hospital?.details?.has_preop_clinic },
        { key: 'has_residency_program', label: 'Programa de Residencia', value: hospital?.details?.has_residency_program },
        { key: 'has_rapid_response_team', label: 'Equipo de Respuesta Rápida', value: hospital?.details?.has_rapid_response_team },
        { key: 'has_ethics_committee', label: 'Tiene Comité de Ética', value: hospital?.details?.has_ethics_committee },
        { key: 'university_affiliated', label: 'Afiliado a Universidad', value: hospital?.details?.university_affiliated },
        { key: 'notes', label: 'Notas Adicionales', value: hospital?.details?.notes },
        
        // === COORDINADOR PRINCIPAL ===
        { key: 'coordinator_name', label: 'Nombre del Coordinador', value: hospital?.contacts?.find(c => c.is_primary)?.name },
        { key: 'coordinator_email', label: 'Email del Coordinador', value: hospital?.contacts?.find(c => c.is_primary)?.email },
        { key: 'coordinator_phone', label: 'Teléfono del Coordinador', value: hospital?.contacts?.find(c => c.is_primary)?.phone },
        { key: 'coordinator_role', label: 'Cargo del Coordinador', value: hospital?.contacts?.find(c => c.is_primary)?.role },
        
        // === PROGRESO DEL COMITÉ DE ÉTICA (Solo campos del coordinador) ===
        { key: 'ethics_submitted', label: 'Presentación al Comité de Ética', value: progress?.ethics_submitted },
        { key: 'ethics_approved', label: 'Aprobación del Comité de Ética', value: progress?.ethics_approved },
        
        // === PERÍODOS DE RECLUTAMIENTO (Verificados dinámicamente) ===
        { key: 'dates_assigned_period1', label: 'Fechas Asignadas Período 1', value: hasPeriod1 },
        { key: 'dates_assigned_period2', label: 'Fechas Asignadas Período 2', value: hasPeriod2 }
      ];

      const completedFields = criticalFields.filter(field => 
        field.value !== null && field.value !== undefined && field.value !== ''
      );
      
      const missingFields = criticalFields
        .filter(field => 
          field.value === null || field.value === undefined || field.value === ''
        )
        .map(field => field.label);

      const formCompletion = Math.round((completedFields.length / criticalFields.length) * 100);
      const isComplete = completedFields.length === criticalFields.length;
      const isUrgent = !isComplete && (hospital?.created_at && 
        (new Date().getTime() - hospital.created_at.getTime()) > 7 * 24 * 60 * 60 * 1000); // 7 días

      // Obtener períodos de reclutamiento próximos (próximos 30 días)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const upcomingPeriods = await prisma.projectRecruitmentPeriod.count({
        where: {
          project_hospital_id: projectHospital.id,
          start_date: {
            gte: new Date(),
            lte: thirtyDaysFromNow
          },
          status: 'active'
        }
      });

      // Obtener notificaciones no leídas
      const notifications = await prisma.notification.count({
        where: {
          userId: userId,
          read: false
        }
      });

      // Obtener notificaciones recientes
      const recentNotifications = await prisma.notification.findMany({
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
          totalSteps: criticalFields.length,
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
          requiredPeriods: projectHospital.required_periods
        }
      };
    } catch (error) {
      console.error('Error fetching coordinator stats:', error);
      throw error;
    }
  }
}
