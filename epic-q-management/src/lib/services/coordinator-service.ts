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
}

export class CoordinatorService {
  static async getCoordinatorStats(userId: string): Promise<CoordinatorStats> {
    try {
      // Obtener el usuario y su hospital
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          hospital: true
        }
      });

      if (!user || !user.hospital) {
        throw new Error('Usuario o hospital no encontrado');
      }

      const hospitalId = user.hospital.id;

      // Obtener información completa del hospital para el formulario
      const hospital = await prisma.hospital.findUnique({
        where: { id: hospitalId },
        include: {
          details: true,
          contacts: true,
          progress: true
        }
      });

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
        { key: 'has_ethics_committee', label: 'Comité de Ética', value: hospital?.details?.has_ethics_committee },
        { key: 'university_affiliated', label: 'Afiliado a Universidad', value: hospital?.details?.university_affiliated },
        { key: 'notes', label: 'Notas Adicionales', value: hospital?.details?.notes },
        
        // === COORDINADOR PRINCIPAL ===
        { key: 'coordinator_name', label: 'Nombre del Coordinador', value: hospital?.contacts?.find(c => c.is_primary)?.name },
        { key: 'coordinator_email', label: 'Email del Coordinador', value: hospital?.contacts?.find(c => c.is_primary)?.email },
        { key: 'coordinator_phone', label: 'Teléfono del Coordinador', value: hospital?.contacts?.find(c => c.is_primary)?.phone },
        { key: 'coordinator_role', label: 'Cargo del Coordinador', value: hospital?.contacts?.find(c => c.is_primary)?.role },
        
        // === PROGRESO DEL COMITÉ DE ÉTICA ===
        { key: 'descriptive_form_status', label: 'Estado del Formulario Descriptivo', value: hospital?.progress?.descriptive_form_status },
        { key: 'ethics_submitted', label: 'Ética Presentada', value: hospital?.progress?.ethics_submitted },
        { key: 'ethics_approved', label: 'Ética Aprobada', value: hospital?.progress?.ethics_approved },
        { key: 'redcap_unit_created', label: 'Unidad RedCap Creada', value: hospital?.progress?.redcap_unit_created },
        { key: 'coordinator_user_created', label: 'Usuario Coordinador Creado', value: hospital?.progress?.coordinator_user_created },
        { key: 'collaborator_users_created', label: 'Usuarios Colaboradores Creados', value: hospital?.progress?.collaborator_users_created },
        { key: 'ready_for_recruitment', label: 'Listo para Reclutamiento', value: hospital?.progress?.ready_for_recruitment },
        { key: 'dates_assigned_period1', label: 'Fechas Asignadas Período 1', value: hospital?.progress?.dates_assigned_period1 },
        { key: 'dates_assigned_period2', label: 'Fechas Asignadas Período 2', value: hospital?.progress?.dates_assigned_period2 }
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

      const upcomingPeriods = await prisma.recruitmentPeriod.count({
        where: {
          hospital_id: hospitalId,
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
        }))
      };
    } catch (error) {
      console.error('Error fetching coordinator stats:', error);
      throw error;
    }
  }
}
