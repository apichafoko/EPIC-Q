'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/hooks/useTranslations';
import { AuthGuard } from '@/components/auth/auth-guard';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Users, 
  Building2,
  Calendar,
  Target,
  Loader2,
  CheckSquare,
  Square,
  AlertTriangle,
  X,
  Play
} from 'lucide-react';
import { Project } from '@/types';
import { LoadingButton } from '@/components/ui/loading-button';
import { useLoadingState } from '@/hooks/useLoadingState';
import { toast } from 'sonner';
import { InviteCoordinatorModal } from '@/components/admin/invite-coordinator-modal';

interface ProjectWithCounts extends Project {
  _count: {
    project_hospitals: number;
    project_coordinators: number;
  };
}

export default function AdminProjectsPage() {
  const { t } = useTranslations();
  const router = useRouter();
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectWithCounts | null>(null);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  
  // Estados de carga usando el hook personalizado
  const { isLoading: creating, executeWithLoading: executeWithCreating } = useLoadingState();
  const { isLoading: inviting, executeWithLoading: executeWithInviting } = useLoadingState();
  const { isLoading: deactivating, executeWithLoading: executeWithDeactivating } = useLoadingState();
  const { isLoading: activating, executeWithLoading: executeWithActivating } = useLoadingState();
  const { isLoading: deleting, executeWithLoading: executeWithDeleting } = useLoadingState();
  const { isLoading: bulkDeactivating, executeWithLoading: executeWithBulkDeactivating } = useLoadingState();
  const { isLoading: bulkActivating, executeWithLoading: executeWithBulkActivating } = useLoadingState();
  const { isLoading: bulkDeleting, executeWithLoading: executeWithBulkDeleting } = useLoadingState();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    default_required_periods: 2,
  });
  const [hospitals, setHospitals] = useState<any[]>([]);

  useEffect(() => {
    // Solo cargar proyectos si el usuario está autenticado
    if (user) {
      loadProjects();
      loadHospitals();
    }
  }, [user]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      console.log('Loading projects...');
      const response = await fetch('/api/admin/projects', {
        credentials: 'include'
      });
      console.log('Projects response status:', response.status);
      const result = await response.json();
      console.log('Projects response data:', result);
      
      if (result.success) {
        setProjects(result.projects);
      } else {
        console.error('Projects API error:', result.error);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadHospitals = async () => {
    try {
      console.log('Loading hospitals...');
      const response = await fetch('/api/hospitals', {
        credentials: 'include'
      });
      console.log('Hospitals response status:', response.status);
      const result = await response.json();
      console.log('Hospitals response data:', result);
      
      if (result.success) {
        console.log('Setting hospitals:', result.hospitals);
        setHospitals(result.hospitals);
      } else {
        console.error('Hospitals API error:', result.error);
      }
    } catch (error) {
      console.error('Error loading hospitals:', error);
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      alert('El nombre del proyecto es requerido');
      return false;
    }

    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      
      if (endDate <= startDate) {
        alert('La fecha de fin debe ser posterior a la fecha de inicio');
        return false;
      }
    }


    return true;
  };

  const handleCreateProject = async () => {
    if (!validateForm()) {
      return;
    }

    await executeWithCreating(async () => {
      const projectData = {
        ...formData,
      };

      const response = await fetch('/api/admin/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(projectData),
      });

      const result = await response.json();
      
      if (result.success) {
        setShowCreateDialog(false);
        setFormData({
          name: '',
          description: '',
          start_date: '',
          end_date: '',
          default_required_periods: 2,
        });
        loadProjects();
        toast.success('Proyecto creado exitosamente');
      } else {
        toast.error(result.error || 'Error al crear proyecto');
      }
    });
  };

  // Función para desactivar un proyecto individual
  const handleDeactivateProject = async (projectId: string) => {
    await executeWithDeactivating(async () => {
      try {
        const response = await fetch(`/api/admin/projects/${projectId}/deactivate`, {
          method: 'PUT',
          credentials: 'include',
        });

        const result = await response.json();
        
        if (result.success) {
          loadProjects();
          toast.success('Proyecto desactivado exitosamente');
        } else {
          toast.error(result.error || 'Error al desactivar proyecto');
        }
      } catch (error) {
        console.error('Error deactivating project:', error);
        toast.error('Error al desactivar proyecto');
      }
    });
  };

  // Función para activar un proyecto individual
  const handleActivateProject = async (projectId: string) => {
    await executeWithActivating(async () => {
      try {
        const response = await fetch(`/api/admin/projects/${projectId}/activate`, {
          method: 'PUT',
          credentials: 'include',
        });

        const result = await response.json();
        
        if (result.success) {
          loadProjects();
          toast.success('Proyecto activado exitosamente');
        } else {
          toast.error(result.error || 'Error al activar proyecto');
        }
      } catch (error) {
        console.error('Error activating project:', error);
        toast.error('Error al activar proyecto');
      }
    });
  };

  // Función para eliminar un proyecto individual
  const handleDeleteProject = async (projectId: string) => {
    if (deleteConfirmation !== 'DELETE') {
      toast.error('Debe escribir DELETE para confirmar la eliminación');
      return;
    }

    await executeWithDeleting(async () => {
      try {
        const response = await fetch(`/api/admin/projects/${projectId}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        const result = await response.json();
        
        if (result.success) {
          setShowDeleteDialog(false);
          setDeleteConfirmation('');
          setSelectedProject(null);
          loadProjects();
          toast.success('Proyecto eliminado exitosamente');
        } else {
          toast.error(result.error || 'Error al eliminar proyecto');
        }
      } catch (error) {
        console.error('Error deleting project:', error);
        toast.error('Error al eliminar proyecto');
      }
    });
  };

  // Función para desactivar múltiples proyectos
  const handleBulkDeactivate = async () => {
    if (selectedProjects.length === 0) {
      toast.error('Seleccione al menos un proyecto');
      return;
    }

    await executeWithBulkDeactivating(async () => {
      try {
        const response = await fetch('/api/admin/projects/bulk-deactivate', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ projectIds: selectedProjects }),
        });

        const result = await response.json();
        
        if (result.success) {
          setSelectedProjects([]);
          setShowBulkActions(false);
          loadProjects();
          toast.success(`${selectedProjects.length} proyectos desactivados exitosamente`);
        } else {
          toast.error(result.error || 'Error al desactivar proyectos');
        }
      } catch (error) {
        console.error('Error bulk deactivating projects:', error);
        toast.error('Error al desactivar proyectos');
      }
    });
  };

  // Función para activar múltiples proyectos
  const handleBulkActivate = async () => {
    if (selectedProjects.length === 0) {
      toast.error('Seleccione al menos un proyecto');
      return;
    }

    await executeWithBulkActivating(async () => {
      try {
        const response = await fetch('/api/admin/projects/bulk-activate', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ projectIds: selectedProjects }),
        });

        const result = await response.json();
        
        if (result.success) {
          setSelectedProjects([]);
          setShowBulkActions(false);
          loadProjects();
          toast.success(`${selectedProjects.length} proyectos activados exitosamente`);
        } else {
          toast.error(result.error || 'Error al activar proyectos');
        }
      } catch (error) {
        console.error('Error bulk activating projects:', error);
        toast.error('Error al activar proyectos');
      }
    });
  };

  // Función para eliminar múltiples proyectos
  const handleBulkDelete = async () => {
    if (selectedProjects.length === 0) {
      toast.error('Seleccione al menos un proyecto');
      return;
    }

    if (deleteConfirmation !== 'DELETE') {
      toast.error('Debe escribir DELETE para confirmar la eliminación');
      return;
    }

    await executeWithBulkDeleting(async () => {
      try {
        const response = await fetch('/api/admin/projects/bulk-delete', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ projectIds: selectedProjects }),
        });

        const result = await response.json();
        
        if (result.success) {
          setSelectedProjects([]);
          setShowBulkActions(false);
          setDeleteConfirmation('');
          loadProjects();
          toast.success(`${selectedProjects.length} proyectos eliminados exitosamente`);
        } else {
          toast.error(result.error || 'Error al eliminar proyectos');
        }
      } catch (error) {
        console.error('Error bulk deleting projects:', error);
        toast.error('Error al eliminar proyectos');
      }
    });
  };

  // Función para manejar selección de proyectos
  const handleProjectSelect = (projectId: string, checked: boolean) => {
    if (checked) {
      setSelectedProjects(prev => [...prev, projectId]);
    } else {
      setSelectedProjects(prev => prev.filter(id => id !== projectId));
    }
  };

  // Función para seleccionar/deseleccionar todos los proyectos
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProjects(filteredProjects.map(p => p.id));
    } else {
      setSelectedProjects([]);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Activo', className: 'bg-green-100 text-green-800' },
      completed: { label: 'Completado', className: 'bg-blue-100 text-blue-800' },
      inactive: { label: 'Inactivo', className: 'bg-orange-100 text-orange-800' },
      archived: { label: 'Archivado', className: 'bg-gray-100 text-gray-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <AuthGuard allowedRoles={['admin']}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Proyectos</h1>
            <p className="text-gray-600">Administra los proyectos del sistema EPIC-Q</p>
          </div>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Crear Proyecto
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Proyecto</DialogTitle>
                <DialogDescription>
                  Completa la información básica del proyecto
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label htmlFor="name">Nombre del Proyecto *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: EPIC-Q Fase 2"
                  />
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descripción del proyecto..."
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label htmlFor="start_date">Fecha de Inicio</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="end_date">Fecha de Fin</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="default_required_periods">Períodos Requeridos por Defecto</Label>
                  <Input
                    id="default_required_periods"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.default_required_periods}
                    onChange={(e) => setFormData({ ...formData, default_required_periods: parseInt(e.target.value) || 2 })}
                    placeholder="2"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Cantidad de períodos que se asignarán automáticamente a nuevas invitaciones
                  </p>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancelar
                </Button>
                <LoadingButton 
                  onClick={handleCreateProject} 
                  loading={creating}
                  loadingText="Creando..."
                  disabled={!formData.name}
                >
                  Crear Proyecto
                </LoadingButton>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Proyectos</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projects.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Proyectos Activos</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {projects.filter(p => p.status === 'active').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hospitales</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {projects.reduce((sum, p) => sum + p._count.project_hospitals, 0)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Coordinadores</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {projects.reduce((sum, p) => sum + p._count.project_coordinators, 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Proyectos</CardTitle>
            <CardDescription>
              Lista de todos los proyectos del sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar proyectos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activos</option>
                <option value="completed">Completados</option>
                <option value="inactive">Inactivos</option>
                <option value="archived">Archivados</option>
              </select>
            </div>

            {/* Barra de acciones bulk */}
            {selectedProjects.length > 0 && (
              <div className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg mb-4">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-orange-800 font-medium">
                    {selectedProjects.length} proyecto{selectedProjects.length > 1 ? 's' : ''} seleccionado{selectedProjects.length > 1 ? 's' : ''}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedProjects([])}
                    className="text-orange-700 border-orange-300 hover:bg-orange-100"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkActivate}
                    disabled={bulkActivating}
                    className="text-green-700 border-green-300 hover:bg-green-100"
                  >
                    {bulkActivating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    Activar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkDeactivate}
                    disabled={bulkDeactivating}
                    className="text-orange-700 border-orange-300 hover:bg-orange-100"
                  >
                    {bulkDeactivating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 mr-2" />
                    )}
                    Desactivar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBulkActions(true)}
                    disabled={bulkDeleting}
                    className="text-red-700 border-red-300 hover:bg-red-100"
                  >
                    {bulkDeleting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Eliminar
                  </Button>
                </div>
              </div>
            )}

            {/* Projects Table */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={selectedProjects.length === filteredProjects.length && filteredProjects.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Hospitales</TableHead>
                    <TableHead>Coordinadores</TableHead>
                    <TableHead>Fecha de Creación</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedProjects.includes(project.id)}
                          onCheckedChange={(checked) => handleProjectSelect(project.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{project.name}</div>
                          {project.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {project.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(project.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Building2 className="h-4 w-4 mr-1 text-gray-400" />
                          {project._count.project_hospitals}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1 text-gray-400" />
                          {project._count.project_coordinators}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(project.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => router.push(`/es/admin/projects/${project.id}`)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Ver Detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedProject(project);
                                setShowInviteDialog(true);
                              }}
                            >
                              <Users className="h-4 w-4 mr-2" />
                              Invitar Coordinador
                            </DropdownMenuItem>
                            {project.status === 'active' && (
                              <DropdownMenuItem
                                onClick={() => handleDeactivateProject(project.id)}
                                className="text-orange-600"
                              >
                                <AlertTriangle className="h-4 w-4 mr-2" />
                                Desactivar
                              </DropdownMenuItem>
                            )}
                            {project.status === 'inactive' && (
                              <DropdownMenuItem
                                onClick={() => handleActivateProject(project.id)}
                                className="text-green-600"
                              >
                                <Play className="h-4 w-4 mr-2" />
                                Activar
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedProject(project);
                                setShowDeleteDialog(true);
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Modal de invitación de coordinador */}
        <InviteCoordinatorModal
          open={showInviteDialog}
          onOpenChange={setShowInviteDialog}
          project={selectedProject}
          hospitals={hospitals}
          onSuccess={async () => {
            await loadProjects(); // Recargar la lista de proyectos
            await loadHospitals(); // Recargar la lista de hospitales
          }}
          onHospitalCreated={(newHospital) => {
            // Agregar el nuevo hospital a la lista local sin recargar la página
            setHospitals(prev => [...prev, newHospital]);
          }}
        />

        {/* Modal de confirmación de eliminación individual */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirmar Eliminación</DialogTitle>
              <DialogDescription>
                Esta acción no se puede deshacer. El proyecto será eliminado permanentemente.
                <br />
                <strong>Escriba "DELETE" para confirmar:</strong>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Escriba DELETE"
                className="font-mono"
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeleteConfirmation('');
                  setSelectedProject(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => selectedProject && handleDeleteProject(selectedProject.id)}
                disabled={deleting || deleteConfirmation !== 'DELETE'}
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de confirmación de eliminación bulk */}
        <Dialog open={showBulkActions} onOpenChange={setShowBulkActions}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirmar Eliminación Masiva</DialogTitle>
              <DialogDescription>
                Esta acción no se puede deshacer. {selectedProjects.length} proyecto{selectedProjects.length > 1 ? 's' : ''} será{selectedProjects.length > 1 ? 'n' : ''} eliminado{selectedProjects.length > 1 ? 's' : ''} permanentemente.
                <br />
                <strong>Escriba "DELETE" para confirmar:</strong>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Escriba DELETE"
                className="font-mono"
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowBulkActions(false);
                  setDeleteConfirmation('');
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleBulkDelete}
                disabled={bulkDeleting || deleteConfirmation !== 'DELETE'}
              >
                {bulkDeleting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Eliminar {selectedProjects.length} Proyecto{selectedProjects.length > 1 ? 's' : ''}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  );
}
