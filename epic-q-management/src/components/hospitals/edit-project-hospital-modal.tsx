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

  useEffect(() => {
    if (projectHospital) {
      setFormData({
        required_periods: projectHospital.required_periods || 0,
        redcap_id: projectHospital.redcap_id || '',
        status: projectHospital.status || 'initial_contact'
      });
    }
  }, [projectHospital]);

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

  const handleClose = () => {
    setFormData({
      required_periods: 0,
      redcap_id: '',
      status: 'initial_contact'
    });
    onClose();
  };

  if (!projectHospital || !project) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            Editar Relación: {project.name}
          </DialogTitle>
        </DialogHeader>

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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
