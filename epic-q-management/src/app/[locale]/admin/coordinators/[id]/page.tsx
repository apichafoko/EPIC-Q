'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ArrowLeft, User, Mail, Phone, Calendar, Building2, Target, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Coordinator {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  isTemporaryPassword: boolean;
  preferredLanguage: string;
  lastLogin?: string;
  created_at: string;
  hospital?: {
    id: string;
    name: string;
    province?: string;
    city?: string;
  };
  project_coordinators?: Array<{
    id: string;
    project: {
      id: string;
      name: string;
      status: string;
    };
    hospital: {
      id: string;
      name: string;
    };
    role: string;
    invited_at: string;
    accepted_at?: string;
    is_active: boolean;
  }>;
}

export default function CoordinatorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const coordinatorId = params.id as string;

  const [coordinator, setCoordinator] = useState<Coordinator | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadCoordinator = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/users/${coordinatorId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setCoordinator(data.user);
      } else {
        toast.error('Error al cargar el coordinador');
        router.push('/es/admin/projects');
      }
    } catch (error) {
      console.error('Error loading coordinator:', error);
      toast.error('Error al cargar el coordinador');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (coordinatorId) {
      loadCoordinator();
    }
  }, [coordinatorId]);

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge className={isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
        {isActive ? 'Activo' : 'Inactivo'}
      </Badge>
    );
  };

  const getPasswordStatusBadge = (isTemporary: boolean) => {
    return (
      <Badge className={isTemporary ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}>
        {isTemporary ? 'Temporal' : 'Definitiva'}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!coordinator) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Coordinador no encontrado</h2>
          <p className="text-gray-600 mb-4">El coordinador que buscas no existe o no tienes permisos para verlo.</p>
          <Button onClick={() => router.push('/es/admin/projects')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Proyectos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{coordinator.name}</h1>
            <p className="text-gray-600">{coordinator.email}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusBadge(coordinator.isActive)}
          {getPasswordStatusBadge(coordinator.isTemporaryPassword)}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="projects">Proyectos</TabsTrigger>
          <TabsTrigger value="activity">Actividad</TabsTrigger>
        </TabsList>

        {/* Resumen Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Información Personal</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{coordinator.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      Registrado: {new Date(coordinator.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      Idioma: {coordinator.preferredLanguage.toUpperCase()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estado de Cuenta</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Estado:</span>
                    {getStatusBadge(coordinator.isActive)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Contraseña:</span>
                    {getPasswordStatusBadge(coordinator.isTemporaryPassword)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Rol:</span>
                    <Badge variant="outline">{coordinator.role}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Última Actividad</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm">
                    {coordinator.lastLogin ? (
                      <span>
                        Último acceso: {new Date(coordinator.lastLogin).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-gray-500">Nunca ha iniciado sesión</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {coordinator.hospital && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5" />
                  <span>Hospital Asignado</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-lg font-semibold">{coordinator.hospital.name}</div>
                  <div className="text-sm text-gray-600">
                    {coordinator.hospital.city && coordinator.hospital.province 
                      ? `${coordinator.hospital.city}, ${coordinator.hospital.province}`
                      : 'Ubicación no especificada'
                    }
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Proyectos Tab */}
        <TabsContent value="projects" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Proyectos Participantes</CardTitle>
              <CardDescription>
                Proyectos en los que participa este coordinador
              </CardDescription>
            </CardHeader>
            <CardContent>
              {coordinator.project_coordinators && coordinator.project_coordinators.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Proyecto</TableHead>
                      <TableHead>Hospital</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha de Invitación</TableHead>
                      <TableHead>Fecha de Aceptación</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coordinator.project_coordinators.map((pc) => (
                      <TableRow key={pc.id}>
                        <TableCell className="font-medium">{pc.project.name}</TableCell>
                        <TableCell>{pc.hospital.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{pc.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {pc.accepted_at ? (
                              <>
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <Badge className="bg-green-100 text-green-800">Aceptado</Badge>
                              </>
                            ) : (
                              <>
                                <Clock className="h-4 w-4 text-yellow-500" />
                                <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(pc.invited_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {pc.accepted_at ? new Date(pc.accepted_at).toLocaleDateString() : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Este coordinador no participa en ningún proyecto
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Actividad Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Actividad</CardTitle>
              <CardDescription>
                Registro de actividades del coordinador
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Cuenta creada</p>
                      <p className="text-sm text-gray-500">
                        {new Date(coordinator.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">Sistema</Badge>
                </div>

                {coordinator.lastLogin && (
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div>
                        <p className="font-medium">Último acceso</p>
                        <p className="text-sm text-gray-500">
                          {new Date(coordinator.lastLogin).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">Login</Badge>
                  </div>
                )}

                {coordinator.project_coordinators?.map((pc) => (
                  <div key={pc.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <div>
                        <p className="font-medium">
                          {pc.accepted_at ? 'Aceptó invitación' : 'Invitado a proyecto'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {pc.project.name} - {pc.hospital.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {pc.accepted_at 
                            ? new Date(pc.accepted_at).toLocaleString()
                            : new Date(pc.invited_at).toLocaleString()
                          }
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {pc.accepted_at ? 'Aceptado' : 'Pendiente'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
