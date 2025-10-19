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
      const user = await prisma.users.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Obtener la relación ProjectCoordinator para el proyecto actual
      const projectCoordinator = await prisma.project_coordinators.findFirst({
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
      const projectHospital = await prisma.project_hospitals.findFirst({
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


      // Verificar si los datos de details y contacts existen
      const hasDetails = hospital.details !== null;
      const hasContacts = hospital.contacts && hospital.contacts.length > 0;
      const primaryContact = hasContacts ? hospital.contacts.find(c => c.is_primary) : null;

      // Verificar si existen períodos asignados
      const hasPeriod1 = recruitmentPeriods.some(period => period.period_number === 1);
      const hasPeriod2 = recruitmentPeriods.some(period => period.period_number === 2);

      // Función auxiliar para obtener valores de details de forma segura
      const getDetailValue = (fieldName: string) => {
        if (!hasDetails) return null;
        return hospital.details[fieldName] !== null && hospital.details[fieldName] !== undefined 
          ? hospital.details[fieldName] 
          : null;
      };

      // Definir campos críticos del formulario del hospital (basado en validaciones reales del formulario)
      const criticalFields = [
        // === INFORMACIÓN BÁSICA DEL HOSPITAL (Solo si es editable) ===
        { key: 'name', label: 'Nombre del Hospital', value: hospital?.name },
        { key: 'province', label: 'Provincia', value: hospital?.province, required: true },
        { key: 'city', label: 'Ciudad', value: hospital?.city, required: true },
        { key: 'participated_lasos', label: 'Participación en LASOS', value: hospital?.participated_lasos, required: true },
        
        // === DATOS ESTRUCTURALES (Campos requeridos del paso 2) ===
        { key: 'num_beds', label: 'Número de Camas', value: getDetailValue('num_beds'), required: true },
        { key: 'num_operating_rooms', label: 'Quirófanos', value: getDetailValue('num_operating_rooms'), required: true },
        { key: 'num_icu_beds', label: 'Camas UCI', value: getDetailValue('num_icu_beds'), required: true },
        { key: 'avg_weekly_surgeries', label: 'Cirugías Semanales Promedio', value: getDetailValue('avg_weekly_surgeries'), required: true },
        { key: 'financing_type', label: 'Tipo de Financiamiento', value: getDetailValue('financing_type'), required: true },
        { key: 'has_preop_clinic', label: 'Clínica Preoperatoria', value: getDetailValue('has_preop_clinic'), required: true },
        
        // === COORDINADOR PRINCIPAL (Campos requeridos del paso 3) ===
        { key: 'coordinator_name', label: 'Nombre del Coordinador', value: primaryContact?.name, required: true },
        { key: 'coordinator_email', label: 'Email del Coordinador', value: primaryContact?.email, required: true },
        { key: 'coordinator_phone', label: 'Teléfono del Coordinador', value: primaryContact?.phone, required: true },
        { key: 'coordinator_position', label: 'Cargo del Coordinador', value: primaryContact?.role, required: true },
        
        // === PROGRESO DEL COMITÉ DE ÉTICA (Campos del coordinador) ===
        { key: 'ethics_submitted', label: 'Presentación al Comité de Ética', value: progress?.ethics_submitted, required: true },
        { key: 'ethics_approved', label: 'Aprobación del Comité de Ética', value: progress?.ethics_approved, required: true },
        
        // === PERÍODOS DE RECLUTAMIENTO (Verificados dinámicamente) ===
        { key: 'dates_assigned_period1', label: 'Fechas Asignadas Período 1', value: hasPeriod1, required: true },
        { key: 'dates_assigned_period2', label: 'Fechas Asignadas Período 2', value: hasPeriod2, required: true }
      ];

      // Solo contar campos requeridos para el cálculo
      const requiredFields = criticalFields.filter(field => field.required);
      const completedFields = requiredFields.filter(field => {
        // Para campos booleanos, considerar completado si tiene un valor (true o false)
        if (typeof field.value === 'boolean') {
          return field.value !== null && field.value !== undefined;
        }
        // Para otros campos, verificar que no estén vacíos
        return field.value !== null && field.value !== undefined && field.value !== '';
      });
      
      const missingFields = requiredFields
        .filter(field => {
          // Para campos booleanos, considerar faltante solo si es null o undefined
          if (typeof field.value === 'boolean') {
            return field.value === null || field.value === undefined;
          }
          // Para otros campos, verificar que no estén vacíos
          return field.value === null || field.value === undefined || field.value === '';
        })
        .map(field => field.label);

      // Debug logs para verificar la lógica
      console.log('=== DEBUG HOSPITAL FORM COMPLETENESS ===');
      console.log('Hospital ID:', hospital.id);
      console.log('Has Details:', hasDetails);
      console.log('Has Contacts:', hasContacts);
      console.log('Details data:', hospital.details);
      console.log('Contacts data:', hospital.contacts);
      console.log('Required fields count:', requiredFields.length);
      console.log('Completed fields count:', completedFields.length);
      console.log('Missing fields:', missingFields);
      console.log('Critical fields values:', criticalFields.map(f => ({ 
        key: f.key, 
        label: f.label, 
        value: f.value, 
        required: f.required 
      })));
      console.log('==========================================');


      const formCompletion = Math.round((completedFields.length / requiredFields.length) * 100);
      const isComplete = completedFields.length === requiredFields.length;
      const isUrgent = !isComplete && (hospital?.created_at && 
        (new Date().getTime() - hospital.created_at.getTime()) > 7 * 24 * 60 * 60 * 1000); // 7 días

      // Obtener períodos de reclutamiento próximos (próximos 30 días)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const upcomingPeriods = await prisma.recruitment_periods.count({
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
      const notifications = await prisma.notifications.count({
        where: {
          userId: userId,
          read: false
        }
      });

      // Obtener notificaciones recientes
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
          requiredPeriods: projectHospital.required_periods
        }
      };
    } catch (error) {
      console.error('Error fetching coordinator stats:', error);
      throw error;
    }
  }
}
