'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Loader2, Plus, Edit, Trash2, UserPlus, Building2, Calendar, Target, Users, AlertTriangle, MoreHorizontal, Mail, Eye, X, Download } from 'lucide-react';
import { toast } from 'sonner';
import { CoordinatorSearch } from '@/components/admin/coordinator-search';
import { LoadingButton } from '@/components/ui/loading-button';
import { useLoadingState } from '@/hooks/useLoadingState';
import { Pagination } from '@/components/ui/pagination';
import { BulkActions } from '@/components/ui/bulk-actions';
import { Checkbox } from '@/components/ui/checkbox';
import { ExportService } from '@/lib/export-service';
import { AdvancedExportService } from '@/lib/export-advanced-service';
import { AuditService } from '@/lib/audit-service';
import { useNotifications } from '@/hooks/useNotifications';
import { useKeyboardShortcuts, createAppShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useConfirmation } from '@/hooks/useConfirmation';
import { GlobalSearch } from '@/components/ui/global-search';
import { AdvancedFilters } from '@/components/ui/advanced-filters';
import { ConfirmationToast } from '@/components/ui/confirmation-toast';

interface Project {
  id: string;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status: 'active' | 'completed' | 'archived';
  total_target_cases?: number;
  created_at: string;
  updated_at: string;
  project_hospitals: ProjectHospital[];
  project_coordinators: ProjectCoordinator[];
  _count: {
    project_hospitals: number;
    project_coordinators: number;
  };
}

interface ProjectHospital {
  id: string;
  hospital: {
    id: string;
    name: string;
    province?: string;
    city?: string;
  };
  required_periods: number;
  status: string;
  joined_at: string;
}

interface ProjectCoordinator {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  hospital: {
    id: string;
    name: string;
  };
  role: string;
  invited_at: string;
  accepted_at?: string;
  is_active: boolean;
}

interface Hospital {
  id: string;
  name: string;
  province?: string;
  city?: string;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCreateHospitalModal, setShowCreateHospitalModal] = useState(false);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedTab, setSelectedTab] = useState('overview');
  
  // Estados de carga usando el hook personalizado
  const { isLoading: isSaving, executeWithLoading: executeWithSaving } = useLoadingState();
  const { isLoading: isDeleting, executeWithLoading: executeWithDeleting } = useLoadingState();
  const { isLoading: isCreatingHospital, executeWithLoading: executeWithCreatingHospital } = useLoadingState();
  const { isLoading: isInvitingCoordinator, executeWithLoading: executeWithInvitingCoordinator } = useLoadingState();

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    status: 'active' as 'active' | 'completed' | 'archived',
    total_target_cases: '',
    default_required_periods: 2
  });

  // Invite form states
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
  
  // Estados para filtros y búsqueda
  const [hospitalSearchTerm, setHospitalSearchTerm] = useState('');
  const [coordinatorSearchTerm, setCoordinatorSearchTerm] = useState('');
  const [hospitalStatusFilter, setHospitalStatusFilter] = useState('all');
  const [coordinatorStatusFilter, setCoordinatorStatusFilter] = useState('all');
  
  // Estados para paginación
  const [hospitalCurrentPage, setHospitalCurrentPage] = useState(1);
  const [coordinatorCurrentPage, setCoordinatorCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Estados para selección múltiple
  const [selectedHospitals, setSelectedHospitals] = useState<string[]>([]);
  const [selectedCoordinators, setSelectedCoordinators] = useState<string[]>([]);
  
  // Hook de notificaciones
  const { addNotification } = useNotifications();
  
  // Hook de confirmación
  const { confirm, isConfirming, confirmationData, handleConfirm, handleCancel } = useConfirmation();
  
  // Shortcuts de teclado
  useKeyboardShortcuts({
    shortcuts: createAppShortcuts(router),
    enabled: true,
    showHelp: true
  });

  // Create hospital form states
  const [hospitalData, setHospitalData] = useState({
    name: ''
  });

  useEffect(() => {
    // Esperar un poco para que el AuthContext se inicialice
    const timer = setTimeout(() => {
      loadProject();
      loadHospitals();
    }, 200);
    
    return () => clearTimeout(timer);
  }, [projectId]);

  const loadProject = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/projects/${projectId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Error al cargar el proyecto');
      }

      const data = await response.json();
      setProject(data.project);
      
      // Set form data
      setFormData({
        name: data.project.name,
        description: data.project.description || '',
        start_date: data.project.start_date ? data.project.start_date.split('T')[0] : '',
        end_date: data.project.end_date ? data.project.end_date.split('T')[0] : '',
        status: data.project.status,
        total_target_cases: data.project.total_target_cases?.toString() || '',
        default_required_periods: data.project.default_required_periods || 2
      });
    } catch (error) {
      console.error('Error loading project:', error);
      toast.error('Error al cargar el proyecto');
    } finally {
      setIsLoading(false);
    }
  };

  const loadHospitals = async () => {
    try {
      const response = await fetch('/api/hospitals', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setHospitals(data.hospitals || []);
      }
    } catch (error) {
      console.error('Error loading hospitals:', error);
    }
  };

  // Initialize invite data with project default when modal opens
  useEffect(() => {
    if (showInviteModal && project) {
      setInviteData(prev => ({
        ...prev,
        required_periods: project.default_required_periods || 2
      }));
    } else if (!showInviteModal) {
      // Reset form when modal closes
      resetInviteForm();
    }
  }, [showInviteModal, project]);

  const handleSave = async () => {
    await executeWithSaving(async () => {
      const response = await fetch(`/api/admin/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar el proyecto');
      }

      const data = await response.json();
      setProject(data.project);
      setIsEditing(false);
      toast.success('Proyecto actualizado exitosamente');
    });
  };

  const handleDelete = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Debe escribir "DELETE" para confirmar la eliminación');
      return;
    }

    await executeWithDeleting(async () => {
      const response = await fetch(`/api/admin/projects/${projectId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar el proyecto');
      }

      toast.success('Proyecto eliminado exitosamente');
      router.push('/es/admin/projects');
    });
  };

  const handleInviteCoordinator = async () => {
    await executeWithInvitingCoordinator(async () => {
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

      const response = await fetch(`/api/admin/projects/${projectId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(dataToSend)
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || 'Error al enviar invitación');
        return; // Salir sin lanzar error
      }

      toast.success('Invitación enviada exitosamente');
      setShowInviteModal(false);
      resetInviteForm();
      loadProject(); // Reload to show new coordinator
    });
  };

  const resetInviteForm = () => {
    setInviteData({ 
      email: '', 
      first_name: '', 
      last_name: '',
      phone: '',
      hospital_id: '', 
      required_periods: project?.default_required_periods || 2 
    });
    setSelectedCoordinator(null);
    setIsNewCoordinator(false);
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
      
      // Recargar la lista de hospitales primero
      await loadHospitals();
      
      // Auto-seleccionar el hospital recién creado
      setInviteData(prev => ({
        ...prev,
        hospital_id: data.hospital.id
      }));
      
      toast.success('Hospital creado exitosamente');
      setShowCreateHospitalModal(false);
      setHospitalData({ name: '' });
    });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      archived: 'bg-gray-100 text-gray-800'
    };
    
    const labels = {
      active: 'Activo',
      completed: 'Completado',
      archived: 'Archivado'
    };

    return (
      <Badge className={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  // Funciones para manejar acciones de hospitales
  const handleViewHospital = (hospitalId: string) => {
    router.push(`/es/admin/hospitals/${hospitalId}`);
  };

  const handleRemoveHospital = (hospitalId: string, hospitalName: string) => {
    confirm(
      {
        title: 'Eliminar Hospital del Proyecto',
        description: `¿Estás seguro de que quieres eliminar el hospital "${hospitalName}" de este proyecto?`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        variant: 'destructive'
      },
      async () => {
        const response = await fetch(`/api/admin/projects/${projectId}/hospitals/${hospitalId}`, {
          method: 'DELETE',
          credentials: 'include'
        });

        if (response.ok) {
          toast.success(`Hospital "${hospitalName}" eliminado del proyecto exitosamente`);
          loadProject(); // Recargar datos del proyecto
        } else {
          const errorData = await response.json();
          toast.error(errorData.error || 'Error al eliminar el hospital del proyecto');
        }
      }
    );
  };

  // Funciones para manejar acciones de coordinadores
  const handleViewCoordinator = (userId: string) => {
    router.push(`/es/admin/coordinators/${userId}`);
  };

  const handleResendInvitation = async (projectCoordinatorId: string, email: string) => {
    await executeWithLoading(async () => {
      const response = await fetch(`/api/admin/projects/${projectId}/coordinators/${projectCoordinatorId}/resend-invitation`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        toast.success(`Invitación reenviada exitosamente a ${email}`);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Error al reenviar la invitación');
      }
    });
  };

  const handleRemoveCoordinator = (projectCoordinatorId: string, coordinatorName: string) => {
    confirm(
      {
        title: 'Eliminar Coordinador del Proyecto',
        description: `¿Estás seguro de que quieres eliminar el coordinador "${coordinatorName}" de este proyecto?`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        variant: 'destructive'
      },
      async () => {
        const response = await fetch(`/api/admin/projects/${projectId}/coordinators/${projectCoordinatorId}`, {
          method: 'DELETE',
          credentials: 'include'
        });

        if (response.ok) {
          toast.success(`Coordinador "${coordinatorName}" eliminado del proyecto exitosamente`);
          loadProject(); // Recargar datos del proyecto
        } else {
          const errorData = await response.json();
          toast.error(errorData.error || 'Error al eliminar el coordinador del proyecto');
        }
      }
    );
  };

  // Funciones de filtrado
  const filteredHospitals = (project?.project_hospitals || []).filter(ph => {
    const matchesSearch = ph.hospital.name.toLowerCase().includes(hospitalSearchTerm.toLowerCase()) ||
                         (ph.hospital.city && ph.hospital.city.toLowerCase().includes(hospitalSearchTerm.toLowerCase())) ||
                         (ph.hospital.province && ph.hospital.province.toLowerCase().includes(hospitalSearchTerm.toLowerCase()));
    
    const matchesStatus = hospitalStatusFilter === 'all' || ph.status === hospitalStatusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const filteredCoordinators = (project?.project_coordinators || []).filter(pc => {
    const matchesSearch = pc.user.name.toLowerCase().includes(coordinatorSearchTerm.toLowerCase()) ||
                         pc.user.email.toLowerCase().includes(coordinatorSearchTerm.toLowerCase()) ||
                         pc.hospital.name.toLowerCase().includes(coordinatorSearchTerm.toLowerCase());
    
    const matchesStatus = coordinatorStatusFilter === 'all' || 
                         (coordinatorStatusFilter === 'accepted' && pc.accepted_at) ||
                         (coordinatorStatusFilter === 'pending' && !pc.accepted_at);
    
    return matchesSearch && matchesStatus;
  });

  // Paginación
  const totalHospitalPages = Math.ceil(filteredHospitals.length / itemsPerPage);
  const totalCoordinatorPages = Math.ceil(filteredCoordinators.length / itemsPerPage);
  
  const paginatedHospitals = filteredHospitals.slice(
    (hospitalCurrentPage - 1) * itemsPerPage,
    hospitalCurrentPage * itemsPerPage
  );
  
  const paginatedCoordinators = filteredCoordinators.slice(
    (coordinatorCurrentPage - 1) * itemsPerPage,
    coordinatorCurrentPage * itemsPerPage
  );

  // Resetear paginación cuando cambien los filtros
  const handleHospitalSearchChange = (value: string) => {
    setHospitalSearchTerm(value);
    setHospitalCurrentPage(1);
  };

  const handleHospitalStatusChange = (value: string) => {
    setHospitalStatusFilter(value);
    setHospitalCurrentPage(1);
  };

  const handleCoordinatorSearchChange = (value: string) => {
    setCoordinatorSearchTerm(value);
    setCoordinatorCurrentPage(1);
  };

  const handleCoordinatorStatusChange = (value: string) => {
    setCoordinatorStatusFilter(value);
    setCoordinatorCurrentPage(1);
  };

  // Funciones para selección múltiple
  const handleHospitalSelect = (hospitalId: string, checked: boolean) => {
    if (checked) {
      setSelectedHospitals(prev => [...prev, hospitalId]);
    } else {
      setSelectedHospitals(prev => prev.filter(id => id !== hospitalId));
    }
  };

  const handleCoordinatorSelect = (coordinatorId: string, checked: boolean) => {
    if (checked) {
      setSelectedCoordinators(prev => [...prev, coordinatorId]);
    } else {
      setSelectedCoordinators(prev => prev.filter(id => id !== coordinatorId));
    }
  };

  const handleSelectAllHospitals = (checked: boolean) => {
    if (checked) {
      setSelectedHospitals(paginatedHospitals.map(h => h.id));
    } else {
      setSelectedHospitals([]);
    }
  };

  const handleSelectAllCoordinators = (checked: boolean) => {
    if (checked) {
      setSelectedCoordinators(paginatedCoordinators.map(c => c.id));
    } else {
      setSelectedCoordinators([]);
    }
  };

  // Funciones para acciones masivas
  const handleBulkHospitalAction = (action: string, items: string[]) => {
    switch (action) {
      case 'delete':
        confirm(
          {
            title: 'Eliminar Hospitales del Proyecto',
            description: `¿Estás seguro de que quieres eliminar ${items.length} hospital(es) del proyecto?`,
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
            variant: 'destructive'
          },
          async () => {
            for (const projectHospitalId of items) {
              const projectHospital = paginatedHospitals.find(h => h.id === projectHospitalId);
              if (projectHospital) {
                const response = await fetch(`/api/admin/projects/${projectId}/hospitals/${projectHospital.hospital.id}`, {
                  method: 'DELETE',
                  credentials: 'include'
                });

                if (response.ok) {
                  toast.success(`Hospital "${projectHospital.hospital.name}" eliminado del proyecto exitosamente`);
                } else {
                  const errorData = await response.json();
                  toast.error(errorData.error || 'Error al eliminar el hospital del proyecto');
                }
              }
            }
            setSelectedHospitals([]);
            loadProject(); // Recargar datos del proyecto
          }
        );
        break;
      case 'export':
        const hospitalsToExport = paginatedHospitals.filter(h => items.includes(h.id));
        ExportService.exportHospitals(hospitalsToExport);
        addNotification({
          type: 'success',
          title: 'Exportación completada',
          message: `Se exportaron ${hospitalsToExport.length} hospitales`
        });
        break;
    }
  };

  const handleBulkCoordinatorAction = (action: string, items: string[]) => {
    switch (action) {
      case 'delete':
        confirm(
          {
            title: 'Eliminar Coordinadores del Proyecto',
            description: `¿Estás seguro de que quieres eliminar ${items.length} coordinador(es) del proyecto?`,
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
            variant: 'destructive'
          },
          async () => {
            for (const coordinatorId of items) {
              const coordinator = paginatedCoordinators.find(c => c.id === coordinatorId);
              if (coordinator) {
                const response = await fetch(`/api/admin/projects/${projectId}/coordinators/${coordinatorId}`, {
                  method: 'DELETE',
                  credentials: 'include'
                });

                if (response.ok) {
                  toast.success(`Coordinador "${coordinator.user.name}" eliminado del proyecto exitosamente`);
                } else {
                  const errorData = await response.json();
                  toast.error(errorData.error || 'Error al eliminar el coordinador del proyecto');
                }
              }
            }
            setSelectedCoordinators([]);
            loadProject(); // Recargar datos del proyecto
          }
        );
        break;
      case 'export':
        const coordinatorsToExport = paginatedCoordinators.filter(c => items.includes(c.id));
        ExportService.exportCoordinators(coordinatorsToExport);
        addNotification({
          type: 'success',
          title: 'Exportación completada',
          message: `Se exportaron ${coordinatorsToExport.length} coordinadores`
        });
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Proyecto no encontrado</h2>
          <p className="text-gray-600 mb-4">El proyecto que buscas no existe o no tienes permisos para verlo.</p>
          <Button onClick={() => router.push('/es/admin/projects')}>
            Volver a Proyectos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900 truncate">{project.name}</h1>
              {getStatusBadge(project.status)}
            </div>
            {project.description && (
              <p className="text-gray-600 text-sm leading-relaxed">{project.description}</p>
            )}
          </div>
          <div className="w-80 ml-6">
            <GlobalSearch 
              placeholder="Buscar en todos los proyectos..."
              onResultClick={(result) => {
                if (result.type === 'project') {
                  router.push(result.url);
                } else {
                  // Para otros tipos, mostrar en modal o nueva pestaña
                  window.open(result.url, '_blank');
                }
              }}
            />
          </div>
          <div className="flex items-center gap-2 ml-4 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="h-9"
            >
              <Edit className="h-4 w-4 mr-2" />
              {isEditing ? 'Cancelar' : 'Editar'}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="h-9">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
              </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar proyecto?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción eliminará permanentemente el proyecto y todos los datos asociados.
                  Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="delete-confirm">
                    Escriba <strong>DELETE</strong> para confirmar:
                  </Label>
                  <Input
                    id="delete-confirm"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="DELETE"
                    className="mt-2"
                  />
                </div>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  {isDeleting ? 'Eliminando...' : 'Eliminar Proyecto'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          </div>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <div className="border-b border-gray-200">
          <TabsList className="bg-transparent p-0 h-auto">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none border-b-2 border-transparent px-4 py-3"
            >
              Resumen
            </TabsTrigger>
            <TabsTrigger 
              value="hospitals" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none border-b-2 border-transparent px-4 py-3"
            >
              Hospitales ({project._count.project_hospitals})
            </TabsTrigger>
            <TabsTrigger 
              value="coordinators" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none border-b-2 border-transparent px-4 py-3"
            >
              Coordinadores ({project._count.project_coordinators})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Project Details */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">Detalles del Proyecto</CardTitle>
              <CardDescription>
                Información general y configuración del proyecto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nombre del Proyecto</Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{project.name}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="status">Estado</Label>
                  {isEditing ? (
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Activo</SelectItem>
                        <SelectItem value="completed">Completado</SelectItem>
                        <SelectItem value="archived">Archivado</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="mt-1">{getStatusBadge(project.status)}</div>
                  )}
                </div>

                <div>
                  <Label htmlFor="start_date">Fecha de Inicio</Label>
                  {isEditing ? (
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">
                      {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'No especificada'}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="end_date">Fecha de Fin</Label>
                  {isEditing ? (
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">
                      {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'No especificada'}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="total_target_cases">Meta de Casos</Label>
                  {isEditing ? (
                    <Input
                      id="total_target_cases"
                      type="number"
                      value={formData.total_target_cases}
                      onChange={(e) => setFormData({ ...formData, total_target_cases: e.target.value })}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">
                      {project.total_target_cases ? project.total_target_cases.toLocaleString() : 'No especificada'}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="default_required_periods">Períodos Requeridos por Defecto</Label>
                  {isEditing ? (
                    <Input
                      id="default_required_periods"
                      type="number"
                      min="1"
                      max="10"
                      value={formData.default_required_periods}
                      onChange={(e) => setFormData({ ...formData, default_required_periods: parseInt(e.target.value) || 2 })}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">
                      {project.default_required_periods || 2}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Cantidad de períodos que se asignarán automáticamente a nuevas invitaciones
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descripción</Label>
                {isEditing ? (
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1"
                    rows={3}
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">
                    {project.description || 'Sin descripción'}
                  </p>
                )}
              </div>

              {isEditing && (
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    disabled={isSaving}
                    className="px-6"
                  >
                    Cancelar
                  </Button>
                  <LoadingButton
                    onClick={handleSave}
                    loading={isSaving}
                    loadingText="Guardando..."
                    className="px-6"
                  >
                    Guardar Cambios
                  </LoadingButton>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hospitals" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Hospitales Participantes</CardTitle>
                  <CardDescription>
                    Hospitales que participan en este proyecto
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Controles de búsqueda y filtros para hospitales */}
              <div className="mb-4 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Buscar hospitales por nombre, ciudad o provincia..."
                      value={hospitalSearchTerm}
                      onChange={(e) => handleHospitalSearchChange(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="w-full sm:w-48">
                    <Select value={hospitalStatusFilter} onValueChange={handleHospitalStatusChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filtrar por estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los estados</SelectItem>
                        <SelectItem value="active">Activo</SelectItem>
                        <SelectItem value="inactive">Inactivo</SelectItem>
                        <SelectItem value="pending">Pendiente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              <div className="text-sm text-gray-500">
                Mostrando {paginatedHospitals.length} de {filteredHospitals.length} hospitales
              </div>
            </div>
            
            {/* Acciones masivas para hospitales */}
            <BulkActions
              selectedItems={selectedHospitals}
              totalItems={paginatedHospitals.length}
              onSelectAll={handleSelectAllHospitals}
              onClearSelection={() => setSelectedHospitals([])}
              onBulkAction={handleBulkHospitalAction}
              availableActions={[
                { id: 'delete', label: 'Eliminar del proyecto', icon: <Trash2 className="h-4 w-4" />, variant: 'destructive' },
                { id: 'export', label: 'Exportar', icon: <Download className="h-4 w-4" /> }
              ]}
            />
            
            <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={selectedHospitals.length === paginatedHospitals.length && paginatedHospitals.length > 0}
                        onCheckedChange={handleSelectAllHospitals}
                      />
                    </TableHead>
                    <TableHead>Hospital</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Períodos Requeridos</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha de Ingreso</TableHead>
                    <TableHead className="w-[50px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedHospitals.length > 0 ? (
                    paginatedHospitals.map((ph) => (
                      <TableRow key={ph.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedHospitals.includes(ph.id)}
                            onCheckedChange={(checked) => handleHospitalSelect(ph.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{ph.hospital.name}</TableCell>
                        <TableCell>
                          {ph.hospital.province && ph.hospital.city 
                            ? `${ph.hospital.city}, ${ph.hospital.province}`
                            : 'No especificada'
                          }
                        </TableCell>
                        <TableCell>{ph.required_periods}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{ph.status}</Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(ph.joined_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleViewHospital(ph.hospital.id)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver Detalle
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleRemoveHospital(ph.hospital.id, ph.hospital.name)}
                                className="text-red-600"
                              >
                                <X className="mr-2 h-4 w-4" />
                                Eliminar de Proyecto
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                        No hay hospitales asignados a este proyecto
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              
              {/* Paginación para hospitales */}
              {totalHospitalPages > 1 && (
                <div className="mt-4">
                  <Pagination
                    currentPage={hospitalCurrentPage}
                    totalPages={totalHospitalPages}
                    onPageChange={setHospitalCurrentPage}
                    totalItems={filteredHospitals.length}
                    itemsPerPage={itemsPerPage}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coordinators" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Coordinadores</CardTitle>
                  <CardDescription>
                    Coordinadores asignados a este proyecto
                  </CardDescription>
                </div>
                <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invitar Coordinador
                    </Button>
                  </DialogTrigger>
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
                        onClick={() => setShowInviteModal(false)}
                      >
                        Cancelar
                      </Button>
                      <LoadingButton 
                        onClick={handleInviteCoordinator}
                        loading={isInvitingCoordinator}
                        loadingText="Enviando..."
                      >
                        Enviar Invitación
                      </LoadingButton>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {/* Controles de búsqueda y filtros para coordinadores */}
              <div className="mb-4 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Buscar coordinadores por nombre, email o hospital..."
                      value={coordinatorSearchTerm}
                      onChange={(e) => handleCoordinatorSearchChange(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="w-full sm:w-48">
                    <Select value={coordinatorStatusFilter} onValueChange={handleCoordinatorStatusChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filtrar por estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los estados</SelectItem>
                        <SelectItem value="accepted">Aceptado</SelectItem>
                        <SelectItem value="pending">Pendiente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              <div className="text-sm text-gray-500">
                Mostrando {paginatedCoordinators.length} de {filteredCoordinators.length} coordinadores
              </div>
            </div>
            
            {/* Acciones masivas para coordinadores */}
            <BulkActions
              selectedItems={selectedCoordinators}
              totalItems={paginatedCoordinators.length}
              onSelectAll={handleSelectAllCoordinators}
              onClearSelection={() => setSelectedCoordinators([])}
              onBulkAction={handleBulkCoordinatorAction}
              availableActions={[
                { id: 'delete', label: 'Eliminar del proyecto', icon: <Trash2 className="h-4 w-4" />, variant: 'destructive' },
                { id: 'export', label: 'Exportar', icon: <Download className="h-4 w-4" /> }
              ]}
            />
            
            <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={selectedCoordinators.length === paginatedCoordinators.length && paginatedCoordinators.length > 0}
                        onCheckedChange={handleSelectAllCoordinators}
                      />
                    </TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Hospital</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha de Invitación</TableHead>
                    <TableHead className="w-[50px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCoordinators.length > 0 ? (
                    paginatedCoordinators.map((pc) => (
                      <TableRow key={pc.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedCoordinators.includes(pc.id)}
                            onCheckedChange={(checked) => handleCoordinatorSelect(pc.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{pc.user.name}</TableCell>
                        <TableCell>{pc.user.email}</TableCell>
                        <TableCell>{pc.hospital.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{pc.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={pc.accepted_at ? "default" : "secondary"}
                          >
                            {pc.accepted_at ? 'Aceptado' : 'Pendiente'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(pc.invited_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleViewCoordinator(pc.user.id)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver Detalle
                              </DropdownMenuItem>
                              {!pc.accepted_at && (
                                <DropdownMenuItem onClick={() => handleResendInvitation(pc.id, pc.user.email)}>
                                  <Mail className="mr-2 h-4 w-4" />
                                  Reenviar Invitación
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleRemoveCoordinator(pc.id, pc.user.name)}
                                className="text-red-600"
                              >
                                <X className="mr-2 h-4 w-4" />
                                Eliminar de Proyecto
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                        No hay coordinadores invitados a este proyecto
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              
              {/* Paginación para coordinadores */}
              {totalCoordinatorPages > 1 && (
                <div className="mt-4">
                  <Pagination
                    currentPage={coordinatorCurrentPage}
                    totalPages={totalCoordinatorPages}
                    onPageChange={setCoordinatorCurrentPage}
                    totalItems={filteredCoordinators.length}
                    itemsPerPage={itemsPerPage}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirmation Toast */}
      {confirmationData && (
        <ConfirmationToast
          isOpen={true}
          options={confirmationData.options}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          isLoading={isConfirming}
        />
      )}
    </div>
  );
}