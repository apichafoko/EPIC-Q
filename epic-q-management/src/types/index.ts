// Tipos principales del sistema EPIC-Q

export interface Hospital {
  id: string;
  redcap_id?: string;
  name: string;
  province: string;
  city: string;
  status: 'initial_contact' | 'pending_evaluation' | 'ethics_approval_process' | 
          'redcap_setup' | 'active_recruiting' | 'completed' | 'inactive' | 
          'active' | 'pending' | 'inactive' | null | undefined;
  participated_lasos: boolean;
  progress_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface HospitalDetails {
  hospital_id: string;
  financing_type?: 'private' | 'public' | 'social_security' | 'other';
  num_beds?: number;
  num_operating_rooms?: number;
  num_icu_beds?: number;
  avg_weekly_surgeries?: number;
  has_residency_program?: boolean;
  has_preop_clinic?: 'always' | 'sometimes' | 'never';
  has_rapid_response_team?: boolean;
  has_ethics_committee?: boolean;
  university_affiliated?: boolean;
  notes?: string;
}

export interface Contact {
  id: string;
  hospital_id: string;
  role: 'coordinator' | 'collaborator';
  name: string;
  email: string;
  phone?: string;
  specialty?: string;
  is_primary: boolean;
}

export interface HospitalProgress {
  hospital_id: string;
  descriptive_form_status: 'complete' | 'pending' | 'partial';
  ethics_submitted: boolean;
  ethics_submitted_date?: string;
  ethics_approved: boolean;
  ethics_approved_date?: string;
  redcap_unit_created: boolean;
  coordinator_user_created: boolean;
  collaborator_users_created: 'yes' | 'no' | 'partial';
  num_collaborators: number;
  ready_for_recruitment: boolean;
  dates_assigned_period1: boolean;
  dates_assigned_period2: boolean;
  last_contact_date?: string;
  next_followup_date?: string;
}

export interface RecruitmentPeriod {
  id: string;
  hospital_id: string;
  period_number: 1 | 2 | 3 | 4;
  start_date: string;
  end_date: string;
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  notes?: string;
}

export interface CaseMetrics {
  hospital_id: string;
  recorded_date: string;
  cases_created: number;
  cases_completed: number;
  completion_percentage: number;
  last_case_date?: string;
}

export interface Communication {
  id: string;
  hospital_id: string;
  hospital_name: string;
  type?: string;
  subject?: string;
  content?: string;
  sent_at: string;
  read_at?: string | null;
  user_id?: string | null;
  user_name: string;
  priority?: string;
  status?: string;
  attachments?: any[];
}

export interface Alert {
  id: string;
  hospital_id: string;
  alert_type: 'no_activity_30_days' | 'low_completion_rate' | 
              'upcoming_recruitment_period' | 'ethics_approval_pending' | 'missing_documentation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  is_resolved: boolean;
  created_at: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  category: 'recruitment' | 'followup' | 'technical' | 'operations' | 'quality';
  subject: string;
  body: string;
  variables: string[];
  is_active: boolean;
  usage_count: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'coordinator' | 'collaborator';
  hospital_id?: string;
  created_at: string;
}

// Configuraciones
export const statusConfig = {
  initial_contact: {
    label: 'Contacto Inicial',
    color: 'bg-yellow-100 text-yellow-800',
    icon: '🟡'
  },
  pending_evaluation: {
    label: 'Evaluación Pendiente',
    color: 'bg-orange-100 text-orange-800',
    icon: '🟠'
  },
  ethics_approval_process: {
    label: 'Aprobación Ética',
    color: 'bg-blue-100 text-blue-800',
    icon: '🔵'
  },
  redcap_setup: {
    label: 'Configuración RedCap',
    color: 'bg-purple-100 text-purple-800',
    icon: '🟣'
  },
  active_recruiting: {
    label: 'Activo - Reclutando',
    color: 'bg-green-100 text-green-800',
    icon: '🟢'
  },
  completed: {
    label: 'Completado',
    color: 'bg-gray-100 text-gray-800',
    icon: '⚪'
  },
  inactive: {
    label: 'Inactivo',
    color: 'bg-red-100 text-red-800',
    icon: '🔴'
  },
  // Estados adicionales que pueden venir de la base de datos
  active: {
    label: 'Activo',
    color: 'bg-green-100 text-green-800',
    icon: '🟢'
  },
  pending: {
    label: 'Pendiente',
    color: 'bg-yellow-100 text-yellow-800',
    icon: '🟡'
  }
} as const;

export const provinces = [
  'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba',
  'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja',
  'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan',
  'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero',
  'Tierra del Fuego', 'Tucumán'
] as const;

export const specialties = [
  'Anestesia',
  'Cirugía General',
  'Cirugía Cardiovascular',
  'Cirugía Torácica',
  'Cirugía Pediátrica',
  'Neurocirugía',
  'Ortopedia',
  'Urología',
  'Ginecología',
  'Oftalmología',
  'Otorrinolaringología',
  'Otra'
] as const;

export const financingTypes = [
  'private',
  'public',
  'social_security',
  'other'
] as const;

export const preopClinicOptions = [
  'always',
  'sometimes',
  'never'
] as const;

export const communicationTypes = [
  'email',
  'call',
  'meeting',
  'note',
  'whatsapp'
] as const;

export const alertTypes = [
  'no_activity_30_days',
  'low_completion_rate',
  'upcoming_recruitment_period',
  'ethics_approval_pending',
  'missing_documentation'
] as const;

export const alertSeverities = [
  'low',
  'medium',
  'high',
  'critical'
] as const;

export const templateCategories = [
  'recruitment',
  'followup',
  'technical',
  'operations',
  'quality'
] as const;

// Tipos para formularios
export interface NewHospitalForm {
  // Paso 1: Información Básica
  name: string;
  province: string;
  city: string;
  status: Hospital['status'];
  participated_lasos: boolean;
  
  // Paso 2: Datos Estructurales
  financing_type: HospitalDetails['financing_type'];
  num_beds?: number;
  num_operating_rooms?: number;
  num_icu_beds?: number;
  avg_weekly_surgeries?: number;
  has_residency_program?: boolean;
  has_preop_clinic?: HospitalDetails['has_preop_clinic'];
  has_rapid_response_team?: boolean;
  has_ethics_committee?: boolean;
  university_affiliated?: boolean;
  notes?: string;
  
  // Paso 3: Coordinador Principal
  coordinator_name: string;
  coordinator_email: string;
  coordinator_phone?: string;
  coordinator_specialty?: string;
}

// Tipos para filtros
export interface HospitalFilters {
  search: string;
  province: string | 'all';
  status: string | 'all';
}

export interface CommunicationFilters {
  search: string;
  type: string | 'all';
  status: string | 'all';
  dateFrom?: string;
  dateTo?: string;
}

// Tipos para KPIs
export interface DashboardKPIs {
  totalHospitals: number;
  activeHospitals: number;
  totalCases: number;
  averageCompletion: number;
  activeAlerts: number;
  trends: {
    totalHospitals: number;
    activeHospitals: number;
    totalCases: number;
    averageCompletion: number;
    activeAlerts: number;
  };
}

// Tipos para gráficos
export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export interface TimeSeriesData {
  date: string;
  value: number;
  label?: string;
}
