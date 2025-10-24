'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/auth-context';
import { useProject } from '../../../../contexts/project-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Building2, 
  Calendar,
  Users,
  ArrowRight,
  Check
} from 'lucide-react';
import { toast } from 'sonner';

interface PendingInvitation {
  id: string;
  invitation_token: string;
  project: {
    id: string;
    name: string;
    description?: string;
    start_date?: string;
    end_date?: string;
  };
  hospital: {
    id: string;
    name: string;
    province: string;
    city: string;
  };
  role: string;
  invited_at: string;
}

export default function PendingInvitationsPage() {
  const { user } = useAuth();
  const { loadProjects } = useProject();
  const router = useRouter();
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadPendingInvitations();
    }
  }, [user]);

  const loadPendingInvitations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/coordinator/invitations/pending?userId=${user?.id}`, {
        credentials: 'include'
      });
      const result = await response.json();
      
      if (result.success) {
        setInvitations(result.invitations);
      } else {
        setError(result.error || 'Error al cargar las invitaciones');
      }
    } catch (error) {
      console.error('Error loading pending invitations:', error);
      setError('Error al cargar las invitaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (invitationId: string, token: string) => {
    try {
      setAccepting(invitationId);
      setError(null);
      
      const response = await fetch('/api/coordinator/invitations/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Invitación aceptada exitosamente');
        // Recargar las invitaciones pendientes
        await loadPendingInvitations();
        // Actualizar el contexto de proyectos para mostrar los proyectos disponibles
        await loadProjects();
      } else {
        toast.error(result.error || 'Error al aceptar la invitación');
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast.error('Error al aceptar la invitación');
    } finally {
      setAccepting(null);
    }
  };

  const handleSkipInvitations = () => {
    router.push('/es/coordinator');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Cargando invitaciones...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Error
              </h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => router.push('/es/coordinator')}>
                Ir al Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                ¡No hay invitaciones pendientes!
              </h3>
              <p className="text-gray-600 mb-4">
                No tienes invitaciones pendientes en este momento.
              </p>
              <Button onClick={() => router.push('/es/coordinator')}>
                Ir al Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Invitaciones Pendientes
          </h1>
          <p className="text-gray-600">
            Tienes {invitations.length} invitación{invitations.length !== 1 ? 'es' : ''} pendiente{invitations.length !== 1 ? 's' : ''} para participar en proyectos.
          </p>
        </div>

        <div className="space-y-6">
          {invitations.map((invitation) => (
            <Card key={invitation.id} className="overflow-hidden">
              <CardHeader className="bg-blue-50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl text-blue-900">
                      {invitation.project.name}
                    </CardTitle>
                    <CardDescription className="text-blue-700">
                      Has sido invitado como coordinador
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-blue-100 text-blue-800">
                    Pendiente
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Información del Proyecto */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 flex items-center">
                      <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                      Información del Proyecto
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium text-gray-700">Proyecto:</span>
                        <span className="ml-2 text-gray-900">{invitation.project.name}</span>
                      </div>
                      {invitation.project.description && (
                        <div>
                          <span className="font-medium text-gray-700">Descripción:</span>
                          <p className="ml-2 text-gray-900">{invitation.project.description}</p>
                        </div>
                      )}
                      {invitation.project.start_date && (
                        <div>
                          <span className="font-medium text-gray-700">Fecha de Inicio:</span>
                          <span className="ml-2 text-gray-900">
                            {new Date(invitation.project.start_date).toLocaleDateString('es-ES')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Información del Hospital */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 flex items-center">
                      <Building2 className="h-5 w-5 mr-2 text-green-600" />
                      Hospital Asignado
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium text-gray-700">Hospital:</span>
                        <span className="ml-2 text-gray-900">{invitation.hospital.name}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Ubicación:</span>
                        <span className="ml-2 text-gray-900">
                          {invitation.hospital.city}, {invitation.hospital.province}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Responsabilidades */}
                <div className="mt-6 bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Como coordinador serás responsable de:</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <ArrowRight className="h-4 w-4 mr-2 mt-0.5 text-gray-500 flex-shrink-0" />
                      Completar la información del hospital
                    </li>
                    <li className="flex items-start">
                      <ArrowRight className="h-4 w-4 mr-2 mt-0.5 text-gray-500 flex-shrink-0" />
                      Gestionar el progreso del comité de ética
                    </li>
                    <li className="flex items-start">
                      <ArrowRight className="h-4 w-4 mr-2 mt-0.5 text-gray-500 flex-shrink-0" />
                      Configurar los períodos de reclutamiento
                    </li>
                    <li className="flex items-start">
                      <ArrowRight className="h-4 w-4 mr-2 mt-0.5 text-gray-500 flex-shrink-0" />
                      Supervisar el avance del proyecto
                    </li>
                  </ul>
                </div>

                {/* Botones de Acción */}
                <div className="flex space-x-4 mt-6">
                  <Button 
                    onClick={() => handleAcceptInvitation(invitation.id, invitation.invitation_token)}
                    disabled={accepting === invitation.id}
                    className="flex-1"
                  >
                    {accepting === invitation.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Aceptando...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Aceptar Invitación
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Botón para saltar invitaciones */}
        <div className="mt-8 text-center">
          <Button 
            variant="outline" 
            onClick={handleSkipInvitations}
            className="mr-4"
          >
            Saltar por ahora
          </Button>
          <Button onClick={() => router.push('/es/coordinator')}>
            Ir al Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
