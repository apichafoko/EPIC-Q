'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingButton } from '@/components/ui/loading-button';
import { useLoadingState } from '@/hooks/useLoadingState';
import { CoordinatorSearch } from '@/components/admin/coordinator-search';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

interface Hospital {
  id: string;
  name: string;
  province?: string;
  city?: string;
}

interface Project {
  id: string;
  name: string;
  default_required_periods?: number;
}

interface InviteCoordinatorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  hospitals: Hospital[];
  onSuccess?: () => void;
  onHospitalCreated?: (newHospital: Hospital) => void;
}

export function InviteCoordinatorModal({
  open,
  onOpenChange,
  project,
  hospitals,
  onSuccess,
  onHospitalCreated
}: InviteCoordinatorModalProps) {
  const [inviteData, setInviteData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    hospital_id: '',
    required_periods: 2
  });
  const [selectedCoordinator, setSelectedCoordinator] = useState<any>(null);
  const [isNewCoordinator, setIsNewCoordinator] = useState(false);
  const [showCreateHospitalModal, setShowCreateHospitalModal] = useState(false);
  const [hospitalData, setHospitalData] = useState({
    name: '',
  });
  
  const { isLoading: isInviting, executeWithLoading: executeWithInviting } = useLoadingState();
  const { isLoading: isCreatingHospital, executeWithLoading: executeWithCreatingHospital } = useLoadingState();

  // Initialize invite data with project default when modal opens
  useEffect(() => {
    if (open && project) {
      console.log('Modal opened with project:', project);
      console.log('Available hospitals:', hospitals);
      setInviteData(prev => ({
        ...prev,
        required_periods: project.default_required_periods || 2
      }));
    } else if (!open) {
      // Reset form when modal closes
      resetInviteForm();
    }
  }, [open, project, hospitals]);

  const resetInviteForm = () => {
    setInviteData({ 
      email: '', 
      first_name: '', 
      last_name: '', 
      phone: '', 
      hospital_id: '', 
      required_periods: 2 
    });
    setSelectedCoordinator(null);
    setIsNewCoordinator(false);
    setHospitalData({ name: '' });
  };

  const handleCreateHospital = async () => {
    // Validar que el nombre no esté vacío
    if (!hospitalData.name.trim()) {
      toast.error('El nombre del hospital es requerido');
      return;
    }

    // Validar que no exista un hospital con el mismo nombre
    const existingHospital = hospitals.find(h => 
      h.name.toLowerCase() === hospitalData.name.toLowerCase()
    );
    
    if (existingHospital) {
      toast.error('Ya existe un hospital con ese nombre');
      return;
    }

    await executeWithCreatingHospital(async () => {
      const response = await fetch('/api/hospitals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(hospitalData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear hospital');
      }

      const data = await response.json();
      
      // Notificar al componente padre sobre el nuevo hospital
      if (onHospitalCreated) {
        onHospitalCreated(data.hospital);
      }
      
      // Auto-seleccionar el hospital recién creado
      setInviteData(prev => ({
        ...prev,
        hospital_id: data.hospital.id
      }));

      // Cerrar el modal de creación
      setShowCreateHospitalModal(false);
      setHospitalData({ name: '' });
      
      toast.success('Hospital creado exitosamente');
    });
  };

  const handleInviteCoordinator = async () => {
    await executeWithInviting(async () => {
      // Preparar datos para envío
      const dataToSend = {
        ...inviteData,
        // Combinar nombre y apellido para el campo name
        name: `${inviteData.first_name} ${inviteData.last_name}`.trim(),
        // Si hay un coordinador seleccionado, usar sus datos
        ...(selectedCoordinator && {
          email: selectedCoordinator.email,
          name: selectedCoordinator.name,
          phone: inviteData.phone // Mantener el teléfono si se proporcionó
        })
      };

      const response = await fetch(`/api/admin/projects/${project?.id}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(dataToSend),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Invitación enviada exitosamente');
        onOpenChange(false);
        resetInviteForm();
        onSuccess?.();
      } else {
        toast.error(result.error || 'Error al enviar invitación');
        return; // Salir sin lanzar error
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invitar Coordinador</DialogTitle>
          <DialogDescription>
            Invita un coordinador a participar en este proyecto
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Buscar Coordinador</Label>
            <CoordinatorSearch
              onSelectCoordinator={(coordinator) => {
                setSelectedCoordinator(coordinator);
                if (coordinator) {
                  setIsNewCoordinator(false);
                  // Separar nombre y apellido
                  const nameParts = coordinator.name.split(' ');
                  const firstName = nameParts[0] || '';
                  const lastName = nameParts.slice(1).join(' ') || '';
                  
                  setInviteData(prev => ({
                    ...prev,
                    email: coordinator.email,
                    first_name: firstName,
                    last_name: lastName
                  }));
                } else {
                  setIsNewCoordinator(true);
                }
              }}
              onNewCoordinator={() => {
                setIsNewCoordinator(true);
                setSelectedCoordinator(null);
              }}
              selectedCoordinator={selectedCoordinator}
            />
          </div>
          
          {isNewCoordinator && (
            <>
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={inviteData.email}
                  onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                  placeholder="coordinador@hospital.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-first-name">Nombre</Label>
                  <Input
                    id="invite-first-name"
                    value={inviteData.first_name}
                    onChange={(e) => setInviteData({ ...inviteData, first_name: e.target.value })}
                    placeholder="Nombre"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-last-name">Apellido</Label>
                  <Input
                    id="invite-last-name"
                    value={inviteData.last_name}
                    onChange={(e) => setInviteData({ ...inviteData, last_name: e.target.value })}
                    placeholder="Apellido"
                  />
                </div>
              </div>
            </>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="invite-phone">Teléfono (Opcional)</Label>
            <Input
              id="invite-phone"
              type="tel"
              value={inviteData.phone}
              onChange={(e) => setInviteData({ ...inviteData, phone: e.target.value })}
              placeholder="+54 9 11 1234-5678"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-hospital">Hospital</Label>
            <div className="flex gap-2">
              <Select
                value={inviteData.hospital_id}
                onValueChange={(value) => setInviteData({ ...inviteData, hospital_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar hospital" />
                </SelectTrigger>
                <SelectContent>
                  {hospitals.map((hospital) => (
                    <SelectItem key={hospital.id} value={hospital.id}>
                      {hospital.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Dialog open={showCreateHospitalModal} onOpenChange={setShowCreateHospitalModal}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Crear Nuevo Hospital</DialogTitle>
                    <DialogDescription>
                      Crear un nuevo hospital para asignar al coordinador
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="hospital-name">Nombre del Hospital</Label>
                      <Input
                        id="hospital-name"
                        value={hospitalData.name}
                        onChange={(e) => setHospitalData({ ...hospitalData, name: e.target.value })}
                        placeholder="Nombre del hospital"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowCreateHospitalModal(false)}
                      >
                        Cancelar
                      </Button>
                      <LoadingButton 
                        onClick={handleCreateHospital}
                        loading={isCreatingHospital}
                        loadingText="Creando..."
                      >
                        Crear Hospital
                      </LoadingButton>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-periods">Períodos Requeridos</Label>
            <Input
              id="invite-periods"
              type="number"
              min="1"
              max="10"
              value={inviteData.required_periods}
              onChange={(e) => setInviteData({ ...inviteData, required_periods: parseInt(e.target.value) })}
            />
            <p className="text-sm text-gray-500">
              Períodos por defecto del proyecto: {project?.default_required_periods || 2}
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <LoadingButton 
            onClick={handleInviteCoordinator}
            loading={isInviting}
            loadingText="Enviando..."
          >
            Enviar Invitación
          </LoadingButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
