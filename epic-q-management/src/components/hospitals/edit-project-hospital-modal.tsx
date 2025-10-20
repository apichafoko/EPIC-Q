'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useLoadingState } from '@/hooks/useLoadingState';

interface ProjectHospital {
  id: string;
  project_id: string;
  hospital_id: string;
  required_periods: number;
  redcap_id?: string;
  status: string;
  joined_at: string;
}

interface Project {
  id: string;
  name: string;
  status: string;
  start_date?: string;
  end_date?: string;
  required_periods?: number;
  project_required_periods?: number;
}

interface EditProjectHospitalModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectHospital: ProjectHospital | null;
  project: Project | null;
  onSuccess: () => void;
}

const PROJECT_HOSPITAL_STATUS_OPTIONS = [
  { value: 'initial_contact', label: 'Contacto Inicial' },
  { value: 'pending_evaluation', label: 'Evaluación Pendiente' },
  { value: 'ethics_approval_process', label: 'Proceso de Aprobación Ética' },
  { value: 'redcap_setup', label: 'Configuración RedCap' },
  { value: 'active_recruiting', label: 'Reclutamiento Activo' },
  { value: 'completed', label: 'Completado' },
  { value: 'inactive', label: 'Inactivo' }
];

export function EditProjectHospitalModal({
  isOpen,
  onClose,
  projectHospital,
  project,
  onSuccess
}: EditProjectHospitalModalProps) {
  const { isLoading, executeWithLoading } = useLoadingState();
  const [formData, setFormData] = useState({
    required_periods: 0,
    redcap_id: '',
    status: 'initial_contact'
  });
  const [showUnlinkConfirmation, setShowUnlinkConfirmation] = useState(false);
  const [confirmationWord, setConfirmationWord] = useState('');

  useEffect(() => {
    if (projectHospital) {
      setFormData({
        required_periods: projectHospital.required_periods || project?.project_required_periods || project?.required_periods || 0,
        redcap_id: projectHospital.redcap_id || '',
        status: projectHospital.status || 'initial_contact'
      });
    }
  }, [projectHospital, project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!projectHospital) return;

    await executeWithLoading(async () => {
      try {
        const response = await fetch(`/api/admin/projects/${projectHospital.project_id}/hospitals/${projectHospital.hospital_id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al actualizar la relación');
        }

        toast.success('Relación actualizada exitosamente');
        onSuccess();
        onClose();
      } catch (error) {
        console.error('Error updating project hospital:', error);
        toast.error(error instanceof Error ? error.message : 'Error al actualizar la relación');
      }
    });
  };

  const handleUnlinkClick = () => {
    setShowUnlinkConfirmation(true);
    setConfirmationWord('');
  };

  const handleUnlinkCancel = () => {
    setShowUnlinkConfirmation(false);
    setConfirmationWord('');
  };

  const handleUnlinkConfirm = async () => {
    if (confirmationWord !== 'DESVINCULAR') {
      toast.error('Debes escribir "DESVINCULAR" para confirmar');
      return;
    }

    if (!projectHospital || !project) return;
    
    console.log('🔧 Debug - projectHospital:', projectHospital);
    console.log('🔧 Debug - project:', project);
    console.log('🔧 Debug - projectHospital.project_id:', projectHospital.project_id);
    console.log('🔧 Debug - projectHospital.hospital_id:', projectHospital.hospital_id);
    console.log('🔧 Debug - URL:', `/api/admin/projects/${projectHospital.project_id}/hospitals/${projectHospital.hospital_id}`);
    
    await executeWithLoading(async () => {
      try {
        const response = await fetch(`/api/admin/projects/${projectHospital.project_id}/hospitals/${projectHospital.hospital_id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.log('🔧 Error response:', response.status, errorData);
          throw new Error(errorData.error || 'Error al desvincular el hospital');
        }

        toast.success('Hospital desvinculado exitosamente del proyecto');
        onSuccess();
        onClose();
      } catch (error) {
        console.error('Error unlinking hospital:', error);
        toast.error(error instanceof Error ? error.message : 'Error al desvincular el hospital');
      }
    });
  };

  const handleClose = () => {
    setFormData({
      required_periods: 0,
      redcap_id: '',
      status: 'initial_contact'
    });
    setShowUnlinkConfirmation(false);
    setConfirmationWord('');
    onClose();
  };

  if (!projectHospital || !project) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className="sm:max-w-[500px]" 
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            Editar Relación: {project.name}
          </DialogTitle>
        </DialogHeader>

        {!showUnlinkConfirmation ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="required_periods">Períodos Requeridos</Label>
              <Input
                id="required_periods"
                type="number"
                min="1"
                value={formData.required_periods || 0}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  required_periods: parseInt(e.target.value) || 0
                }))}
                required
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="redcap_id">ID RedCap</Label>
              <Input
                id="redcap_id"
                value={formData.redcap_id || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  redcap_id: e.target.value
                }))}
                placeholder="Ingrese el ID de RedCap"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="status">Estado en el Proyecto</Label>
              <Select
                value={formData.status || 'initial_contact'}
                onValueChange={(value) => setFormData(prev => ({
                  ...prev,
                  status: value
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un estado" />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_HOSPITAL_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="flex justify-between">
              <Button 
                type="button" 
                variant="destructive" 
                onClick={handleUnlinkClick}
                disabled={isLoading}
              >
                Desvincular del Proyecto
              </Button>
              <div className="flex space-x-2">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-6">
            {/* Icono de advertencia */}
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="ml-3 text-lg font-semibold text-red-900">
                Desvincular Hospital del Proyecto
              </h3>
            </div>

            {/* Descripción */}
            <p className="text-gray-700">
              ¿Estás seguro de que quieres desvincular este hospital del proyecto "{project.name}"? Esta acción es reversible pero puede alterar el funcionamiento normal del estudio.
            </p>

            {/* Campo de confirmación */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Para confirmar, escribe: <span className="font-mono bg-gray-100 px-2 py-1 rounded">DESVINCULAR</span>
              </label>
              <Input
                type="text"
                value={confirmationWord}
                onChange={(e) => setConfirmationWord(e.target.value)}
                placeholder="Escribe 'DESVINCULAR'"
                disabled={isLoading}
                className="w-full"
              />
              {confirmationWord && confirmationWord !== 'DESVINCULAR' && (
                <p className="text-red-600 text-sm mt-1">La palabra no coincide</p>
              )}
            </div>

            {/* Botones */}
            <DialogFooter className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={handleUnlinkCancel}
                disabled={isLoading}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                variant="destructive"
                onClick={handleUnlinkConfirm}
                disabled={isLoading || confirmationWord !== 'DESVINCULAR'}
                className="flex-1"
              >
                {isLoading ? 'Desvinculando...' : 'Desvincular'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
