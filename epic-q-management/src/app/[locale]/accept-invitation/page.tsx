'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from '@/hooks/useTranslations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Building2, 
  Calendar,
  Users,
  ArrowRight
} from 'lucide-react';

interface InvitationData {
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
  user: {
    name: string;
    email: string;
  };
  invited_at: string;
}

export default function AcceptInvitationPage() {
  const { t } = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (token) {
      loadInvitation();
    } else {
      setError('Token de invitación no encontrado');
      setLoading(false);
    }
  }, [token]);

  const loadInvitation = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/coordinator/invitations/accept?token=${token}`);
      const result = await response.json();
      
      if (result.success) {
        setInvitation(result.invitation);
      } else {
        setError(result.error || 'Error al cargar la invitación');
      }
    } catch (error) {
      console.error('Error loading invitation:', error);
      setError('Error al cargar la invitación');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    try {
      setAccepting(true);
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
        setSuccess(true);
        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          router.push('/es/auth/login');
        }, 3000);
      } else {
        setError(result.error || 'Error al aceptar la invitación');
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      setError('Error al aceptar la invitación');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Cargando invitación...</p>
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
              <Button onClick={() => router.push('/es/auth/login')}>
                Ir al Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                ¡Invitación Aceptada!
              </h3>
              <p className="text-gray-600 mb-4">
                Has sido agregado exitosamente al proyecto <strong>{invitation?.project.name}</strong>.
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Serás redirigido al login en unos segundos...
              </p>
              <Button onClick={() => router.push('/es/auth/login')}>
                Ir al Login Ahora
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Invitación no encontrada
              </h3>
              <p className="text-gray-600 mb-4">
                La invitación no pudo ser cargada o ya ha expirado.
              </p>
              <Button onClick={() => router.push('/es/auth/login')}>
                Ir al Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <div className="h-16 w-16 bg-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">EQ</span>
            </div>
          </div>
          <CardTitle className="text-2xl">Invitación al Proyecto</CardTitle>
          <CardDescription>
            Has sido invitado a participar como coordinador en el sistema EPIC-Q
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Información del Proyecto */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Información del Proyecto
            </h3>
            <div className="space-y-2">
              <div>
                <span className="font-medium text-blue-800">Proyecto:</span>
                <span className="ml-2 text-blue-700">{invitation.project.name}</span>
              </div>
              {invitation.project.description && (
                <div>
                  <span className="font-medium text-blue-800">Descripción:</span>
                  <p className="ml-2 text-blue-700">{invitation.project.description}</p>
                </div>
              )}
              {invitation.project.start_date && (
                <div>
                  <span className="font-medium text-blue-800">Fecha de Inicio:</span>
                  <span className="ml-2 text-blue-700">
                    {new Date(invitation.project.start_date).toLocaleDateString('es-ES')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Información del Hospital */}
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-3 flex items-center">
              <Building2 className="h-5 w-5 mr-2" />
              Hospital Asignado
            </h3>
            <div className="space-y-2">
              <div>
                <span className="font-medium text-green-800">Hospital:</span>
                <span className="ml-2 text-green-700">{invitation.hospital.name}</span>
              </div>
              <div>
                <span className="font-medium text-green-800">Ubicación:</span>
                <span className="ml-2 text-green-700">
                  {invitation.hospital.city}, {invitation.hospital.province}
                </span>
              </div>
            </div>
          </div>

          {/* Información del Usuario */}
          <div className="bg-purple-50 rounded-lg p-4">
            <h3 className="font-semibold text-purple-900 mb-3 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Tu Información
            </h3>
            <div className="space-y-2">
              <div>
                <span className="font-medium text-purple-800">Nombre:</span>
                <span className="ml-2 text-purple-700">{invitation.user.name}</span>
              </div>
              <div>
                <span className="font-medium text-purple-800">Email:</span>
                <span className="ml-2 text-purple-700">{invitation.user.email}</span>
              </div>
            </div>
          </div>

          {/* Responsabilidades */}
          <div className="bg-gray-50 rounded-lg p-4">
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

          {/* Advertencia */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-yellow-800 mb-1">Importante</h4>
                <p className="text-yellow-700 text-sm">
                  Si no tienes una cuenta en el sistema, se creará automáticamente al aceptar la invitación. 
                  Asegúrate de guardar tus credenciales de acceso.
                </p>
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex space-x-4">
            <Button 
              variant="outline" 
              onClick={() => router.push('/es/auth/login')}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleAcceptInvitation} 
              disabled={accepting}
              className="flex-1"
            >
              {accepting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Aceptar Invitación
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
