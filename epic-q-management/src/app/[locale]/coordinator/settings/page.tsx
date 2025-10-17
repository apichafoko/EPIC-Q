'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useTranslations } from '@/hooks/useTranslations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, CheckCircle, Globe, Bell, Shield } from 'lucide-react';

export default function CoordinatorSettingsPage() {
  const { user } = useAuth();
  const { t, locale } = useTranslations();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  const [settings, setSettings] = useState({
    // Language settings
    language: locale,
    
    // Notification settings
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    weeklyReports: true,
    urgentAlerts: true,
    protocolUpdates: true,
    trainingReminders: false,
    
    // Privacy settings
    dataSharing: false,
    analytics: true,
    marketing: false,
    
    // Account settings
    timezone: 'America/Argentina/Buenos_Aires',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h'
  });

  const handleSettingChange = (field: string, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const languages = [
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
  ];

  const timezones = [
    'America/Argentina/Buenos_Aires',
    'America/Argentina/Cordoba',
    'America/Argentina/Mendoza',
    'America/Argentina/Salta',
    'America/Argentina/Tucuman',
    'America/Argentina/Ushuaia'
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('common.settings')}</h1>
        <p className="text-gray-600 mt-2">
          Configura tus preferencias y notificaciones
        </p>
      </div>

      {/* Language Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5" />
            <span>Idioma</span>
          </CardTitle>
          <CardDescription>
            Selecciona tu idioma preferido para la interfaz
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="language">Idioma de la Interfaz</Label>
              <Select value={settings.language} onValueChange={(value) => handleSettingChange('language', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar idioma" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Alert>
              <AlertDescription>
                El cambio de idioma se aplicará inmediatamente y se guardará para futuras sesiones.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Notificaciones</span>
          </CardTitle>
          <CardDescription>
            Configura cómo y cuándo recibir notificaciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-medium">Canales de Notificación</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="emailNotifications">Notificaciones por Email</Label>
                    <p className="text-sm text-gray-500">
                      Recibe notificaciones importantes por correo electrónico
                    </p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="pushNotifications">Notificaciones Push</Label>
                    <p className="text-sm text-gray-500">
                      Recibe notificaciones en tu dispositivo móvil
                    </p>
                  </div>
                  <Switch
                    id="pushNotifications"
                    checked={settings.pushNotifications}
                    onCheckedChange={(checked) => handleSettingChange('pushNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="smsNotifications">Notificaciones SMS</Label>
                    <p className="text-sm text-gray-500">
                      Recibe alertas urgentes por mensaje de texto
                    </p>
                  </div>
                  <Switch
                    id="smsNotifications"
                    checked={settings.smsNotifications}
                    onCheckedChange={(checked) => handleSettingChange('smsNotifications', checked)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Tipos de Notificación</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="weeklyReports">Reportes Semanales</Label>
                    <p className="text-sm text-gray-500">
                      Recibe un resumen semanal del progreso del estudio
                    </p>
                  </div>
                  <Switch
                    id="weeklyReports"
                    checked={settings.weeklyReports}
                    onCheckedChange={(checked) => handleSettingChange('weeklyReports', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="urgentAlerts">Alertas Urgentes</Label>
                    <p className="text-sm text-gray-500">
                      Recibe notificaciones inmediatas para asuntos urgentes
                    </p>
                  </div>
                  <Switch
                    id="urgentAlerts"
                    checked={settings.urgentAlerts}
                    onCheckedChange={(checked) => handleSettingChange('urgentAlerts', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="protocolUpdates">Actualizaciones de Protocolo</Label>
                    <p className="text-sm text-gray-500">
                      Recibe notificaciones cuando se actualice el protocolo del estudio
                    </p>
                  </div>
                  <Switch
                    id="protocolUpdates"
                    checked={settings.protocolUpdates}
                    onCheckedChange={(checked) => handleSettingChange('protocolUpdates', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="trainingReminders">Recordatorios de Capacitación</Label>
                    <p className="text-sm text-gray-500">
                      Recibe recordatorios sobre webinars y capacitaciones
                    </p>
                  </div>
                  <Switch
                    id="trainingReminders"
                    checked={settings.trainingReminders}
                    onCheckedChange={(checked) => handleSettingChange('trainingReminders', checked)}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Privacidad y Datos</span>
          </CardTitle>
          <CardDescription>
            Controla cómo se utilizan tus datos y información
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="dataSharing">Compartir Datos Anónimos</Label>
                <p className="text-sm text-gray-500">
                  Permite el uso de datos anónimos para investigación científica
                </p>
              </div>
              <Switch
                id="dataSharing"
                checked={settings.dataSharing}
                onCheckedChange={(checked) => handleSettingChange('dataSharing', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="analytics">Analíticas de Uso</Label>
                <p className="text-sm text-gray-500">
                  Permite el análisis de uso para mejorar la plataforma
                </p>
              </div>
              <Switch
                id="analytics"
                checked={settings.analytics}
                onCheckedChange={(checked) => handleSettingChange('analytics', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="marketing">Comunicaciones de Marketing</Label>
                <p className="text-sm text-gray-500">
                  Recibe información sobre nuevos estudios y oportunidades
                </p>
              </div>
              <Switch
                id="marketing"
                checked={settings.marketing}
                onCheckedChange={(checked) => handleSettingChange('marketing', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Regional Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración Regional</CardTitle>
          <CardDescription>
            Ajusta la configuración regional y de formato
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timezone">Zona Horaria</Label>
              <Select value={settings.timezone} onValueChange={(value) => handleSettingChange('timezone', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar zona horaria" />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz.replace('America/Argentina/', '')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateFormat">Formato de Fecha</Label>
              <Select value={settings.dateFormat} onValueChange={(value) => handleSettingChange('dateFormat', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar formato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeFormat">Formato de Hora</Label>
              <Select value={settings.timeFormat} onValueChange={(value) => handleSettingChange('timeFormat', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar formato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">24 horas</SelectItem>
                  <SelectItem value="12h">12 horas (AM/PM)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Guardar Configuración
        </Button>
      </div>

      {/* Save Status */}
      {isSaved && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Configuración guardada exitosamente
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
