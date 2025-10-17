'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Users, 
  Bell, 
  Save,
  Plus,
  Edit,
  Trash2,
  Mail,
  Calendar,
  Shield
} from 'lucide-react';

export default function SettingsPage() {
  const [generalSettings, setGeneralSettings] = useState({
    studyStartDate: '2024-01-01',
    studyDuration: 24,
    targetHospitals: 50,
    targetCases: 15000
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailAlerts: true,
    inactivityAlerts: true,
    lowCompletionAlerts: true,
    additionalEmails: '',
    reportFrequency: 'weekly'
  });

  const [users] = useState([
    {
      id: '1',
      name: 'Admin EPIC-Q',
      email: 'admin@epicq.com',
      role: 'admin',
      hospital: null,
      status: 'active'
    },
    {
      id: '2',
      name: 'Dr. María González',
      email: 'maria.gonzalez@hospital.com',
      role: 'coordinator',
      hospital: 'Hospital Italiano de Buenos Aires',
      status: 'active'
    },
    {
      id: '3',
      name: 'Dr. Carlos López',
      email: 'carlos.lopez@hospital.com',
      role: 'collaborator',
      hospital: 'Hospital Fernández',
      status: 'active'
    }
  ]);

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'coordinator':
        return 'Coordinador';
      case 'collaborator':
        return 'Colaborador';
      default:
        return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'coordinator':
        return 'bg-blue-100 text-blue-800';
      case 'collaborator':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    return status === 'active' ? 'Activo' : 'Inactivo';
  };

  const handleGeneralSave = () => {
    console.log('Guardando configuración general:', generalSettings);
    // Aquí se implementaría la lógica de guardado
  };

  const handleNotificationSave = () => {
    console.log('Guardando configuración de notificaciones:', notificationSettings);
    // Aquí se implementaría la lógica de guardado
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-600 mt-2">
          Gestiona la configuración del sistema EPIC-Q
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="users">Usuarios</TabsTrigger>
          <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
        </TabsList>

        {/* Configuración General */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Configuración General del Estudio</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="studyStartDate">Fecha de Inicio del Estudio</Label>
                  <Input
                    id="studyStartDate"
                    type="date"
                    value={generalSettings.studyStartDate}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, studyStartDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studyDuration">Duración Total Prevista (meses)</Label>
                  <Input
                    id="studyDuration"
                    type="number"
                    value={generalSettings.studyDuration}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, studyDuration: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="targetHospitals">Meta de Hospitales</Label>
                  <Input
                    id="targetHospitals"
                    type="number"
                    value={generalSettings.targetHospitals}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, targetHospitals: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetCases">Meta de Casos Totales</Label>
                  <Input
                    id="targetCases"
                    type="number"
                    value={generalSettings.targetCases}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, targetCases: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleGeneralSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Configuración
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gestión de Usuarios */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Usuarios del Sistema</span>
                </CardTitle>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Invitar Usuario
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-gray-500" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        {user.hospital && (
                          <div className="text-xs text-gray-400">{user.hospital}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className={getRoleColor(user.role)}>
                        {getRoleLabel(user.role)}
                      </Badge>
                      <Badge className={getStatusColor(user.status)}>
                        {getStatusLabel(user.status)}
                      </Badge>
                      <div className="flex items-center space-x-1">
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuración de Notificaciones */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Configuración de Notificaciones</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emailAlerts">Recibir alertas por email</Label>
                    <p className="text-sm text-gray-500">Recibe notificaciones importantes por correo electrónico</p>
                  </div>
                  <Switch
                    id="emailAlerts"
                    checked={notificationSettings.emailAlerts}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, emailAlerts: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="inactivityAlerts">Alertas de inactividad</Label>
                    <p className="text-sm text-gray-500">Notifica cuando un hospital no registra actividad por más de 30 días</p>
                  </div>
                  <Switch
                    id="inactivityAlerts"
                    checked={notificationSettings.inactivityAlerts}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, inactivityAlerts: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="lowCompletionAlerts">Alertas de baja completitud</Label>
                    <p className="text-sm text-gray-500">Notifica cuando la completitud de casos es menor al 70%</p>
                  </div>
                  <Switch
                    id="lowCompletionAlerts"
                    checked={notificationSettings.lowCompletionAlerts}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, lowCompletionAlerts: checked }))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="additionalEmails">Emails adicionales para CC</Label>
                  <Input
                    id="additionalEmails"
                    value={notificationSettings.additionalEmails}
                    onChange={(e) => setNotificationSettings(prev => ({ ...prev, additionalEmails: e.target.value }))}
                    placeholder="email1@ejemplo.com, email2@ejemplo.com"
                  />
                  <p className="text-sm text-gray-500">Separa múltiples emails con comas</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reportFrequency">Frecuencia de reportes automáticos</Label>
                  <Select 
                    value={notificationSettings.reportFrequency} 
                    onValueChange={(value) => setNotificationSettings(prev => ({ ...prev, reportFrequency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Diario</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleNotificationSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Configuración
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Configuración de Alertas por Tipo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Configuración de Alertas por Tipo</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { type: 'Sin Actividad', description: 'Hospital sin actividad por más de 30 días', defaultDays: 30 },
                  { type: 'Baja Completitud', description: 'Completitud de casos menor al 70%', defaultDays: 7 },
                  { type: 'Período Próximo', description: 'Período de reclutamiento en 7 días', defaultDays: 7 },
                  { type: 'Ética Pendiente', description: 'Aprobación ética pendiente por más de 60 días', defaultDays: 60 }
                ].map((alertType, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{alertType.type}</div>
                      <div className="text-sm text-gray-500">{alertType.description}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Input 
                        type="number" 
                        defaultValue={alertType.defaultDays}
                        className="w-20"
                      />
                      <span className="text-sm text-gray-500">días</span>
                    </div>
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
