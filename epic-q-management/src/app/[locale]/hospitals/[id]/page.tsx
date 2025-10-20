'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Mail, Phone, MapPin, Calendar, Users, Building, Activity, Trash2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Hospital, statusConfig } from '@/types';
import { getHospitalById } from '@/lib/services/hospital-service';
import { toast } from 'sonner';
import { useLoadingState } from '@/hooks/useLoadingState';
import { EditProjectHospitalModal } from '@/components/hospitals/edit-project-hospital-modal';
import { getProjectHospitalStatusLabel, getProjectStatusLabel } from '@/lib/utils';

export default function HospitalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const { isLoading: isDeactivating, executeWithLoading: executeWithDeactivating } = useLoadingState();
  const { isLoading: isDeleting, executeWithLoading: executeWithDeleting } = useLoadingState();

  useEffect(() => {
    const loadHospital = async () => {
      try {
        setLoading(true);
        const hospitalData = await getHospitalById(params.id as string);
        if (hospitalData) {
          setHospital(hospitalData);
        } else {
          toast.error('Hospital no encontrado');
          router.push(`/${params.locale}/hospitals`);
        }
      } catch (error) {
        console.error('Error loading hospital:', error);
        toast.error('Error al cargar el hospital');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      loadHospital();
    }
  }, [params.id, router]);

  const handleEditRelation = (project: any) => {
    // Crear objeto projectHospital con la estructura correcta
    const projectHospital = {
      id: project.project_hospital_id,
      project_id: project.project_id,
      hospital_id: project.hospital_id,
      required_periods: project.required_periods,
      redcap_id: project.redcap_id,
      status: project.project_hospital_status
    };
    
    setSelectedProject(projectHospital);
    setEditModalOpen(true);
  };

  const handleManageProject = (projectId: string) => {
    router.push(`/${params.locale}/admin/projects/${projectId}`);
  };

  const handleModalSuccess = () => {
    // Reload hospital data after successful update
    const loadHospital = async () => {
      try {
        const hospitalData = await getHospitalById(params.id as string);
        if (hospitalData) {
          setHospital(hospitalData);
        }
      } catch (error) {
        console.error('Error reloading hospital:', error);
      }
    };
    loadHospital();
  };

  const getStatusBadge = (status: Hospital['status']) => {
    if (!status) {
      return (
        <Badge className="bg-gray-100 text-gray-800 flex items-center space-x-1">
          <span>❓</span>
          <span>Sin estado</span>
        </Badge>
      );
    }
    
    const config = statusConfig[status];
    
    if (!config) {
      return (
        <Badge className="bg-gray-100 text-gray-800 flex items-center space-x-1">
          <span>❓</span>
          <span>{status}</span>
        </Badge>
      );
    }
    
    return (
      <Badge className={`${config.color} flex items-center space-x-1`}>
        <span>{config.icon}</span>
        <span>{config.label}</span>
      </Badge>
    );
  };

  const handleDeactivate = () => {
    if (!hospital) return;
    
    confirm(
      {
        title: 'Desactivar Hospital',
        description: `¿Estás seguro de que quieres desactivar el hospital "${hospital.name}"?`,
        confirmText: 'Desactivar',
        cancelText: 'Cancelar',
        variant: 'destructive'
      },
      async () => {
        await executeWithDeactivating(async () => {
          try {
            const response = await fetch(`/api/hospitals/${hospital.id}/deactivate`, {
              method: 'POST',
              credentials: 'include'
            });

            const data = await response.json();

            if (response.ok) {
              toast.success('Hospital desactivado exitosamente', {
                description: `El hospital "${hospital.name}" ha sido desactivado`
              });
              router.push(`/${params.locale}/hospitals`);
            } else {
              toast.error('Error al desactivar hospital', {
                description: data.error || 'Inténtalo de nuevo más tarde'
              });
            }
          } catch (error) {
            console.error('Error deactivating hospital:', error);
            toast.error('Error al desactivar hospital', {
              description: 'Ocurrió un error inesperado'
            });
          }
        });
      }
    );
  };

  const handleDelete = () => {
    if (!hospital) return;
    
    confirm(
      {
        title: 'Eliminar Hospital Permanentemente',
        description: `¿Estás seguro de que quieres eliminar permanentemente el hospital "${hospital.name}"? Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        variant: 'destructive'
      },
      async () => {
        await executeWithDeleting(async () => {
          try {
            const response = await fetch(`/api/hospitals/${hospital.id}`, {
              method: 'DELETE',
              credentials: 'include'
            });

            const data = await response.json();

            if (response.ok) {
              toast.success('Hospital eliminado exitosamente', {
                description: `El hospital "${hospital.name}" ha sido eliminado permanentemente`
              });
              router.push(`/${params.locale}/hospitals`);
            } else {
              toast.error('Error al eliminar hospital', {
                description: data.error || 'Inténtalo de nuevo más tarde'
              });
            }
          } catch (error) {
            console.error('Error deleting hospital:', error);
            toast.error('Error al eliminar hospital', {
              description: 'Ocurrió un error inesperado'
            });
          }
        });
      }
    );
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!hospital) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Hospital no encontrado</h1>
          <p className="text-gray-600 mb-6">El hospital que buscas no existe o ha sido eliminado.</p>
          <Button asChild>
          <Link href={`/${params.locale}/hospitals`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Hospitales
            </Link>
            </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
          <Link href={`/${params.locale}/hospitals`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Link>
            </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{hospital.name}</h1>
            <p className="text-gray-600 mt-1">
              {hospital.city}, {hospital.province}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button asChild>
          <Link href={`/hospitals/${hospital.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Link>
          </Button>
          <Button
            onClick={handleDeactivate}
            disabled={isDeactivating}
            variant="outline"
            size="sm"
            className="text-orange-600 border-orange-200 hover:bg-orange-50"
          >
            <Shield className="h-4 w-4 mr-2" />
            {isDeactivating ? 'Desactivando...' : 'Desactivar'}
          </Button>
          <Button
            onClick={handleDelete}
            disabled={isDeleting}
            variant="outline"
            size="sm"
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
        </div>
      </div>

      {/* Status and Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Estado</CardTitle>
          </CardHeader>
          <CardContent>
            {getStatusBadge(hospital.status)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Proyectos Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{hospital.active_projects || 0}</p>
            <p className="text-sm text-gray-500">Proyectos en curso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Participación LASOS</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={hospital.participated_lasos ? "default" : "secondary"}>
              {hospital.participated_lasos ? 'Sí' : 'No'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="projects">Proyectos</TabsTrigger>
          <TabsTrigger value="coordinators">Coordinadores</TabsTrigger>
          <TabsTrigger value="details">Detalles</TabsTrigger>
          <TabsTrigger value="contacts">Contactos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Proyectos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Proyectos</span>
                </CardTitle>
                <CardDescription>
                  Participación en proyectos del estudio EPIC-Q
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Proyectos Activos</span>
                    <Badge variant="default">{hospital.active_projects || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Proyectos Históricos</span>
                    <Badge variant="secondary">{hospital.historical_projects || 0}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Información del Hospital */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="h-5 w-5" />
                  <span>Información del Hospital</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{hospital.city}, {hospital.province}</span>
                  </div>
                  {hospital.total_beds && (
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{hospital.total_beds} camas</span>
                    </div>
                  )}
                  {hospital.operating_rooms && (
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{hospital.operating_rooms} quirófanos</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Proyectos Asociados</CardTitle>
              <CardDescription>
                Lista de proyectos en los que participa este hospital
              </CardDescription>
            </CardHeader>
            <CardContent>
              {hospital.projects && hospital.projects.length > 0 ? (
                <div className="space-y-4">
                  {hospital.projects.map((project) => (
                    <div key={project.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-medium">{project.name}</h3>
                            <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                              Proyecto: {getProjectStatusLabel(project.status)}
                            </Badge>
                            <Badge variant="outline">
                              Estado: {getProjectHospitalStatusLabel(project.project_hospital_status)}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500 mb-2">
                            {project.start_date && new Date(project.start_date).toLocaleDateString('es-AR')}
                            {project.end_date && ` - ${new Date(project.end_date).toLocaleDateString('es-AR')}`}
                          </p>
                          
                          {project.redcap_id && (
                            <div className="mb-2">
                              <span className="text-xs font-medium text-gray-500">ID RedCap:</span>
                              <span className="ml-2 text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                                {project.redcap_id}
                              </span>
                            </div>
                          )}

                          <div className="mb-2">
                            <span className="text-xs font-medium text-gray-500">Períodos requeridos:</span>
                            <span className="ml-2 text-sm">{project.required_periods}</span>
                          </div>

                          {project.coordinators && project.coordinators.length > 0 && (
                            <div className="mb-2">
                              <span className="text-xs font-medium text-gray-500">Coordinadores:</span>
                              <div className="mt-1 space-y-1">
                                {project.coordinators.map((coordinator) => (
                                  <div key={coordinator.id} className="text-sm">
                                    <span className="font-medium">{coordinator.name}</span>
                                    <span className="text-gray-500 ml-2">({coordinator.email})</span>
                                    {coordinator.is_active && (
                                      <Badge variant="outline" className="ml-2 text-xs">
                                        Activo
                                      </Badge>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {project.progress && (
                            <div className="mt-2 p-2 bg-gray-50 rounded">
                              <div className="text-xs font-medium text-gray-500 mb-1">Progreso del Proyecto:</div>
                              <div className="text-sm space-y-1">
                                {project.progress.ethics_submitted !== null && (
                                  <div>Ética presentada: {project.progress.ethics_submitted ? 'Sí' : 'No'}</div>
                                )}
                                {project.progress.ethics_approved !== null && (
                                  <div>Ética aprobada: {project.progress.ethics_approved ? 'Sí' : 'No'}</div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col space-y-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleManageProject(project.id)}
                          >
                            Gestionar Proyecto
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEditRelation(project)}
                          >
                            Editar Relación
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Este hospital no está asociado a ningún proyecto
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coordinators" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Coordinadores por Proyecto</CardTitle>
              <CardDescription>
                Lista de coordinadores asignados a este hospital en cada proyecto
              </CardDescription>
            </CardHeader>
            <CardContent>
              {hospital.projects && hospital.projects.length > 0 ? (
                <div className="space-y-4">
                  {hospital.projects.map((project) => (
                    <div key={project.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium">{project.name}</h3>
                        <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                          {getProjectStatusLabel(project.status)}
                        </Badge>
                      </div>
                      
                      {project.coordinators && project.coordinators.length > 0 ? (
                        <div className="space-y-2">
                          {project.coordinators.map((coordinator) => (
                            <div key={coordinator.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                              <div className="flex items-center space-x-3">
                                <div>
                                  <div className="font-medium">{coordinator.name}</div>
                                  <div className="text-sm text-gray-500">{coordinator.email}</div>
                                </div>
                                <Badge variant={coordinator.is_active ? 'default' : 'secondary'}>
                                  {coordinator.is_active ? 'Activo' : 'Inactivo'}
                                </Badge>
                                <Badge variant="outline">
                                  {coordinator.role}
                                </Badge>
                              </div>
                              <div className="flex space-x-2">
                                <Button size="sm" variant="outline">
                                  Editar
                                </Button>
                                <Button size="sm" variant="outline">
                                  Reasignar
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          No hay coordinadores asignados a este proyecto
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Este hospital no está asociado a ningún proyecto
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detalles del Hospital</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Camas Totales</label>
                    <p className="text-lg">{hospital.total_beds || 'No especificado'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Camas UCI</label>
                    <p className="text-lg">{hospital.icu_beds || 'No especificado'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Quirófanos</label>
                    <p className="text-lg">{hospital.operating_rooms || 'No especificado'}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Cirugías Anuales</label>
                    <p className="text-lg">{hospital.annual_surgeries || 'No especificado'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Fecha de Creación</label>
                    <p className="text-lg">{new Date(hospital.created_at).toLocaleDateString('es-AR')}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contactos</CardTitle>
              <CardDescription>
                Coordinadores y contactos del hospital
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{hospital.coordinator_name || 'No asignado'}</h3>
                      <p className="text-sm text-gray-500">{hospital.coordinator_specialty || 'Coordinador'}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Mail className="h-4 w-4 mr-2" />
                        {hospital.coordinator_email || 'No disponible'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>


      {/* Modal para editar relación hospital-proyecto */}
      <EditProjectHospitalModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        projectHospital={selectedProject}
        project={hospital?.projects?.find(p => p.id === selectedProject?.project_id)}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}