'use client';

import { useState } from 'react';
import { useTranslations } from '../../../../hooks/useTranslations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { Alert, AlertDescription } from '../../../../components/ui/alert';
import { Label } from '../../../../components/ui/label';
import { Input } from '../../../../components/ui/input';
import { 
  Users, 
  Copy, 
  Eye, 
  EyeOff, 
  ExternalLink,
  Key,
  User,
  Shield,
  Info
} from 'lucide-react';
import { LoadingButton } from '../../../../components/ui/loading-button';
import { useLoadingState } from '../../../../hooks/useLoadingState';
import { toast } from 'sonner';

export default function RedCapUsersPage() {
  const { t } = useTranslations();
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});

  // Mock data for RedCap users
  const redcapUsers = {
    coordinator: {
      id: 'coord_001',
      name: 'Dr. María González',
      email: 'maria.gonzalez@hospital.com',
      username: 'mgonzalez_epicq',
      password: 'EpicQ2024!',
      role: 'Coordinador Principal',
      permissions: ['Crear casos', 'Editar casos', 'Exportar datos', 'Ver reportes'],
      status: 'active',
      lastLogin: '2024-01-15T10:30:00Z',
      createdDate: '2024-01-01T00:00:00Z'
    },
    collaborators: [
      {
        id: 'collab_001',
        name: 'Dr. Carlos Rodríguez',
        email: 'carlos.rodriguez@hospital.com',
        username: 'crodriguez_epicq',
        password: 'RedCap2024!',
        role: 'Cirujano',
        permissions: ['Crear casos', 'Editar casos propios'],
        status: 'active',
        lastLogin: '2024-01-14T16:45:00Z',
        createdDate: '2024-01-05T00:00:00Z'
      },
      {
        id: 'collab_002',
        name: 'Dra. Ana Martínez',
        email: 'ana.martinez@hospital.com',
        username: 'amartinez_epicq',
        password: 'Ana2024!',
        role: 'Anestesióloga',
        permissions: ['Crear casos', 'Editar casos propios'],
        status: 'active',
        lastLogin: '2024-01-13T09:15:00Z',
        createdDate: '2024-01-08T00:00:00Z'
      },
      {
        id: 'collab_003',
        name: 'Lic. Pedro López',
        email: 'pedro.lopez@hospital.com',
        username: 'plopez_epicq',
        password: 'Pedro2024!',
        role: 'Enfermero',
        permissions: ['Ver casos', 'Exportar datos básicos'],
        status: 'inactive',
        lastLogin: '2024-01-10T14:20:00Z',
        createdDate: '2024-01-12T00:00:00Z'
      }
    ]
  };

  const togglePasswordVisibility = (userId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Activo</Badge>;
      case 'inactive':
        return <Badge variant="outline">Inactivo</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('coordinator.redcapUsers')}</h1>
        <p className="text-gray-600 mt-2">
          Información de usuarios de RedCap para tu hospital
        </p>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Esta información es gestionada por el administrador del sistema. 
          Si necesitas cambios en los usuarios o permisos, contacta al comité investigador.
        </AlertDescription>
      </Alert>

      {/* RedCap Access Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ExternalLink className="h-5 w-5" />
            <span>Acceso a RedCap</span>
          </CardTitle>
          <CardDescription>
            Información para acceder al sistema RedCap
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">URL de RedCap</Label>
              <div className="flex items-center space-x-2">
                <Input
                  value="https://redcap.epicq.org"
                  readOnly
                  className="bg-gray-50"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard('https://redcap.epicq.org')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Proyecto EPIC-Q</Label>
              <div className="flex items-center space-x-2">
                <Input
                  value="EPIC-Q-2024"
                  readOnly
                  className="bg-gray-50"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard('EPIC-Q-2024')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coordinator User */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Coordinador Principal</span>
          </CardTitle>
          <CardDescription>
            Tu cuenta de coordinador con permisos completos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Nombre</Label>
                <Input
                  value={redcapUsers.coordinator.name}
                  readOnly
                  className="bg-gray-50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Email</Label>
                <Input
                  value={redcapUsers.coordinator.email}
                  readOnly
                  className="bg-gray-50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Usuario</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    value={redcapUsers.coordinator.username}
                    readOnly
                    className="bg-gray-50"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(redcapUsers.coordinator.username)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Contraseña</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type={showPasswords[redcapUsers.coordinator.id] ? 'text' : 'password'}
                    value={redcapUsers.coordinator.password}
                    readOnly
                    className="bg-gray-50"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => togglePasswordVisibility(redcapUsers.coordinator.id)}
                  >
                    {showPasswords[redcapUsers.coordinator.id] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(redcapUsers.coordinator.password)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Permisos</Label>
              <div className="flex flex-wrap gap-2">
                {redcapUsers.coordinator.permissions.map((permission, index) => (
                  <Badge key={index} variant="outline">
                    {permission}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Estado</Label>
                <div>{getStatusBadge(redcapUsers.coordinator.status)}</div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Último Acceso</Label>
                <div className="text-sm text-gray-600">
                  {formatDate(redcapUsers.coordinator.lastLogin)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Collaborators */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Colaboradores</span>
          </CardTitle>
          <CardDescription>
            Usuarios colaboradores del hospital
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {redcapUsers.collaborators.map((collaborator) => (
              <div key={collaborator.id} className="border rounded-lg p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{collaborator.name}</h3>
                    {getStatusBadge(collaborator.status)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Email</Label>
                      <Input
                        value={collaborator.email}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Rol</Label>
                      <Input
                        value={collaborator.role}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Usuario</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          value={collaborator.username}
                          readOnly
                          className="bg-gray-50"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(collaborator.username)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Contraseña</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          type={showPasswords[collaborator.id] ? 'text' : 'password'}
                          value={collaborator.password}
                          readOnly
                          className="bg-gray-50"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => togglePasswordVisibility(collaborator.id)}
                        >
                          {showPasswords[collaborator.id] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(collaborator.password)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Permisos</Label>
                    <div className="flex flex-wrap gap-2">
                      {collaborator.permissions.map((permission, index) => (
                        <Badge key={index} variant="outline">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Último Acceso</Label>
                      <div className="text-sm text-gray-600">
                        {formatDate(collaborator.lastLogin)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Fecha de Creación</Label>
                      <div className="text-sm text-gray-600">
                        {formatDate(collaborator.createdDate)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Key className="h-5 w-5" />
            <span>Instrucciones de Acceso</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Para acceder a RedCap:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                <li>Ve a la URL de RedCap: <code className="bg-gray-100 px-1 rounded">https://redcap.epicq.org</code></li>
                <li>Inicia sesión con tu usuario y contraseña</li>
                <li>Selecciona el proyecto &quot;EPIC-Q-2024&quot;</li>
                <li>Comienza a registrar casos según el protocolo</li>
              </ol>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Recomendaciones de Seguridad:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li>No compartas tus credenciales con otros usuarios</li>
                <li>Cambia tu contraseña periódicamente</li>
                <li>Cierra sesión cuando termines de trabajar</li>
                <li>Contacta al administrador si sospechas de acceso no autorizado</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
