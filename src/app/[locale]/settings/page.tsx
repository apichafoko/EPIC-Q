'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/auth-context';
import { useTranslations } from '../../../hooks/useTranslations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Switch } from '../../../components/ui/switch';
import { Separator } from '../../../components/ui/separator';
// import { useLoadingState } from '../../../hooks/useLoadingState';
import { toast } from 'sonner';
import { 
  Settings, 
  Bell, 
  Shield, 
  Globe, 
  Clock, 
  MapPin, 
  Eye, 
  EyeOff,
  Save,
  RefreshCw
} from 'lucide-react';

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const { t, locale } = useTranslations();
  // const { isLoading, executeWithLoading } = useLoadingState();
  
  // Estados de carga separados para cada acción
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  const [settings, setSettings] = useState({
    // Notificaciones - Oculto por el momento
    // emailNotifications: true,
    // pushNotifications: true,
    // weeklyReports: false,
    // projectUpdates: true,
    // systemAlerts: true,
    
    // Privacidad - Oculto por el momento
    // profileVisibility: 'private',
    // dataSharing: false,
    // analyticsTracking: true,
    
    // Preferencias de UI
    theme: 'system',
    compactMode: false,
    autoSave: true,
    
    // Zona horaria y región
    timezone: 'America/Argentina/Buenos_Aires',
    country: 'AR',
    language: 'es',
    
    // Seguridad
    twoFactorAuth: false,
    sessionTimeout: '8',
    passwordExpiry: '90'
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Cargar configuración del usuario
  useEffect(() => {
    if (user) {
      setSettings(prev => ({
        ...prev,
        timezone: (user as any).timezone || 'America/Argentina/Buenos_Aires',
        country: (user as any).country || 'AR',
        language: user.preferredLanguage || 'es'
      }));
    }
  }, [user]);

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Configuración guardada exitosamente');
        await refreshUser();
      } else {
        toast.error('Error al guardar la configuración: ' + (data.error || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const changePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Contraseña cambiada exitosamente');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        toast.error('Error al cambiar la contraseña: ' + (data.error || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Error al cambiar la contraseña');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const timezones = [
    { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires (GMT-3)' },
    { value: 'America/Argentina/Cordoba', label: 'Córdoba (GMT-3)' },
    { value: 'America/Argentina/Mendoza', label: 'Mendoza (GMT-3)' },
    { value: 'America/Argentina/Salta', label: 'Salta (GMT-3)' },
    { value: 'America/Argentina/Tucuman', label: 'Tucumán (GMT-3)' },
    { value: 'America/Argentina/Ushuaia', label: 'Ushuaia (GMT-3)' },
    { value: 'America/Sao_Paulo', label: 'São Paulo (GMT-3)' },
    { value: 'America/New_York', label: 'New York (GMT-5)' },
    { value: 'Europe/Madrid', label: 'Madrid (GMT+1)' },
    { value: 'UTC', label: 'UTC (GMT+0)' }
  ];

  const countries = [
    { value: 'AR', label: 'Argentina', flag: '🇦🇷' },
    { value: 'BR', label: 'Brasil', flag: '🇧🇷' },
    { value: 'CL', label: 'Chile', flag: '🇨🇱' },
    { value: 'CO', label: 'Colombia', flag: '🇨🇴' },
    { value: 'MX', label: 'México', flag: '🇲🇽' },
    { value: 'PE', label: 'Perú', flag: '🇵🇪' },
    { value: 'UY', label: 'Uruguay', flag: '🇺🇾' },
    { value: 'US', label: 'Estados Unidos', flag: '🇺🇸' },
    { value: 'ES', label: 'España', flag: '🇪🇸' },
    { value: 'FR', label: 'Francia', flag: '🇫🇷' }
  ];

  const languages = [
    { value: 'es', label: 'Español', flag: '🇪🇸' },
    { value: 'en', label: 'English', flag: '🇺🇸' },
    { value: 'pt', label: 'Português', flag: '🇧🇷' }
  ];

  if (!user) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-600 mt-2">
          Personaliza tu experiencia y gestiona tus preferencias
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notificaciones - Oculto por el momento */}
        {/* 
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
          <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificaciones por Email</Label>
                <p className="text-sm text-gray-500">Recibir notificaciones importantes por correo</p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
              />
                      </div>

                    <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificaciones Push</Label>
                <p className="text-sm text-gray-500">Recibir notificaciones en el navegador</p>
                      </div>
                      <Switch
                checked={settings.pushNotifications}
                onCheckedChange={(checked) => handleSettingChange('pushNotifications', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Reportes Semanales</Label>
                <p className="text-sm text-gray-500">Recibir resúmenes semanales de actividad</p>
                      </div>
                      <Switch
                checked={settings.weeklyReports}
                onCheckedChange={(checked) => handleSettingChange('weeklyReports', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Actualizaciones de Proyecto</Label>
                <p className="text-sm text-gray-500">Notificaciones sobre cambios en proyectos</p>
                      </div>
                      <Switch
                checked={settings.projectUpdates}
                onCheckedChange={(checked) => handleSettingChange('projectUpdates', checked)}
                      />
                    </div>
          </CardContent>
        </Card>
        */}

        {/* Preferencias Regionales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="h-5 w-5" />
              <span>Región e Idioma</span>
            </CardTitle>
            <CardDescription>
              Configura tu zona horaria, país e idioma preferido
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label>Idioma</Label>
              <Select
                value={settings.language}
                onValueChange={(value) => handleSettingChange('language', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      <div className="flex items-center space-x-2">
                        <span>{lang.flag}</span>
                        <span>{lang.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
                  </div>

                    <div className="space-y-3">
              <Label>País</Label>
              <Select
                value={settings.country}
                onValueChange={(value) => handleSettingChange('country', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.value} value={country.value}>
                      <div className="flex items-center space-x-2">
                        <span>{country.flag}</span>
                        <span>{country.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
                    </div>

                    <div className="space-y-3">
              <Label>Zona Horaria</Label>
                      <Select 
                value={settings.timezone}
                onValueChange={(value) => handleSettingChange('timezone', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                        </SelectContent>
                      </Select>
                    </div>
            </CardContent>
          </Card>

        {/* Privacidad - Oculto por el momento */}
        {/* 
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
              <span>Privacidad</span>
              </CardTitle>
            <CardDescription>
              Controla la privacidad de tu información
            </CardDescription>
            </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label>Visibilidad del Perfil</Label>
              <Select
                value={settings.profileVisibility}
                onValueChange={(value) => handleSettingChange('profileVisibility', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Público</SelectItem>
                  <SelectItem value="private">Privado</SelectItem>
                  <SelectItem value="team">Solo Equipo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Compartir Datos</Label>
                <p className="text-sm text-gray-500">Permitir uso de datos para mejoras del sistema</p>
                    </div>
              <Switch
                checked={settings.dataSharing}
                onCheckedChange={(checked) => handleSettingChange('dataSharing', checked)}
              />
                    </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Análisis de Uso</Label>
                <p className="text-sm text-gray-500">Recopilar datos de uso para estadísticas</p>
                  </div>
              <Switch
                checked={settings.analyticsTracking}
                onCheckedChange={(checked) => handleSettingChange('analyticsTracking', checked)}
              />
              </div>
            </CardContent>
          </Card>
        */}

        {/* Cambio de Contraseña */}
          <Card>
            <CardHeader>
                <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Seguridad</span>
                </CardTitle>
            <CardDescription>
              Cambia tu contraseña para mantener tu cuenta segura
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="currentPassword">Contraseña Actual</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                  placeholder="Ingresa tu contraseña actual"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
                </div>

            <div className="space-y-3">
              <Label htmlFor="newPassword">Nueva Contraseña</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                        </div>
                      </div>

            <div className="space-y-3">
              <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                  placeholder="Repite tu nueva contraseña"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

            <Button onClick={changePassword} disabled={isChangingPassword} className="w-full">
              {isChangingPassword ? 'Cambiando...' : 'Cambiar Contraseña'}
            </Button>
            </CardContent>
          </Card>
      </div>

      {/* Botón de Guardar */}
      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={isSavingSettings} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {isSavingSettings ? 'Guardando...' : 'Guardar Configuración'}
        </Button>
      </div>
    </div>
  );
}