import { z } from 'zod';

// Login validation
export const loginSchema = z.object({
  email: z.string().email('Email no válido'),
  password: z.string().min(1, 'La contraseña es requerida'),
  rememberMe: z.boolean().optional(),
});

// Password validation with strength requirements
export const passwordSchema = z.string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(/[A-Z]/, 'La contraseña debe contener al menos una letra mayúscula')
  .regex(/[a-z]/, 'La contraseña debe contener al menos una letra minúscula')
  .regex(/[0-9]/, 'La contraseña debe contener al menos un número')
  .regex(/[^A-Za-z0-9]/, 'La contraseña debe contener al menos un carácter especial');

// Set password validation
export const setPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
  token: z.string().min(1, 'Token requerido'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

// Reset password validation
export const resetPasswordSchema = z.object({
  email: z.string().email('Email no válido'),
});

// Forgot password validation
export const forgotPasswordSchema = z.object({
  email: z.string().email('Email no válido'),
});

// User creation validation
export const createUserSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email no válido'),
  role: z.enum(['admin', 'coordinator'], {
    errorMap: () => ({ message: 'Rol no válido' })
  }),
  hospital_id: z.string().optional(),
  sendInvitation: z.boolean().optional(),
}).refine((data) => {
  if (data.role === 'coordinator' && !data.hospital_id) {
    return false;
  }
  return true;
}, {
  message: 'Debe seleccionar un hospital para coordinadores',
  path: ['hospital_id'],
});

// Hospital form validation
export const hospitalFormSchema = z.object({
  // Basic Info
  name: z.string().min(2, 'El nombre del hospital es requerido'),
  province: z.string().min(1, 'La provincia es requerida'),
  city: z.string().min(1, 'La ciudad es requerida'),
  participated_lasos: z.boolean().optional(),
  
  // Structural Data
  total_beds: z.number().min(1, 'El número de camas debe ser mayor a 0'),
  icu_beds: z.number().min(0, 'El número de camas de UCI no puede ser negativo'),
  operating_rooms: z.number().min(1, 'Debe tener al menos un quirófano'),
  annual_surgeries: z.number().min(0, 'El número de cirugías anuales no puede ser negativo'),
  
  // Primary Coordinator
  coordinator_name: z.string().min(2, 'El nombre del coordinador es requerido'),
  coordinator_email: z.string().email('Email del coordinador no válido'),
  coordinator_phone: z.string().min(10, 'El teléfono debe tener al menos 10 dígitos'),
  coordinator_specialty: z.string().min(2, 'La especialidad es requerida'),
});

// Communication validation
export const communicationSchema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres'),
  message: z.string().min(10, 'El mensaje debe tener al menos 10 caracteres'),
  type: z.enum(['email', 'notification', 'call', 'note']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  hospital_ids: z.array(z.string()).min(1, 'Debe seleccionar al menos un hospital'),
});

// Email template validation
export const emailTemplateSchema = z.object({
  name: z.string().min(2, 'El nombre del template es requerido'),
  subject: z.string().min(5, 'El asunto debe tener al menos 5 caracteres'),
  content: z.string().min(20, 'El contenido debe tener al menos 20 caracteres'),
  variables: z.array(z.string()).optional(),
});

// Recruitment period validation
export const recruitmentPeriodSchema = z.object({
  start_date: z.date({
    required_error: 'La fecha de inicio es requerida',
  }),
  end_date: z.date({
    required_error: 'La fecha de fin es requerida',
  }),
  hospital_id: z.string().min(1, 'Hospital requerido'),
}).refine((data) => {
  // Start date must be Monday
  const dayOfWeek = data.start_date.getDay();
  return dayOfWeek === 1; // Monday
}, {
  message: 'La fecha de inicio debe ser un lunes',
  path: ['start_date'],
}).refine((data) => {
  // Must be exactly 7 days
  const diffTime = data.end_date.getTime() - data.start_date.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 7;
}, {
  message: 'El período debe durar exactamente 7 días',
  path: ['end_date'],
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type SetPasswordFormData = z.infer<typeof setPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type CreateUserFormData = z.infer<typeof createUserSchema>;
export type HospitalFormData = z.infer<typeof hospitalFormSchema>;
export type CommunicationFormData = z.infer<typeof communicationSchema>;
export type EmailTemplateFormData = z.infer<typeof emailTemplateSchema>;
export type RecruitmentPeriodFormData = z.infer<typeof recruitmentPeriodSchema>;
