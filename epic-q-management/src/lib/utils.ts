import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function to get human-readable project hospital status
export function getProjectHospitalStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    'initial_contact': 'Contacto Inicial',
    'pending_evaluation': 'Evaluación Pendiente',
    'ethics_approval_process': 'Aprobación Ética',
    'redcap_setup': 'Configuración RedCap',
    'active_recruiting': 'Reclutando',
    'completed': 'Completado',
    'inactive': 'Inactivo'
  };
  
  return statusMap[status] || status;
}

// Helper function to get human-readable project status
export function getProjectStatusLabel(status: string): string {
  return status === 'active' ? 'Activo' : 'Inactivo';
}
