'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Badge } from '../../../../../components/ui/badge';
import { Button } from '../../../../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../../components/ui/tabs';
import { Loader2, ArrowLeft, Building2, MapPin, Calendar, Users, Phone, Mail, FileText, Target } from 'lucide-react';
import { toast } from 'sonner';

interface Hospital {
  id: string;
  name: string;
  province?: string;
  city?: string;
  status: string;
  participated_lasos: boolean;
  created_at: string;
  details?: {
    num_beds?: number;
    num_operating_rooms?: number;
    num_icu_beds?: number;
    avg_weekly_surgeries?: number;
    has_residency_program?: boolean;
    has_preop_clinic?: boolean;
    has_rapid_response_team?: boolean;
    financing_type?: string;
    has_ethics_committee?: boolean;
    university_affiliated?: boolean;
    notes?: string;
  };
  contacts?: Array<{
    id: string;
    role: string;
    name: string;
    email: string;
    phone?: string;
    specialty?: string;
    is_primary: boolean;
  }>;
  project_hospitals?: Array<{
    id: string;
    project: {
      id: string;
      name: string;
      status: string;
    };
    required_periods: number;
    status: string;
    joined_at: string;
  }>;
}

export default function HospitalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const hospitalId = params.id as string;

  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadHospital = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/hospitals/${hospitalId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setHospital(data.hospital);
      } else {
        toast.error('Error al cargar el hospital');
        router.push('/es/admin/projects');
      }
    } catch (error) {
      console.error('Error loading hospital:', error);
      toast.error('Error al cargar el hospital');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (hospitalId) {
      loadHospital();
    }
  }, [hospitalId]);

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    
    const labels = {
      active: 'Activo',
      inactive: 'Inactivo',
      pending: 'Pendiente'
    };

    return (
      <Badge className={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
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

  if (!hospital) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Hospital no encontrado</h2>
          <p className="text-gray-600 mb-4">El hospital que buscas no existe o no tienes permisos para verlo.</p>
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
            <h1 className="text-3xl font-bold text-gray-900">{hospital.name}</h1>
            <p className="text-gray-600">
              {hospital.city && hospital.province 
                ? `${hospital.city}, ${hospital.province}`
                : 'Ubicación no especificada'
              }
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusBadge(hospital.status)}
          {hospital.participated_lasos && (
            <Badge variant="outline" className="bg-blue-100 text-blue-800">
              Participó LASOS
            </Badge>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="details">Detalles</TabsTrigger>
          <TabsTrigger value="contacts">Contactos</TabsTrigger>
          <TabsTrigger value="projects">Proyectos</TabsTrigger>
        </TabsList>

        {/* Resumen Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Información Básica</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      {hospital.city && hospital.province 
                        ? `${hospital.city}, ${hospital.province}`
                        : 'No especificada'
                      }
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      Creado: {new Date(hospital.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Capacidad</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">
                    {hospital.details?.num_beds || 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Camas disponibles
                  </p>
                  <div className="text-sm">
                    <div>Quirófanos: {hospital.details?.num_operating_rooms || 'N/A'}</div>
                    <div>UCI: {hospital.details?.num_icu_beds || 'N/A'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Actividad</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">
                    {hospital.details?.avg_weekly_surgeries || 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Cirugías semanales promedio
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Detalles Tab */}
        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información Detallada</CardTitle>
              <CardDescription>
                Detalles específicos del hospital y sus capacidades
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Capacidades</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Programa de Residencia:</span>
                      <Badge variant={hospital.details?.has_residency_program ? "default" : "secondary"}>
                        {hospital.details?.has_residency_program ? 'Sí' : 'No'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Clínica Pre-operatoria:</span>
                      <Badge variant={hospital.details?.has_preop_clinic ? "default" : "secondary"}>
                        {hospital.details?.has_preop_clinic ? 'Sí' : 'No'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Equipo de Respuesta Rápida:</span>
                      <Badge variant={hospital.details?.has_rapid_response_team ? "default" : "secondary"}>
                        {hospital.details?.has_rapid_response_team ? 'Sí' : 'No'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Comité de Ética:</span>
                      <Badge variant={hospital.details?.has_ethics_committee ? "default" : "secondary"}>
                        {hospital.details?.has_ethics_committee ? 'Sí' : 'No'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Afiliado Universitario:</span>
                      <Badge variant={hospital.details?.university_affiliated ? "default" : "secondary"}>
                        {hospital.details?.university_affiliated ? 'Sí' : 'No'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Información Adicional</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium">Tipo de Financiamiento:</span>
                      <p className="text-sm text-gray-600">
                        {hospital.details?.financing_type || 'No especificado'}
                      </p>
                    </div>
                    {hospital.details?.notes && (
                      <div>
                        <span className="font-medium">Notas:</span>
                        <p className="text-sm text-gray-600 mt-1">
                          {hospital.details.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contactos Tab */}
        <TabsContent value="contacts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contactos del Hospital</CardTitle>
              <CardDescription>
                Personas de contacto y sus roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              {hospital.contacts && hospital.contacts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Especialidad</TableHead>
                      <TableHead>Principal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hospital.contacts.map((contact) => (
                      <TableRow key={contact.id}>
                        <TableCell className="font-medium">{contact.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{contact.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-gray-500" />
                            <span>{contact.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {contact.phone ? (
                            <div className="flex items-center space-x-2">
                              <Phone className="h-4 w-4 text-gray-500" />
                              <span>{contact.phone}</span>
                            </div>
                          ) : (
                            <span className="text-gray-500">No especificado</span>
                          )}
                        </TableCell>
                        <TableCell>{contact.specialty || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={contact.is_primary ? "default" : "secondary"}>
                            {contact.is_primary ? 'Sí' : 'No'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No hay contactos registrados para este hospital
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Proyectos Tab */}
        <TabsContent value="projects" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Proyectos Participantes</CardTitle>
              <CardDescription>
                Proyectos en los que participa este hospital
              </CardDescription>
            </CardHeader>
            <CardContent>
              {hospital.project_hospitals && hospital.project_hospitals.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Proyecto</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Períodos Requeridos</TableHead>
                      <TableHead>Fecha de Ingreso</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hospital.project_hospitals.map((ph) => (
                      <TableRow key={ph.id}>
                        <TableCell className="font-medium">{ph.project.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{ph.status}</Badge>
                        </TableCell>
                        <TableCell>{ph.required_periods}</TableCell>
                        <TableCell>
                          {new Date(ph.joined_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Este hospital no participa en ningún proyecto
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
